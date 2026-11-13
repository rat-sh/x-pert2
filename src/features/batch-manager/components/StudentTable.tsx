import { CheckCircle, Trash2 } from 'lucide-react';
import { Batch, BatchStudent } from '../types/batch.types';

interface StudentTableProps {
  batches: Batch[];
  students: BatchStudent[];
  selectedBatch: string;
  onSelectBatch: (batchId: string) => void;
  onRemoveStudent: (studentId: string, batchId: string, studentName: string) => void;
}

export function StudentTable({
  batches,
  students,
  selectedBatch,
  onSelectBatch,
  onRemoveStudent,
}: StudentTableProps) {
  const filteredStudents =
    selectedBatch === 'all'
      ? students
      : students.filter((s) => s.batch_id === selectedBatch);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-3 flex-wrap">
        <h3 className="text-gray-900 font-semibold text-sm">
          Students ({filteredStudents.length})
        </h3>
        <select
          value={selectedBatch}
          onChange={(e) => onSelectBatch(e.target.value)}
          className="ml-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Batches</option>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Batch</th>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider hidden md:table-cell">Student ID</th>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider">Joined</th>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-gray-600 text-xs font-medium uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.map((student) => {
              const batchName = batches.find((b) => b.id === student.batch_id)?.name ?? '—';
              return (
                <tr key={`${student.batch_id}-${student.student_id}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-gray-900 text-sm font-medium">{student.name}</p>
                    <p className="text-gray-500 text-xs sm:hidden">{batchName}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm hidden sm:table-cell">{batchName}</td>
                  <td className="px-4 py-3 text-gray-600 text-sm hidden md:table-cell">{student.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(student.joined_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onRemoveStudent(student.student_id, student.batch_id, student.name)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStudents.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            No students enrolled yet. Share the join code with your students.
          </div>
        )}
      </div>
    </div>
  );
}
