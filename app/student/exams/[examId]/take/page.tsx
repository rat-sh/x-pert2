import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Taking Exam — X-Pert',
  description: 'Exam in progress.',
};

// This page is handled by StudentExamsPage which embeds the ExamSession view
// The examId is passed as a query param from the exam list for a seamless SPA feel.
// A full RSC implementation would fetch the exam here and pass it to the session component.
import { redirect } from 'next/navigation';

interface Props {
  params: { examId: string };
}

export default function ExamTakePage({ params }: Props) {
  // Redirect to student exams page with examId as query param
  redirect(`/student/exams?take=${params.examId}`);
}
