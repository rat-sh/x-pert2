import { supabase } from '@/shared/services/supabase-client';
import { ExamDetails, ExamRow } from '../types/exam-creator.types';
import { generateKey, generatePin } from '../utils/exam-creator.utils';
import { PaperItem, SectionItem, getQuestionsFromItems } from '@/features/question-builder/components/QuestionPaperBuilder';

export async function uploadExamImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() ?? 'png';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('exam-images').upload(path, file, { upsert: true });
  if (error) throw new Error('Image upload failed: ' + error.message);
  const { data } = supabase.storage.from('exam-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchTeacherExams(userId: string): Promise<ExamRow[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*, batches(*)')
    .eq('teacher_id', userId)
    .neq('status', 'archived')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  return Promise.all(
    data.map(async (exam) => {
      const [{ count: qCount }, { count: aCount }] = await Promise.all([
        supabase.from('questions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id),
        supabase.from('exam_submissions').select('*', { count: 'exact', head: true }).eq('exam_id', exam.id),
      ]);
      return { ...exam, questionCount: qCount ?? 0, hasAttempts: (aCount ?? 0) > 0 };
    })
  );
}

export async function saveExamDetails(
  userId: string,
  details: ExamDetails,
  editingExamId: string | null,
  existingExam: ExamRow | undefined
): Promise<string> {
  const now = new Date();
  let scheduled_at: string | null = null;

  if (details.is_instant) {
    scheduled_at = now.toISOString();
  } else if (details.scheduled_date && details.scheduled_time) {
    scheduled_at = new Date(`${details.scheduled_date}T${details.scheduled_time}`).toISOString();
  }

  const instant_expires_at = details.is_instant
    ? new Date(now.getTime() + 60 * 60 * 1000).toISOString()
    : null;

  const payload = {
    teacher_id: userId,
    batch_id: details.batch_ids[0],
    batch_ids: details.batch_ids,
    title: details.title,
    subject: details.subject,
    duration_minutes: details.duration_minutes,
    total_marks: 0,
    scheduled_at,
    is_instant: details.is_instant,
    instant_expires_at,
    allow_pyq: details.allow_pyq,
    no_reverse_back: details.no_reverse_back,
    per_question_time_seconds: details.per_question_time_enabled ? details.per_question_time_seconds : null,
    negative_marking: false,
    negative_marks_per_wrong: 0,
    is_published: existingExam ? existingExam.is_published : false,
    status: existingExam ? existingExam.status : 'draft',
  };

  if (editingExamId) {
    const { error } = await supabase.from('exams').update(payload).eq('id', editingExamId);
    if (error) throw error;
    return editingExamId;
  } else {
    const { data, error } = await supabase.from('exams').insert(payload).select().single();
    if (error || !data) throw error ?? new Error('Failed to create exam');
    return data.id;
  }
}

export async function saveAllQuestions(savedExamId: string, paperItems: PaperItem[]): Promise<boolean> {
  const questions = getQuestionsFromItems(paperItems);
  if (questions.length === 0) throw new Error('Add at least one question.');

  for (const q of questions) {
    if (!q.question_text.trim() && !q.question_image) {
      throw new Error('Each question needs text or an image.');
    }
  }

  const sectionTitleMap = new Map<string, string>();
  for (const item of paperItems) {
    if (item.itemType === 'section') sectionTitleMap.set(item.id, (item as SectionItem).title);
  }

  const existingIds = questions.filter((q) => q.dbId).map((q) => q.dbId!);
  const { data: dbQuestions } = await supabase.from('questions').select('id').eq('exam_id', savedExamId);
  const toDelete = (dbQuestions ?? []).map((r) => r.id).filter((id) => !existingIds.includes(id));
  if (toDelete.length > 0) {
    await supabase.from('questions').delete().in('id', toDelete);
  }

  let orderIndex = 0;
  for (const q of questions) {
    const sectionTitle = q.sectionId ? sectionTitleMap.get(q.sectionId) ?? null : null;
    const optionTexts = q.options.map((o) => o.text);
    const optionImages = q.options.map((o) => o.imageUrl);
    const payload = {
      exam_id: savedExamId,
      question_text: q.question_text,
      question_image: q.question_image,
      question_type: q.question_type,
      options: q.question_type === 'mcq' ? optionTexts : null,
      option_images: q.question_type === 'mcq' ? optionImages : null,
      correct_answer: q.correct_answer || null,
      marks: q.positive_marks,
      positive_marks: q.positive_marks,
      negative_marks: q.negative_marks,
      chapter_tag: null,
      difficulty: q.difficulty,
      is_pyq: q.is_pyq,
      section_title: sectionTitle,
      order_index: orderIndex++,
    };

    if (q.dbId) {
      const { error } = await supabase.from('questions').update(payload).eq('id', q.dbId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from('questions').insert(payload).select('id').single();
      if (error || !data) throw error ?? new Error('Insert failed');
      q.dbId = data.id;
    }
  }

  const totalMarks = questions.reduce((s, q) => s + q.positive_marks, 0);
  await supabase.from('exams').update({ total_marks: totalMarks }).eq('id', savedExamId);
  return true;
}

export async function publishExamKey(
  examId: string,
  existingExam: ExamRow | undefined,
  details: ExamDetails,
  paperItems: PaperItem[]
): Promise<{ key: string; pin: string }> {
  const key = existingExam?.exam_key || generateKey();
  const pin = existingExam?.exam_pin || generatePin();
  const questions = getQuestionsFromItems(paperItems);
  const totalMarks = questions.reduce((s, q) => s + q.positive_marks, 0);
  const instantExpires = details.is_instant
    ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
    : null;
  const updatePayload: Record<string, unknown> = {
    exam_key: key,
    exam_pin: pin,
    status: details.is_instant ? 'active' : 'scheduled',
    is_published: true,
    total_marks: totalMarks,
    is_instant: details.is_instant,
    instant_expires_at: instantExpires,
  };
  if (details.is_instant) {
    updatePayload.scheduled_at = new Date().toISOString();
  }
  const { error } = await supabase.from('exams').update(updatePayload).eq('id', examId);
  if (error) throw error;
  return { key, pin };
}

export async function duplicateExamService(userId: string, exam: ExamRow): Promise<void> {
  const { data: newExam, error: examErr } = await supabase.from('exams').insert({
    teacher_id: userId,
    batch_id: exam.batch_id,
    batch_ids: exam.batch_ids,
    title: `${exam.title} (Copy)`,
    subject: exam.subject,
    duration_minutes: exam.duration_minutes,
    total_marks: 0,
    scheduled_at: exam.scheduled_at,
    allow_pyq: exam.allow_pyq,
    no_reverse_back: exam.no_reverse_back,
    per_question_time_seconds: exam.per_question_time_seconds,
    negative_marking: false,
    negative_marks_per_wrong: 0,
    is_published: false,
    status: 'draft',
  }).select().single();

  if (examErr || !newExam) throw examErr ?? new Error('Duplicate failed');

  const { data: srcQuestions } = await supabase.from('questions').select('*').eq('exam_id', exam.id).order('order_index');
  if (srcQuestions && srcQuestions.length > 0) {
    await supabase.from('questions').insert(
      srcQuestions.map((q) => {
        const copy = { ...q, exam_id: newExam.id };
        delete (copy as { id?: string }).id;
        return copy;
      })
    );
  }
}

export async function duplicateExam(exam: ExamRow, userId: string): Promise<boolean> {
  try {
    await duplicateExamService(userId, exam);
    return true;
  } catch {
    return false;
  }
}

export async function toggleArchiveExamService(exam: ExamRow): Promise<string> {
  const newStatus = exam.status === 'archived' ? 'draft' : 'archived';
  const { error } = await supabase.from('exams').update({ status: newStatus }).eq('id', exam.id);
  if (error) throw error;
  return newStatus;
}

export async function archiveExam(exam: ExamRow): Promise<boolean> {
  try {
    await toggleArchiveExamService(exam);
    return true;
  } catch {
    return false;
  }
}

export async function softDeleteExamService(examId: string): Promise<void> {
  const { error } = await supabase.from('exams').update({ status: 'archived', is_published: false }).eq('id', examId);
  if (error) throw error;
}

export async function deleteExam(examId: string): Promise<boolean> {
  try {
    await softDeleteExamService(examId);
    return true;
  } catch {
    return false;
  }
}

export async function regenExamKey(examId: string): Promise<{ key: string; pin: string } | null> {
  const key = generateKey();
  const pin = generatePin();
  const { error } = await supabase.from('exams').update({ exam_key: key, exam_pin: pin }).eq('id', examId);
  if (error) return null;
  return { key, pin };
}

export async function updateExamSettingsService(activeExam: ExamRow, updates: Partial<ExamDetails>): Promise<void> {
  const u = updates as ExamDetails;
  const scheduled_at = u.scheduled_date && u.scheduled_time
    ? new Date(`${u.scheduled_date}T${u.scheduled_time}`).toISOString()
    : activeExam.scheduled_at;
  const { error } = await supabase.from('exams').update({
    title: u.title,
    subject: u.subject,
    batch_id: u.batch_ids?.[0] ?? activeExam.batch_id,
    batch_ids: u.batch_ids,
    duration_minutes: u.duration_minutes,
    scheduled_at,
    allow_pyq: u.allow_pyq,
    no_reverse_back: u.no_reverse_back,
    per_question_time_seconds: u.per_question_time_enabled ? u.per_question_time_seconds : null,
  }).eq('id', activeExam.id);
  if (error) throw error;
}
