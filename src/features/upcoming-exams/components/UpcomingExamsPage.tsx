'use client';
import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Users } from 'lucide-react';
import { supabase } from '@/shared/services/supabase-client';
import { useAuth } from '@/contexts/AuthContext';
import type { Exam, Batch } from '@/shared/types/database.types';


export function UpcomingExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<(Exam & { batches?: Batch; enrollmentCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('exams')
        .select('*, batches(*)')
        .eq('teacher_id', user.id)
        .eq('is_published', true)
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true });

      if (data) {
        const withCounts = await Promise.all(
          data.map(async (exam) => {
            const { count } = await supabase.from('batch_enrollments').select('*', { count: 'exact', head: true }).eq('batch_id', exam.batch_id).eq('is_active', true);
            return { ...exam, enrollmentCount: count ?? 0 };
          })
        );
        setExams(withCounts);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const [nowMs] = useState(() => Date.now());

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getDaysUntil = (iso: string, targetNowMs: number) => {
    const diff = new Date(iso).getTime() - targetNowMs;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-gray-900 text-xl font-semibold">Upcoming Exams</h2>
        <p className="text-gray-500 text-sm mt-1">Published exams scheduled in the future</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : exams.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-1">No upcoming exams</h3>
          <p className="text-gray-500 text-sm">Publish an exam to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exams.map((exam) => {
            const daysUntil = exam.scheduled_at ? getDaysUntil(exam.scheduled_at, nowMs) : null;
            return (
              <div key={exam.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{exam.title}</h3>
                  {daysUntil !== null && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ml-2 ${daysUntil <= 1 ? 'bg-red-100 text-red-700' : daysUntil <= 3 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d away`}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 shrink-0" />{exam.subject}</div>
                  <div className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" />{exam.duration_minutes} minutes · {exam.total_marks} marks</div>
                  {exam.scheduled_at && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 shrink-0" />{formatDate(exam.scheduled_at)}</div>}
                  {exam.batches && <div className="flex items-center gap-2"><Users className="w-4 h-4 shrink-0" />{exam.batches.name} · {exam.enrollmentCount} students</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
