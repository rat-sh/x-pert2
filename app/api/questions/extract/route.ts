import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

type ExtractedQuestion = {
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'numerical' | 'theoretical';
  options: string[];
  correct_answer: string;
  marks: number;
  positive_marks: number;
  negative_marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  chapter_tag?: string;
  section_title?: string;
};

type GeminiFile = {
  uri?: string;
  mimeType?: string;
  state?: string;
};

const supportedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword']);
const geminiApiBase = 'https://generativelanguage.googleapis.com';

function responseError(message: string, status = 422) {
  return NextResponse.json({ error: message }, { status });
}

async function geminiError(response: Response, fallback: string) {
  try {
    const body = await response.json() as { error?: { message?: string } };
    const detail = body.error?.message?.replace(/\s+/g, ' ').trim();
    return detail ? `${fallback}: ${detail}` : fallback;
  } catch {
    return fallback;
  }
}

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function normalizeQuestions(value: unknown): ExtractedQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): ExtractedQuestion[] => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Record<string, unknown>;
    const text = typeof candidate.question_text === 'string' ? candidate.question_text.trim() : '';
    if (!text) return [];
    const rawType = String(candidate.question_type ?? 'mcq');
    const question_type = rawType === 'true_false' || rawType === 'numerical' || rawType === 'theoretical' ? rawType : 'mcq';
    const options = Array.isArray(candidate.options) ? candidate.options.filter((option): option is string => typeof option === 'string' && option.trim().length > 0) : [];
    return [{
      question_text: text,
      question_type,
      options: question_type === 'mcq' ? options : [],
      correct_answer: typeof candidate.correct_answer === 'string' ? candidate.correct_answer.trim() : '',
      marks: Number(candidate.marks) > 0 ? Number(candidate.marks) : 1,
      positive_marks: Number(candidate.positive_marks) > 0 ? Number(candidate.positive_marks) : (Number(candidate.marks) > 0 ? Number(candidate.marks) : 1),
      negative_marks: Number(candidate.negative_marks) >= 0 ? Number(candidate.negative_marks) : 0,
      difficulty: candidate.difficulty === 'easy' || candidate.difficulty === 'hard' ? candidate.difficulty : 'medium',
      chapter_tag: typeof candidate.chapter_tag === 'string' ? candidate.chapter_tag.trim() : undefined,
      section_title: typeof candidate.section_title === 'string' ? candidate.section_title.trim() : undefined,
    }];
  });
}

async function ensureTeacher(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = request.headers.get('authorization');
  if (!url || !key || !token) return false;
  const current = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, authorization: token }, cache: 'no-store' });
  if (!current.ok) return false;
  const user = await current.json() as { id?: string };
  if (!user.id) return false;
  const profile = await fetch(`${url}/rest/v1/users?id=eq.${encodeURIComponent(user.id)}&select=role`, { headers: { apikey: key, authorization: token }, cache: 'no-store' });
  if (!profile.ok) return false;
  const rows = await profile.json() as Array<{ role?: string }>;
  return rows[0]?.role === 'teacher';
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensureTeacher(request))) return responseError('Only signed-in teachers can extract questions.', 403);
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return responseError('Question extraction is not configured on this deployment.', 503);
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return responseError('Choose a PDF, image, or Word document first.', 400);
    const mimeType = file.type || 'application/octet-stream';
    if (!supportedTypes.has(mimeType)) return responseError('Unsupported file type. Use a PDF, image, or Word document.');
    if (file.size === 0 || file.size > 50 * 1024 * 1024) return responseError('Files must be between 1 byte and 50 MB.');

    const start = await fetch(`${geminiApiBase}/upload/v1beta/files?key=${apiKey}`, {
      method: 'POST', headers: {
        'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': String(file.size), 'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      }, body: JSON.stringify({ file: { display_name: file.name } }),
    });
    const uploadUrl = start.headers.get('x-goog-upload-url');
    if (!start.ok || !uploadUrl) return responseError(await geminiError(start, 'Gemini rejected the file upload'), 502);
    const uploaded = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Length': String(file.size), 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' }, body: await file.arrayBuffer() });
    if (!uploaded.ok) return responseError(await geminiError(uploaded, 'Gemini could not finish uploading this file'), 502);
    const uploadData = await uploaded.json() as { file?: GeminiFile };
    let remoteFile = uploadData.file;
    if (!remoteFile?.uri) return responseError('The uploaded file could not be prepared for extraction.', 502);
    for (let attempt = 0; remoteFile.state && remoteFile.state !== 'ACTIVE' && attempt < 20; attempt += 1) {
      if (remoteFile.state === 'FAILED') return responseError('Gemini could not read this file. Try a clearer scan or manual entry.');
      await pause(1_000);
      const fileState: Response = await fetch(`${geminiApiBase}/v1beta/files/${encodeURIComponent(remoteFile.uri.split('/').pop() ?? '')}?key=${apiKey}`, { cache: 'no-store' });
      if (!fileState.ok) return responseError(await geminiError(fileState, 'Gemini could not prepare the uploaded file'), 502);
      const stateBody = (await fileState.json()) as { file?: GeminiFile } & GeminiFile;
      remoteFile = stateBody.file ?? stateBody;
      if (!remoteFile?.uri) return responseError('Gemini could not prepare the uploaded file.', 502);
    }
    if (remoteFile.state && remoteFile.state !== 'ACTIVE') return responseError('Gemini is still preparing this file. Please try again in a moment.', 504);

    const prompt = `Extract every assessable question from this educational PDF, image, or Word document. Return JSON only, with no markdown or explanation. The top-level value must be an array. Each object must exactly use: question_text, question_type (mcq|true_false|numerical|theoretical), options (string array without A)/B)/C)/D) labels; [] if not MCQ), correct_answer (the full matching option text, never just A/B/C/D; empty string if unknown), marks, positive_marks, negative_marks, difficulty (easy|medium|hard), chapter_tag, section_title. Preserve the document's actual section headings in section_title for every question in that section. Preserve mathematical notation, symbols, formulas, tables, and labelled values accurately using Unicode or plain-text notation where needed. Read diagrams, charts, figures, and images as visual context; include their labels, values, and essential relationships in question_text when they are needed to solve the question. If the document has a separate answer key, use its question-number-to-letter mapping to set correct_answer to the corresponding full option text. Do not invent answers or unreadable content; leave correct_answer empty or omit partial questions rather than guessing.`;
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
    const generated = await fetch(`${geminiApiBase}/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ generationConfig: { responseMimeType: 'application/json', temperature: 0 }, contents: [{ parts: [{ text: prompt }, { file_data: { mime_type: remoteFile.mimeType ?? mimeType, file_uri: remoteFile.uri } }] }] }),
    });
    if (!generated.ok) return responseError(await geminiError(generated, 'Question extraction failed'), 502);
    const output = await generated.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const text = output.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { return responseError('The document could not be reliably read. Try a clearer file or manual entry.'); }
    const questions = normalizeQuestions(parsed);
    if (!questions.length) return responseError('No reliable questions were found. Try a clearer file or manual entry.');
    return NextResponse.json({ questions, partial: questions.some((question) => !question.correct_answer) });
  } catch {
    return responseError('Could not extract questions from this file. Try Manual entry.', 500);
  }
}
