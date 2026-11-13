export async function downloadStudentResultPDF(params: {
  studentName: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  submittedAt: string;
  answers: Array<{
    question_text?: string;
    student_answer?: string;
    correct_answer?: string;
    is_correct?: boolean;
    marks_awarded?: number;
  }>;
}) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const doc = new jsPDF();
  const percentage = params.totalMarks > 0 ? Math.round((params.score / params.totalMarks) * 100) : 0;

  doc.setFontSize(20);
  doc.text('My Exam Result', 14, 22);

  doc.setFontSize(11);
  doc.text(`Exam: ${params.examTitle}`, 14, 35);
  doc.text(`Student: ${params.studentName}`, 14, 43);
  doc.text(`Score: ${params.score} / ${params.totalMarks} (${percentage}%)`, 14, 51);
  doc.text(`Submitted: ${new Date(params.submittedAt).toLocaleString()}`, 14, 59);

  if (params.answers.length) {
    autoTable(doc, {
      startY: 68,
      head: [['#', 'Question', 'Your Answer', 'Correct', 'Result', 'Marks']],
      body: params.answers.map((a, i) => [
        i + 1,
        a.question_text?.slice(0, 60) ?? '',
        a.student_answer ?? '—',
        a.correct_answer ?? '—',
        a.is_correct ? '✓ Correct' : '✗ Wrong',
        a.marks_awarded ?? 0,
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 70 } },
    });
  }

  doc.save(`result-${params.examTitle.replace(/\s+/g, '_')}.pdf`);
}
