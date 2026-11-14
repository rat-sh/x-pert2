'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ChevronLeft, ChevronRight, Clock, Play, Zap, Circle, Check, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared/services/supabase-client';
import { useStudent } from '@/contexts/StudentContext';
import { calculateClockSnapshot, calculateRemainingSeconds, countAnswered } from '../utils/exam-utils';

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
  ends_at: string | null;
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

const normalizeOptions = (options: unknown): string[] | null => {
  if (Array.isArray(options) && options.every((option): option is string => typeof option === 'string')) return options;
  if (typeof options !== 'string' || !options) return null;
  try {
    const parsed: unknown = JSON.parse(options);
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
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [tabNotice, setTabNotice] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [announcedTime, setAnnouncedTime] = useState('');
  const serverEndTimeRef = useRef<string | null>(null);
  const serverOffsetRef = useRef(0);
  const submittedRef = useRef(false);
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submissionIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, string>>({});
  const questionsRef = useRef<ExamQuestion[]>([]);
  const activeQuestionIndexRef = useRef(0);
  const timeRemainingRef = useRef(0);
  const questionTimeRemainingRef = useRef<number | null>(null);
  const questionTimesRef = useRef<Record<string, number>>({});
  const isSubmittingRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const saveFailureNotifiedRef = useRef(false);
  const tabSwitchLastAtRef = useRef(0);
  const hasShownTabNoticeRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const announceTimeIfThreshold = useCallback((seconds: number) => {
    if ([300, 60].includes(seconds)) setAnnouncedTime(`${Math.floor(seconds / 60)} minutes remaining`);
    if (seconds === 0) setAnnouncedTime('Time is up');
  }, []);

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

    const { data: examData, error: examError } = await supabase
      .from('student_exams_view')
      .select('id, title, subject, duration_minutes, total_marks, scheduled_at, is_instant, instant_expires_at, ends_at, batch_name, no_reverse_back, per_question_time_seconds, created_at')
      .order('created_at', { ascending: false });

    if (examError) {
      toast.error('Could not load exams');
      setLoading(false);
      return;
    }

    const visibleExams = examData ?? [];
    const { data: submissionData, error: submissionError } = await supabase
      .from('exam_submissions')
      .select('exam_id, total_score, submitted_at')
      .eq('student_id', student.id)
      .in('exam_id', visibleExams.map((exam) => exam.id));

    if (submissionError) {
      toast.error('Could not load your exam progress');
      setLoading(false);
      return;
    }

    const submissionsByExam = new Map((submissionData ?? []).map((submission) => [submission.exam_id, submission]));
    setExams(visibleExams.map((exam) => {
      const submission = submissionsByExam.get(exam.id);
      return {
        ...exam,
        no_reverse_back: exam.no_reverse_back ?? false,
        per_question_time_seconds: exam.per_question_time_seconds ?? null,
        batch_name: exam.batch_name ?? 'Batch',
        submitted: Boolean(submission?.submitted_at),
        total_score: submission?.total_score ?? null,
      };
    }));
    setLoading(false);
  }, [student]);

  const leaveExam = useCallback(() => {
    clearTimer();
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setView('list');
    setCurrentExam(null);
    setQuestions([]);
    questionsRef.current = [];
    submissionIdRef.current = null;
    serverEndTimeRef.current = null;
    setQuestionTimeRemaining(null);
    questionTimeRemainingRef.current = null;
    questionTimesRef.current = {};
  }, []);

  const persistAnswers = useCallback((answerSet: Record<string, string>) => {
    const submissionId = submissionIdRef.current;
    if (!submissionId) return Promise.resolve();
    if (!submittedRef.current) setSaveStatus('saving');

    const answerPayload = Object.entries(answerSet).map(([question_id, student_answer]) => ({
      question_id,
      student_answer,
    }));
    const saveWithRetry = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const { error } = await supabase.rpc('save_exam_answers', {
          p_submission_id: submissionId,
          p_answers: answerPayload,
        });
        if (!error) {
          saveFailureNotifiedRef.current = false;
          if (!submittedRef.current) {
            setSaveStatus('saved');
            setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
          }
          return;
        }
        if (attempt < 2) {
          await new Promise((resolve) => window.setTimeout(resolve, 400 * (attempt + 1)));
        }
      }

      if (!submittedRef.current) {
        setSaveStatus('error');
      }
      if (!submittedRef.current && !saveFailureNotifiedRef.current) {
        saveFailureNotifiedRef.current = true;
        toast.error('Answers could not be saved yet. Keep this exam open and try again.');
      }
    };

    const queuedSave = saveQueueRef.current.then(saveWithRetry, saveWithRetry);
    saveQueueRef.current = queuedSave.then(() => undefined, () => undefined);
    return queuedSave;
  }, []);

  const submitExam = useCallback(async (exam: StudentExamRow, answerSet = answersRef.current) => {
    if (isSubmittingRef.current) return;
    const submissionId = submissionIdRef.current;
    if (!submissionId) return;

    isSubmittingRef.current = true;
    setSubmitError(false);
    setSubmitting(true);
    clearTimer();
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    await persistAnswers(answerSet);
    await saveQueueRef.current;
    const answerPayload = questionsRef.current.map((question) => ({
      question_id: question.id,
      student_answer: answerSet[question.id] ?? '',
    }));
    let score: unknown = null;
    let error: { message: string } | null = null;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const result = await supabase.rpc('submit_exam', { p_submission_id: submissionId, p_answers: answerPayload });
      score = result.data;
      error = result.error;
      if (!error) break;
      if (attempt < 3) await new Promise((resolve) => window.setTimeout(resolve, 1_000 * (2 ** attempt)));
    }

    if (error) {
      setSubmitError(true);
      isSubmittingRef.current = false;
      setSubmitting(false);
      return;
    }

    submittedRef.current = true;
    setSubmitError(false);
    const result = Array.isArray(score) ? score[0] : score;
    toast.success(`Exam submitted! You scored ${result?.total_score ?? 0}/${exam.total_marks}`);
    leaveExam();
    isSubmittingRef.current = false;
    setSubmitting(false);
    void fetchExams();
  }, [fetchExams, leaveExam, persistAnswers]);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => { void fetchExams(); }, 0);
    return () => window.clearTimeout(initialFetch);
  }, [fetchExams]);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!submitDialogOpen) return;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll<HTMLElement>('button:not([disabled])');
    focusable?.[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setSubmitDialogOpen(false);
        submitButtonRef.current?.focus();
      } else if (event.key === 'Tab' && focusable?.length) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [submitDialogOpen]);

  useEffect(() => {
    if (view !== 'taking' || !submissionIdRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') {
        if (!hasShownTabNoticeRef.current) {
          hasShownTabNoticeRef.current = true;
          setTabNotice(true);
        }
        const endTime = serverEndTimeRef.current;
        if (endTime) {
          const remaining = calculateRemainingSeconds(endTime, Date.now(), serverOffsetRef.current);
          setTimeRemaining(remaining);
          announceTimeIfThreshold(remaining);
        }
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      void persistAnswers(answersRef.current);

      const now = Date.now();
      if (now - tabSwitchLastAtRef.current < 1_500) return;
      tabSwitchLastAtRef.current = now;
      const submissionId = submissionIdRef.current;
      if (submissionId) {
        void supabase.rpc('record_tab_switch', { p_submission_id: submissionId });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [announceTimeIfThreshold, persistAnswers, view]);

  useEffect(() => {
    if (view !== 'taking' || !currentExam || !questions.length || timerRef.current) return;

    timerRef.current = setInterval(() => {
      const endTime = serverEndTimeRef.current;
      const nextOverallTime = endTime
        ? calculateRemainingSeconds(endTime, Date.now(), serverOffsetRef.current)
        : 0;
      timeRemainingRef.current = nextOverallTime;
      setTimeRemaining(nextOverallTime);
      announceTimeIfThreshold(nextOverallTime);
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
      const submissionId = submissionIdRef.current;
      if (submissionId) sessionStorage.setItem(`exam-question-index:${submissionId}`, String(nextQuestionIndex));
      const nextQuestion = questionsRef.current[nextQuestionIndex];
      const nextQuestionTimeRemaining = questionTimesRef.current[nextQuestion.id] ?? currentExam.per_question_time_seconds;
      questionTimeRemainingRef.current = nextQuestionTimeRemaining;
      setQuestionTimeRemaining(nextQuestionTimeRemaining);
    }, 1_000);

    return clearTimer;
  }, [announceTimeIfThreshold, currentExam, questions.length, submitExam, view]);

  useEffect(() => {
    if (view !== 'taking' || !serverEndTimeRef.current) return;
    const resyncClock = async () => {
      const { data } = await supabase.rpc('server_time');
      if (typeof data === 'string') {
        serverOffsetRef.current = new Date(data).getTime() - Date.now();
        const endTime = serverEndTimeRef.current;
        if (endTime) {
          const remaining = calculateRemainingSeconds(endTime, Date.now(), serverOffsetRef.current);
          setTimeRemaining(remaining);
          announceTimeIfThreshold(remaining);
        }
      }
    };
    const interval = window.setInterval(() => { void resyncClock(); }, 60_000);
    return () => window.clearInterval(interval);
  }, [announceTimeIfThreshold, view]);

  const getStatus = (exam: StudentExamRow) => {
    if (exam.submitted) return 'completed';
    if (exam.ends_at && new Date(exam.ends_at) < new Date()) return 'expired';
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
    const started = Array.isArray(startData) ? startData[0] : null;
    if (startError || !started || typeof started.submission_id !== 'string' || typeof started.server_end_time !== 'string') {
      toast.error(startError?.message ?? 'Could not start exam');
      setStarting(false);
      return;
    }

    const { data: questionData, error: questionError } = await supabase
      .from('student_questions_view')
      .select('id, exam_id, question_text, question_type, options, option_images, question_image, marks, positive_marks, negative_marks, section_title')
      .eq('exam_id', exam.id)
      .order('order_index');
    if (questionError || !questionData?.length) {
      toast.error(questionError?.message ?? 'This exam has no questions yet.');
      setStarting(false);
      return;
    }

    const parsedQuestions: ExamQuestion[] = questionData.map((question) => ({
      id: question.id,
      question_text: question.question_text,
      question_type: question.question_type,
      options: normalizeOptions(question.options),
      option_images: Array.isArray(question.option_images) ? question.option_images.filter((image): image is string | null => typeof image === 'string' || image === null) : null,
      question_image: question.question_image,
      marks: question.marks,
      positive_marks: question.positive_marks,
      negative_marks: question.negative_marks,
      section_title: question.section_title,
    }));
    const { data: serverTime } = await supabase.rpc('server_time');
    const clockSnapshot = calculateClockSnapshot(typeof serverTime === 'string' ? serverTime : null, started.server_end_time);
    const serverOffset = clockSnapshot.serverOffsetMs;
    const remaining = clockSnapshot.remainingSeconds;
    const { data: savedAnswerData, error: savedAnswerError } = await supabase
      .from('submission_answers')
      .select('question_id, student_answer')
      .eq('submission_id', started.submission_id);
    if (savedAnswerError) {
      toast.error('Could not restore saved answers. Please try starting again.');
      setStarting(false);
      return;
    }
    const restoredAnswers: Record<string, string> = {};
    for (const savedAnswer of savedAnswerData ?? []) {
      if (typeof savedAnswer.student_answer === 'string') {
        restoredAnswers[savedAnswer.question_id] = savedAnswer.student_answer;
      }
    }

    submissionIdRef.current = started.submission_id;
    serverEndTimeRef.current = started.server_end_time;
    serverOffsetRef.current = serverOffset;
    submittedRef.current = false;
    questionsRef.current = parsedQuestions;
    answersRef.current = restoredAnswers;
    saveFailureNotifiedRef.current = false;
    tabSwitchLastAtRef.current = 0;
    const questionStorageKey = `exam-question-index:${started.submission_id}`;
    const storedIndex = Number(sessionStorage.getItem(questionStorageKey) ?? 0);
    const restoredIndex = Number.isInteger(storedIndex) ? Math.min(Math.max(storedIndex, 0), parsedQuestions.length - 1) : 0;
    activeQuestionIndexRef.current = restoredIndex;
    timeRemainingRef.current = remaining;
    questionTimeRemainingRef.current = exam.per_question_time_seconds;
    questionTimesRef.current = Object.fromEntries(parsedQuestions.map((question) => [question.id, exam.per_question_time_seconds ?? 0]));
    setCurrentExam(exam);
    setQuestions(parsedQuestions);
    setAnswers(restoredAnswers);
    setActiveQuestionIndex(restoredIndex);
    setTimeRemaining(remaining);
    setQuestionTimeRemaining(exam.per_question_time_seconds);
    setView('taking');
    setStarting(false);
  };

  const setAnswer = (questionId: string, answer: string) => {
    const updated = { ...answersRef.current, [questionId]: answer };
    answersRef.current = updated;
    setAnswers(updated);
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void persistAnswers(updated);
    }, 2_000);
  };

  const goToQuestion = (nextIndex: number) => {
    if (!currentExam || nextIndex < 0 || nextIndex >= questions.length) return;
    if (currentExam.no_reverse_back && nextIndex < activeQuestionIndexRef.current) return;
    activeQuestionIndexRef.current = nextIndex;
    setActiveQuestionIndex(nextIndex);
    const submissionId = submissionIdRef.current;
    if (submissionId) sessionStorage.setItem(`exam-question-index:${submissionId}`, String(nextIndex));
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
    const unanswered = questions.length - countAnswered(answers);
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-gray-900 font-semibold">{currentExam.title}</h3>
              <p className="text-sm text-gray-600">Question {activeQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-5 text-right">
              {questionTimeRemaining !== null && <div><p className="text-xs text-gray-600">This question</p><p className="text-lg font-mono font-bold text-indigo-600">{formatTime(questionTimeRemaining)}</p></div>}
              <div><p className="text-xs text-gray-600">Time remaining</p><p className="text-2xl font-mono font-bold text-gray-900">{formatTime(timeRemaining)}</p></div>
              <button ref={submitButtonRef} onClick={() => setSubmitDialogOpen(true)} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"><CheckCircle className="w-4 h-4" />{submitting ? 'Submitting…' : 'Submit exam'}</button>
            </div>
          </div>
        </div>

        <p role="status" aria-live="polite" className="sr-only">{announcedTime}</p>
        {timeRemaining < 300 && timeRemaining > 0 && <p className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"><TriangleAlert aria-hidden="true" className="w-4 h-4 shrink-0" />Less than five minutes remain.</p>}
        {timeRemaining === 0 && <p className="text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">Time is up - submitting</p>}
        {tabNotice && <p role="status" className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">Leaving this tab is recorded.</p>}
        {submitError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"><span>Could not submit. Retry</span><button onClick={() => void submitExam(currentExam)} disabled={submitting} className="rounded-md bg-red-700 px-3 py-1.5 font-medium text-white disabled:opacity-50">Retry</button></div>}

        <div aria-label="Question palette" className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {questions.map((item, index) => {
            const answered = (answers[item.id] ?? '').trim().length > 0;
            const current = index === activeQuestionIndex;
            const locked = currentExam.no_reverse_back && index < activeQuestionIndex;
            return <button key={item.id} onClick={() => goToQuestion(index)} disabled={submitting || locked} aria-current={current ? 'step' : undefined} aria-label={`Question ${index + 1}, ${current ? 'current' : answered ? 'answered' : 'unanswered'}${locked ? ', locked' : ''}`} className={`min-h-12 rounded-lg border p-2 flex flex-col items-center justify-center gap-1 text-sm disabled:cursor-not-allowed disabled:opacity-45 ${current ? 'border-indigo-700 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-600' : answered ? 'border-green-700 bg-green-50 text-green-950' : 'border-gray-400 bg-white text-gray-900'}`}><span>{index + 1}</span>{current ? <Circle aria-hidden="true" className="h-3 w-3" /> : answered ? <Check aria-hidden="true" className="h-3 w-3" /> : <Circle aria-hidden="true" className="h-3 w-3" />}<span className="text-[10px]">{current ? 'Current' : answered ? 'Answered' : 'Unanswered'}</span></button>;
          })}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {question.section_title && <p className="text-sm font-semibold text-indigo-700 mb-3">{question.section_title}</p>}
          <div className="flex items-start gap-3 mb-4">
            <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded shrink-0">Q{activeQuestionIndex + 1}</span>
            <div className="flex-1"><p className="text-gray-900 mb-1">{question.question_text}</p>{question.question_image && <img src={question.question_image} alt="Question image; activate to zoom" role="button" tabIndex={0} onClick={() => setZoomedImage(question.question_image ?? null)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setZoomedImage(question.question_image ?? null); } }} className="mt-2 max-h-48 rounded-lg object-contain border border-gray-100 cursor-zoom-in" />}<p className="text-xs text-gray-500 mt-1">+{question.positive_marks ?? question.marks}{(question.negative_marks ?? 0) > 0 ? ` / −${question.negative_marks}` : ''}</p></div>
          </div>

          {question.question_type === 'mcq' && question.options && <div className="space-y-2">{question.options.map((option, optionIndex) => { const imageUrl = question.option_images?.[optionIndex]; return <label key={optionIndex} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${answers[question.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}><input type="radio" name={`q-${question.id}`} value={option} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} className="w-4 h-4 text-indigo-600 shrink-0" />{imageUrl ? <img src={imageUrl} alt="Option image; activate to zoom" role="button" tabIndex={0} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setZoomedImage(imageUrl); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); setZoomedImage(imageUrl); } }} className="h-14 rounded object-contain cursor-zoom-in" /> : <span className="text-sm text-gray-900">{option}</span>}</label>; })}</div>}
          {question.question_type === 'true_false' && <div className="space-y-2">{['True', 'False'].map((option) => <label key={option} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${answers[question.id] === option ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}><input type="radio" name={`q-${question.id}`} checked={answers[question.id] === option} onChange={() => setAnswer(question.id, option)} className="w-4 h-4 text-indigo-600" /><span className="text-sm">{option}</span></label>)}</div>}
          {question.question_type === 'numerical' && <input type="text" value={answers[question.id] ?? ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Enter your answer" className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />}
          {question.question_type === 'theoretical' && <textarea value={answers[question.id] ?? ''} onChange={(event) => setAnswer(question.id, event.target.value)} placeholder="Write your answer…" rows={5} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm" />}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between gap-3">
          <button onClick={() => goToQuestion(activeQuestionIndex - 1)} disabled={!canGoBack || submitting} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg disabled:opacity-40 flex items-center gap-2 text-sm"><ChevronLeft className="w-4 h-4" /> Back</button>
          <div className="text-center"><p className="text-sm text-gray-700">Answered: {countAnswered(answers)} / {questions.length}</p><p role="status" aria-live="polite" className="text-xs text-gray-600 mt-1">{saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? <button onClick={() => void persistAnswers(answersRef.current)} className="text-red-800 underline">Not saved, retry</button> : `Saved ${savedAt ?? '—'}`}</p></div>
          {canGoForward ? <button onClick={() => goToQuestion(activeQuestionIndex + 1)} disabled={submitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm"><span>Next</span><ChevronRight className="w-4 h-4" /></button> : <span className="text-sm text-gray-600">Last question</span>}
        </div>
        {submitDialogOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="presentation"><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="submit-dialog-title" aria-describedby="submit-dialog-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="submit-dialog-title" className="text-lg font-semibold text-gray-900">Submit exam?</h2><p id="submit-dialog-description" className="mt-2 text-sm text-gray-700">{unanswered} {unanswered === 1 ? 'question is' : 'questions are'} unanswered.</p><div className="mt-6 flex justify-end gap-3"><button onClick={() => { setSubmitDialogOpen(false); submitButtonRef.current?.focus(); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-800">Keep working</button><button onClick={() => { setSubmitDialogOpen(false); submitButtonRef.current?.focus(); void submitExam(currentExam); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Submit exam</button></div></div></div>}
        {zoomedImage && <div className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" role="dialog" aria-modal="true" aria-label="Zoomed exam image" onClick={() => setZoomedImage(null)}><button onClick={() => setZoomedImage(null)} className="absolute right-4 top-4 rounded bg-white px-3 py-2 text-sm text-gray-900">Close image</button><img src={zoomedImage} alt="Zoomed exam content" className="max-h-[90vh] max-w-full object-contain" onClick={(event) => event.stopPropagation()} /></div>}
      </div>
    );
  }

  return <div className="space-y-6"><div><h2 className="text-gray-900 text-2xl font-semibold">My Exams</h2><p className="text-gray-600 text-sm mt-1">Exams from batches you joined</p></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{[{ label: 'Upcoming', value: exams.filter((exam) => getStatus(exam) === 'upcoming').length, color: 'bg-blue-100 text-blue-600', Icon: Clock }, { label: 'Ready', value: exams.filter((exam) => getStatus(exam) === 'ready').length, color: 'bg-green-100 text-green-600', Icon: Play }, { label: 'Completed', value: exams.filter((exam) => getStatus(exam) === 'completed').length, color: 'bg-purple-100 text-purple-600', Icon: CheckCircle }].map(({ label, value, color, Icon }) => <div key={label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"><div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-6 h-6" /></div><div><p className="text-sm text-gray-600">{label}</p><p className="text-2xl text-gray-900 font-semibold">{value}</p></div></div></div>)}</div>{loading ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div> : exams.length === 0 ? <div className="text-center py-16 bg-white rounded-xl border border-gray-200"><AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-700 font-medium">No exams found</p><p className="text-gray-500 text-sm mt-1">Join a batch with your teacher&apos;s code to see exams.</p></div> : <div className="space-y-4">{exams.map((exam) => { const status = getStatus(exam); return <div key={exam.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"><div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-3 mb-2 flex-wrap"><h3 className="text-gray-900 font-semibold text-lg">{exam.title}</h3>{exam.is_instant && <span className="text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-700 flex items-center gap-1"><Zap className="w-3 h-3" /> Instant</span>}<span className={`text-xs px-2 py-1 rounded font-medium ${status === 'ready' ? 'bg-green-100 text-green-700' : status === 'upcoming' ? 'bg-blue-100 text-blue-700' : status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{status === 'ready' ? 'Ready' : status === 'upcoming' ? 'Upcoming' : status === 'expired' ? 'Expired' : 'Completed'}</span></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600"><div><span className="text-gray-500">Subject:</span> {exam.subject}</div><div><span className="text-gray-500">Duration:</span> {exam.duration_minutes} mins</div><div><span className="text-gray-500">Marks:</span> {exam.total_marks}</div><div><span className="text-gray-500">Batch:</span> {exam.batch_name}</div></div>{status === 'completed' && exam.total_score != null && <p className="mt-2 text-sm"><span className="font-medium">Score: </span><span className="text-indigo-600 font-semibold">{exam.total_score}/{exam.total_marks}</span></p>}</div><div className="shrink-0">{status === 'ready' && <button onClick={() => void startExam(exam)} disabled={starting} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm font-medium disabled:opacity-50"><Play className="w-4 h-4" /> {starting ? 'Starting…' : 'Start Exam'}</button>}{status === 'upcoming' && <button disabled className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg cursor-not-allowed text-sm">Not Started Yet</button>}{status === 'expired' && <span className="text-sm text-red-600">Window closed</span>}{status === 'completed' && <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm"><CheckCircle className="w-4 h-4 text-green-600" /> Submitted</div>}</div></div></div>; })}</div>}</div>;
}
