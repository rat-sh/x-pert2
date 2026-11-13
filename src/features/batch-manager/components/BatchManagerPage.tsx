'use client';
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Batch, BatchStudent, BatchFormData } from '../types/batch.types';
import {
  fetchBatchesAndStudents,
  createBatchService,
  removeStudentFromBatchService,
  deleteBatchService,
} from '../services/batch-manager.service';

import { BatchGrid } from './BatchGrid';
import { StudentTable } from './StudentTable';
import { CreateBatchModal } from './CreateBatchModal';

const BLANK_BATCH_FORM: BatchFormData = {
  name: '',
  subject: '',
  selectedDays: [],
  classTime: '',
  duration: '1 hour',
  startDate: '',
  endDate: '',
};

export function BatchManagerPage() {
  const { user } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [form, setForm] = useState<BatchFormData>({ ...BLANK_BATCH_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const data = await fetchBatchesAndStudents(user.id);
          if (!active) return;
          setBatches(data.batches);
          setBatchStudents(data.students);
        } catch (err) {
          if (!active) return;
          toast.error('Failed to load batches: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [user]);

  const handleCreateBatch = async () => {
    if (!form.name.trim()) {
      toast.error('Batch name is required.');
      return;
    }
    if (!user) return;
    setSaving(true);

    try {
      const { newBatch, calendarCount } = await createBatchService(user.id, form);
      if (calendarCount > 0) {
        toast.success(`Batch created! ${calendarCount} class sessions added to Calendar.`);
      } else {
        toast.success('Batch created! Students can join with code: ' + newBatch.join_code);
      }
      setBatches((prev) => [newBatch, ...prev]);
      setShowAddBatch(false);
      setForm({ ...BLANK_BATCH_FORM });
    } catch (err) {
      toast.error('Failed to create batch: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, batchId: string, studentName: string) => {
    if (!confirm(`Remove ${studentName} from this batch?`)) return;
    try {
      await removeStudentFromBatchService(studentId, batchId);
      setBatchStudents((prev) => prev.filter((s) => !(s.student_id === studentId && s.batch_id === batchId)));
      setBatches((prev) => prev.map((b) => b.id === batchId ? { ...b, studentCount: Math.max(0, (b.studentCount ?? 1) - 1) } : b));
      toast.success(`${studentName} removed from batch.`);
    } catch (err) {
      toast.error('Failed to remove student: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Delete batch "${batchName}"? This will remove all enrollments and associated calendar schedules.`)) return;
    try {
      await deleteBatchService(batchId, batchName);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
      setBatchStudents((prev) => prev.filter((s) => s.batch_id !== batchId));
      toast.success('Batch and its calendar entries deleted.');
    } catch (err) {
      toast.error('Failed to delete batch: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-gray-900 text-xl font-semibold">Students &amp; Batches</h2>
          <p className="text-gray-500 text-sm mt-0.5">Manage your batches and enrolled students</p>
        </div>
        <button
          onClick={() => setShowAddBatch(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <BatchGrid
          batches={batches}
          onDeleteBatch={handleDeleteBatch}
          onOpenCreate={() => setShowAddBatch(true)}
        />
      )}

      {batches.length > 0 && (
        <StudentTable
          batches={batches}
          students={batchStudents}
          selectedBatch={selectedBatch}
          onSelectBatch={setSelectedBatch}
          onRemoveStudent={handleRemoveStudent}
        />
      )}

      {showAddBatch && (
        <CreateBatchModal
          form={form}
          saving={saving}
          setForm={setForm}
          onCreateBatch={handleCreateBatch}
          onClose={() => { setShowAddBatch(false); setForm({ ...BLANK_BATCH_FORM }); }}
        />
      )}
    </div>
  );
}
