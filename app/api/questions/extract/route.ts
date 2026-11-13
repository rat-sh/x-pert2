import { NextRequest, NextResponse } from 'next/server';
import { consumeExtractionRequest, hasSupportedMagicBytes, parseQuestionsJson } from './extraction-utils';

export const runtime = 'nodejs';
export const maxDuration = 120;

type GeminiFile = {
  uri?: string;
  mimeType?: string;
  state?: string;
};

const geminiApiBase = 'https://generativelanguage.googleapis.com';
const maximumFileBytes = 10 * 1024 * 1024;
const supportedTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function responseError(message: string, status = 422) {
  return NextResponse.json({ error: message }, { status });
}

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function ensureTeacher(request: NextRequest): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get('authorization');
  if (!url || !key || !token) return null;

  const current = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: key, authorization: token },
    cache: 'no-store',
  });
  if (!current.ok) return null;
  const user = await current.json() as { id?: string };
  if (!user.id) return null;

  const profile = await fetch(`${url}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}&select=role`, {
    headers: { apikey: key, authorization: token },
    cache: 'no-store',
  });
  if (!profile.ok) return null;
  const rows = await profile.json() as Array<{ role?: string }>;
  return rows[0]?.role === 'teacher' ? user.id : null;
}

export async function POST(request: NextRequest) {
  let apiKey: string | undefined;
  let remoteFileName: string | null = null;

  try {
    const userId = await ensureTeacher(request);
    if (!userId) return responseError('Only signed-in teachers can extract questions.', 403);
    if (!consumeExtractionRequest(userId)) return responseError('Extraction rate limit reached. Try again later.', 429);

    apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return responseError('Question extraction is not configured on this deployment.', 503);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return responseError('Choose a PDF, image, or Word document first.', 400);
    if (file.size === 0) return responseError('The selected file is empty.', 400);
    if (file.size > maximumFileBytes) return responseError('Files must be 10 MB or smaller.', 413);

    const mimeType = file.type;
    if (!supportedTypes.has(mimeType)) return responseError('Unsupported file type. Use PDF, PNG, JPG, or DOCX.', 415);

    const fileBuffer = await file.arrayBuffer();
    if (!hasSupportedMagicBytes(mimeType, new Uint8Array(fileBuffer))) {
      return responseError('The file contents do not match the selected file type.', 415);
    }

    const apiHeaders = { 'x-goog-api-key': apiKey };
    const start = await fetch(`${geminiApiBase}/upload/v1beta/files`, {
      method: 'POST',
      headers: {
        ...apiHeaders,
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(file.size),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: 'question-source' } }),
    });
    const uploadUrl = start.headers.get('x-goog-upload-url');
    if (!start.ok || !uploadUrl) return responseError('The extraction provider could not accept this file.', 502);

    const uploaded = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        ...apiHeaders,
        'Content-Length': String(file.size),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: fileBuffer,
    });
    if (!uploaded.ok) return responseError('The extraction provider could not finish processing this file.', 502);
    const uploadData = await uploaded.json() as { file?: GeminiFile };
    let remoteFile = uploadData.file;
    if (!remoteFile?.uri) return responseError('The file could not be prepared for extraction.', 502);
    remoteFileName = remoteFile.uri.split('/').pop() ?? null;
    if (!remoteFileName) return responseError('The file could not be prepared for extraction.', 502);

    try {
      for (let attempt = 0; remoteFile.state && remoteFile.state !== 'ACTIVE' && attempt < 20; attempt += 1) {
        if (remoteFile.state === 'FAILED') return responseError('The document could not be read. Try a clearer file or manual entry.');
        await pause(1_000);
        const fileState = await fetch(`${geminiApiBase}/v1beta/files/${encodeURIComponent(remoteFileName)}`, {
          headers: apiHeaders,
          cache: 'no-store',
        });
        if (!fileState.ok) return responseError('The extraction provider could not prepare this file.', 502);
        const stateBody = await fileState.json() as { file?: GeminiFile } & GeminiFile;
        remoteFile = stateBody.file ?? stateBody;
        if (!remoteFile?.uri) return responseError('The file could not be prepared for extraction.', 502);
      }
      if (remoteFile.state && remoteFile.state !== 'ACTIVE') {
        return responseError('The file is still being prepared. Please try again shortly.', 504);
      }

      const prompt = `Extract every assessable question from this educational PDF, image, or Word document. Return JSON only, with no markdown or explanation. The top-level value must be an array. Each object must exactly use: question_text, question_type (mcq|true_false|numerical|theoretical), options (string array without A)/B)/C)/D) labels; [] if not MCQ), correct_answer (the full matching option text, never just A/B/C/D; empty string if unknown), marks, positive_marks, negative_marks, difficulty (easy|medium|hard), chapter_tag, section_title. Preserve the document's actual section headings in section_title for every question in that section. Preserve mathematical notation, symbols, formulas, tables, and labelled values accurately using Unicode or plain-text notation where needed. Read diagrams, charts, figures, and images as visual context; include their labels, values, and essential relationships in question_text when they are needed to solve the question. If the document has a separate answer key, use its question-number-to-letter mapping to set correct_answer to the corresponding full option text. Do not invent answers or unreadable content; leave correct_answer empty or omit partial questions rather than guessing.`;
      const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
      const generated = await fetch(`${geminiApiBase}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { ...apiHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generationConfig: { responseMimeType: 'application/json', temperature: 0 },
          contents: [{ parts: [{ text: prompt }, { file_data: { mime_type: remoteFile.mimeType ?? mimeType, file_uri: remoteFile.uri } }] }],
        }),
      });
      if (!generated.ok) return responseError('Question extraction failed. Try again or use manual entry.', 502);

      const output = await generated.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const responseText = output.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
      const normalized = parseQuestionsJson(responseText);
      if (!normalized) {
        return responseError('The document could not be reliably read. Try a clearer file or manual entry.');
      }

      if (!normalized.questions.length) return responseError('No reliable questions were found. Try a clearer file or manual entry.');
      return NextResponse.json(normalized);
    } finally {
      if (remoteFileName) {
        try {
          await fetch(`${geminiApiBase}/v1beta/files/${encodeURIComponent(remoteFileName)}`, {
            method: 'DELETE',
            headers: apiHeaders,
          });
        } catch {
          // Cleanup is best-effort; do not expose provider errors or source content.
        }
      }
    }
  } catch {
    return responseError('Could not extract questions from this file. Try manual entry.', 500);
  }
}
