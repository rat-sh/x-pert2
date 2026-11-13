'use client';

import { useEffect } from 'react';
import { supabase } from '@/shared/services/supabase-client';

type PostgresChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimeOptions {
  schema?: string;
  table: string;
  event?: PostgresChangeEvent;
  filter?: string;
}

/**
 * useSupabaseRealtime
 *
 * Generic hook that subscribes to a Supabase realtime channel.
 * Calls `onEvent` whenever a matching DB change is received.
 *
 * @param channelName - Unique name for this subscription (e.g. "teacher-calendar")
 * @param options     - Table, event type, and optional filter
 * @param onEvent     - Callback fired on each matching row change
 */
export function useSupabaseRealtime(
  channelName: string,
  options: RealtimeOptions,
  onEvent: () => void,
): void {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: options.event ?? '*',
          schema: options.schema ?? 'public',
          table: options.table,
          filter: options.filter,
        },
        onEvent,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, options.event, options.schema, options.table, options.filter, onEvent]);
}
