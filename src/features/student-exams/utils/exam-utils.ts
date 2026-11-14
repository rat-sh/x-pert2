export function calculateRemainingSeconds(serverEndTime: string | number, clientNow: number, serverOffsetMs: number): number {
  const endTime = typeof serverEndTime === 'number' ? serverEndTime : new Date(serverEndTime).getTime();
  return Math.max(0, Math.floor((endTime - (clientNow + serverOffsetMs)) / 1_000));
}

export function countAnswered(answers: Record<string, string>): number {
  return Object.values(answers).filter((answer) => answer.trim().length > 0).length;
}

export function calculateClockSnapshot(serverTime: string | null, serverEndTime: string): { serverOffsetMs: number; remainingSeconds: number } {
  const clientNow = Date.now();
  const serverOffsetMs = serverTime ? new Date(serverTime).getTime() - clientNow : 0;
  return {
    serverOffsetMs,
    remainingSeconds: calculateRemainingSeconds(serverEndTime, clientNow, serverOffsetMs),
  };
}
