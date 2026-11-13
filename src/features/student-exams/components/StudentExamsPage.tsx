'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Play, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { useStudent } from '@/contexts/StudentContext';

type ExamView = 'list' | 'taking';

interface StudentExamRow {
  id: string;
  title: string;
  subject: string | null;
  duration_minutes: number;
  total_marks: number;
  scheduled_at: string | null;
  is_instant: boolean;
  instant_expires_at: string | null;
  no_reverse_back: boolean;
  per_question_time_seconds: number | null;
  batch_name: string;
  submitted: boolean;
  total_score: number | null;
}

interface ExamQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  option_images?: (string | null)[] | null;
  question_image?: string | null;
  marks: number;
  positive_marks?: number;
  negative_marks?: number;
  section_title?: string | null;
}

const normalizeOptions = (options: ExamQuestion['options']) => {
  if (Array.isArray(options) || !options) return options;
  try {
    const parsed: unknown = JSON.parse(options as unknown as string);
    return Array.isArray(parsed) && parsed.every((option) => typeof option === 'string') ? parsed : null;
  } catch {
    return null;
  }
};

export function StudentExamsPage() {
  const { student } = useStudent();
  const [view, setView] = useState<ExamView>('list');
  const [exams, setExams] = useState<StudentExamRow[]>([]);
  const [currentExam, setCurrentExam] = useState<StudentExamRow | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [questionTimeRemaining, setQuestionTimeRemaining] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const questionsRef = useRef<ExamQuestion[]>([]);
  const activeQuestionIndexRef = useRef(0);
  const timeRemainingRef = useRef(0);
  const questionTimeRemainingRef = useRef<number | null>(null);
  const questionTimesRef = useRef<Record<string, number>>({});
  const isSubmittingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const fetchExams = useCallback(async () => {
    if (!student) return;
    setLoading(true);
    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('batch_enrollments')
      .select('batch_id')
      .eq('student_id', student.id)
      .eq('is_active', true);

    if (enrollmentError) {
      toast.error('Could not load your batches');
      setLoading(false);
      return;
    }

    const batchIds = (enrollmentData ?? []).map((enrollment) => enrollment.batch_id);
    if (!batchIds.length) {
      setExams([]);
      setLoading(false);
      return;
    }

    const selection = 'id, title, subject, duration_minutes, total_marks, scheduled_at, is_instant, instant_expires_at, no_reverse_back, per_question_time_seconds, batches(name), exam_submissions(total_score, submitted_at)';
    const [legacyResult, multiBatchResult] = await Promise.all([
      supabase.from('exams').select(selection).eq('is_published', true).in('batch_id', batchIds).order('created_at', { ascending: false }),
      supabase.from('exams').select(selection).eq('is_published', true).overlaps('batch_ids', batchIds).order('created_at', { ascending: false }),
    ]);

    if (legacyResult.error || multiBatchResult.error) {
      toast.error(legacyResult.error?.message ?? multiBatchResult.error?.message ?? 'Could not load exams');
      setLoading(false);
      return;
    }

    const visibleExams = Array.from(new Map([...(legacyResult.data ?? []), ...(multiBatchResult.data ?? [])].map((exam) => [exam.id, exam])).values());
    setExams(visibleExams.map((exam) => {
      const submission = Array.isArray(exam.exam_submissions) ? exam.exam_submissions[0] : null;
      const batch = Array.isArray(exam.batches) ? exam.batches[0] : exam.batches;
      return {
        ...exam,
        no_reverse_back: exam.no_reverse_back ?? false,
        per_question_time_seconds: exam.per_question_time_seconds ?? null,
        batch_name: batch?.name ?? 'Assigned batch',
        submitted: Boolean(submission?.submitted_at),
        total_score: submission?.total_score ?? null,
      };
    }) as StudentExamRow[]);
    setLoading(false);
  }, [student]);

  const leaveExam = useCallback(() => {
    clearTimer();
    setView('list');
    setCurrentExam(null);
    setQuestions([]);
    questionsRef.current = [];
    submissionIdRef.current = null;
    setQuestionTimeRemaining(null);
    questionTimeRemainingRef.current = null;
    questionTimesRef.current = {};
  }, []);

  const submitExam = useCallback(async (exam: StudentExamRow, answerSet = answersRef.current) => {
    if (isSubmittingRef.current) return;
    const submissionId = submissionIdRef.current;
    if (!submissionId) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    clearTimer();
    const answerPayload = questionsRef.current.map((question) => ({
      question_id: question.id,
      student_answer: answerSet[question.id] ?? '',
    }));
    const { data: score, error } = await supabase.rpc('submit_exam', {
      p_submission_id: submissionId,
      p_answers: answerPayload,
    });

    if (error) {
      toast.error(`Submit failed: ${error.message}`);
      isSubmittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const result = Array.isArray(score) ? score[0] : score;
    toast.success(`Exam submitted! You scored ${result?.total_score ?? 0}/${exam.total_marks}`);
    leaveExam();
    isSubmittingRef.current = false;
    setSubmitting(false);
    void fetchExams();
  }, [fetchExams, leaveExam]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => { void fetchExams(); }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchExams]);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (view !== 'taking' || !currentExam || !questions.length || timerRef.current) return;

    timerRef.current = setInterval(() => {
      const nextOverallTime = Math.max(0, timeRemainingRef.current - 1);
      timeRemainingRef.current = nextOverallTime;
      setTimeRemaining(nextOverallTime);
      if (nextOverallTime === 0) {
        clearTimer();
        void submitExam(currentExam, answersRef.current);
        return;
      }

      if (!currentExam.per_question_time_seconds || questionTimeRemainingRef.current === null) return;
      const activeQuestion = questionsRef.current[activeQuestionIndexRef.current];
      if (!activeQuestion) return;
      const nextQuestionTime = (questionTimesRef.current[activeQuestion.id] ?? questionTimeRemainingRef.current) - 1;
      if (nextQuestionTime > 0) {
        questionTimesRef.current[activeQuestion.id] = nextQuestionTime;
        questionTimeRemainingRef.current = nextQuestionTime;
        setQuestionTimeRemaining(nextQuestionTime);
        return;
      }

      const nextQuestionIndex = activeQuestionIndexRef.current + 1;
      if (nextQuestionIndex >= questionsRef.current.length) {
        clearTimer();
        void submitExam(currentExam, answersRef.current);
        return;
      }

      activeQuestionIndexRef.current = nextQuestionIndex;
      setActiveQuestionIndex(nextQuestionIndex);
      const nextQuestion = questionsRef.current[nextQuestionIndex];
      const nextQuestionTimeRemaining = questionTimesRef.current[nextQuestion.id] ?? currentExam.per_question_time_seconds;
      questionTimeRemainingRef.current = nextQuestionTimeRemaining;
      setQuestionTimeRemaining(nextQuestionTimeRemaining);
    }, 1_000);

    return clearTimer;
  }, [currentExam, questions.length, submitExam, view]);

  const getStatus = (exam: StudentExamRow) => {
    if (exam.submitted) return 'completed';
    if (exam.is_instant) {
      if (exam.instant_expires_at && new Date(exam.instant_expires_at) < new Date()) return 'expired';
      return 'ready';
    }
    if (!exam.scheduled_at) return 'ready';
    if (new Date(exam.scheduled_at) > new Date()) return 'upcoming';
    return 'ready';
  };

  const startExam = async (exam: StudentExamRow) => {
    if (!student) return;
    setStarting(true);
    const { data: startData, error: startError } = await supabase.rpc('start_exam', { p_exam_id: exam.id });
    if (startError || !startData?.[0]) {
      toast.error(startError?.message ?? 'Could not start exam');
      setStarting(false);
      return;
    }

    const { data: questionData, error: questionError } = await supabase
      .from('student_questions_view')
      .select('*')
      .eq('exam_id', exam.id)
      .order('order_index');
    if (questionError || !questionData?.length) {
      toast.error(questionError?.message ?? 'This exam has no questions yet.');
      setStarting(false);
      return;
    }

    const parsedQuestions = (questionData as ExamQuestion[]).map((question) => ({ ...question, options: normalizeOptions(question.options) }));
    const submission = startData[0] as { submission_id: string; server_end_time: string };
    // eslint-disable-next-line react-hooks/purity -- this interaction handler sets the server timer boundary.
    const remaining = Math.max(0, Math.floor((new Date(submission.server_end_time).getTime() - Date.now()) / 1_000));
    if (!remaining) {
      toast.error('The exam time has already expired.');
      setStarting(false);
      return;
    }

    submissionIdRef.current = submission.submission_id;
    questionsRef.current = parsedQuestions;
    answersRef.current = {};
    activeQuestionIndexRef.current = 0;
    timeRemainingRef.current = remaining;
    questionTimeRemainingRef.current = exam.per_question_time_seconds;
    questionTimesRef.current = Object.fromEntries(parsedQuestions.map((question) => [question.id, exam.per_question_time_seconds ?? 0]));
    setCurrentExam(exam);
    setQuestions(parsedQuestions);
    setAnswers({});
    setActiveQuestionIndex(0);
    setTimeRemaining(remaining);
    setQuestionTimeRemaining(exam.per_question_time_seconds);
    setView('taking');
    setStarting(false);
  };

  const setAnswer = (questionId: string, answer: string) => {
    setAnswers((previous) => {
      const updated = { ...previous, [questionId]: answer };
      answersRef.current = updated;
      return updated;
    });
  };

  const goToQuestion = (nextIndex: number) => {
    if (!currentExam || nextIndex < 0 || nextIndex >= questions.length) return;
    if (currentExam.no_reverse_back && nextIndex < activeQuestionIndexRef.current) return;
    activeQuestionIndexRef.current = nextIndex;
    setActiveQuestionIndex(nextIndex);
    if (currentExam.per_question_time_seconds) {
      const nextQuestionTime = questionTimesRef.current[questions[nextIndex].id] ?? currentExam.per_question_time_seconds;
      questionTimeRemainingRef.current = nextQuestionTime;
      setQuestionTimeRemaining(nextQuestionTime);
    }
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  if (view === 'taking' && currentExam && questions.length) {
    const question = questions[activeQuestionIndex];
    const canGoBack = activeQuestionIndex > 0 && !currentExam.no_reverse_back;
    const canGoForward = activeQuestionIndex < questions.length - 1;
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-gray-900 font-semibold">{currentExam.title}</h3>
              <p className="text-sm text-gray-600">Question {activeQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex gap-5 text-right">
              {questionTimeRemaining !== null && <div><p className="text-xs text-gray-600">This question</p><p className="text-lg font-mono font-bold text-indigo-600">{formatTime(questionTimeRemaining)}</p></div>}
              <div><p className="text-xs text-gray-600">Time remaining</p><p className={`text-2xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-green-600'}`}>{formatTime(timeRemaining)}</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {question.section_title && <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-3">{question.section_title}</p>}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded shrink-0">Q{activeQuestionIndex + 1}</span>
            <div className="flex-1"><p className="text-gray-900 mb-1">{question.question_text}</p>{question.question_image && <img src={question.question_image} alt="" className="mt-2 max-h-48 rounded-lg object-contain border border-gray-100" />}<p className="text-xs text-gray-500 mt-1">+{question.positive_marks ?? question.marks}{(question.negative_marks ?? 0) > 0 ? ` / −${question.negative_marks}` : ''}</p></div>
          </div>

          {question.question_type === 'mcq' && question.options && <div className="space-y-2">{question.options.map((option, optionIndex) => { const imageUrl = question.option_images?.[optionIndex]; return <label key={optionIndex} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${answers[question.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="radio" name={`q-${question.id}`} value={option} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} className="w-4 h-4 text-indigo-600 shrink-0" />{imageUrl ? <img src={imageUrl} alt="" className="h-14 rounded object-contain" /> : <span className="text-sm text-gray-900">{option}</span>}</label>; })}</div>}
          {question.question_type === 'true_false' && <div className="space-y-2">{['True', 'False'].map((option) => <label key={option} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${answers[question.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><input type="radio" name={`q-${question.id}`} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} className="w-4 h-4 text-indigo-600" /><span className="text-sm">{option}</span></label>)}</div>}
          {question.question_type === 'numerical' && <input type="text" value={answers[question.id] ?? ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Enter your answer" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />}
          {question.question_type === 'theoretical' && <textarea value={answers[question.id] ?? ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Write your answer…" rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-3">
          <button onClick={() => goToQuestion(activeQuestionIndex - 1)} disabled={!canGoBack || submitting} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-40 flex items-center gap-2 text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
          <p className="text-sm text-gray-600">Answered: {Object.keys(answers).length} / {questions.length}</p>
          {canGoForward ? <button onClick={() => goToQuestion(activeQuestionIndex + 1)} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"><span>Next</span><ChevronRight className="w-4 h-4" /></button> : <button onClick={() => { if (confirm('Submit the exam? You cannot change answers after submission.')) void submitExam(currentExam); }} disabled={submitting} className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"><CheckCircle className="w-5 h-5" /> {submitting ? 'Submitting…' : 'Submit Exam'}</button>}
        </div>
      </div>
    );
  }

  return <div className="space-y-6"><div><h2 className="text-gray-900 text-2xl font-semibold">My Exams</h2><p className="text-gray-600 text-sm mt-1">Exams from batches you joined</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{ label: 'Upcoming', value: exams.filter((exam) => getStatus(exam) === 'upcoming').length, color: 'bg-blue-100 text-blue-600', Icon: Clock }, { label: 'Ready', value: exams.filter((exam) => getStatus(exam) === 'ready').length, color: 'bg-green-100 text-green-600', Icon: Play }, { label: 'Completed', value: exams.filter((exam) => getStatus(exam) === 'completed').length, color: 'bg-purple-100 text-purple-600', Icon: CheckCircle }].map(({ label, value, color, Icon }) => <div key={label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></div><div><p className="text-sm text-gray-600">{label}</p><p className="text-2xl text-gray-900 font-semibold">{value}</p></div></div></div>)}</div>{loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div> : exams.length === 0 ? <div className="text-center py-16 bg-white rounded-xl border border-gray-200"><AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-700 font-medium">No exams found</p><p className="text-gray-500 text-sm mt-1">Join a batch with your teacher&apos;s code to see exams.</p></div> : <div className="space-y-4">{exams.map((exam) => { const status = getStatus(exam); return <div key={exam.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2 flex-wrap"><h3 className="text-gray-900 font-semibold text-lg">{exam.title}</h3>{exam.is_instant && <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700 flex items-center gap-1"><Zap className="w-3 h-3" /> Instant</span>}<span className={`text-xs px-2 py-1 rounded font-medium ${status === 'ready' ? 'bg-green-100 text-green-700' : status === 'upcoming' ? 'bg-blue-100 text-blue-700' : status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{status === 'ready' ? 'Ready' : status === 'upcoming' ? 'Upcoming' : status === 'expired' ? 'Expired' : 'Completed'}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600"><div><span className="text-gray-500">Subject:</span> {exam.subject}</div><div><span className="text-gray-500">Duration:</span> {exam.duration_minutes} mins</div><div><span className="text-gray-500">Marks:</span> {exam.total_marks}</div><div><span className="text-gray-500">Batch:</span> {exam.batch_name}</div></div>{status === 'completed' && exam.total_score != null && <p className="mt-2 text-sm"><span className="font-medium">Score: </span><span className="text-indigo-600 font-semibold">{exam.total_score}/{exam.total_marks}</span></p>}</div><div className="shrink-0">{status === 'ready' && <button onClick={() => void startExam(exam)} disabled={starting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"><Play className="w-4 h-4" /> {starting ? 'Starting…' : 'Start Exam'}</button>}{status === 'upcoming' && <button disabled className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm">Not Started Yet</button>}{status === 'expired' && <span className="text-sm text-red-600">Window closed</span>}{status === 'completed' && <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"><CheckCircle className="w-4 h-4 text-green-600" /> Submitted</div>}</div></div></div>; })}</div>}</div>;
}
