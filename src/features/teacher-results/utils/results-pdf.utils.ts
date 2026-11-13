export async function downloadResultPDF(submission: {
  studentName: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  answers?: {
    question_text?: string; student_answer?: string;
    correct_answer?: string; is_correct?: boolean; marks_awarded?: number;
  }[];
}) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Student Result', 14, 20);
  doc.setFontSize(11);
  doc.text(`Student: ${submission.studentName}`, 14, 32);
  doc.text(`Exam: ${submission.examTitle}`, 14, 40);
  doc.text(`Score: ${submission.score} / ${submission.totalMarks}`, 14, 48);
  doc.text(`Submitted: ${new Date(submission.submittedAt).toLocaleString()}`, 14, 56);

  if (submission.answers?.length) {
    autoTable(doc, {
      startY: 66,
      head: [['#', 'Question', 'Answer', 'Correct', 'Result', 'Marks']],
      body: submission.answers.map((a, i) => [
        i + 1,
        a.question_text?.slice(0, 60) ?? '',
        a.student_answer ?? '—',
        a.correct_answer ?? '—',
        a.is_correct ? '✓' : '✗',
        a.marks_awarded ?? 0,
      ]),
      styles: { fontSize: 9 },
    });
  }

  doc.save(`result-${submission.studentName.replace(/\s+/g, '_')}.pdf`);
}
