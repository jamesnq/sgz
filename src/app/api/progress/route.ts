import { NextResponse } from 'next/server';
import { getTaskProgress } from '@/utilities/progress-store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get('taskId');

  if (!taskId) {
    return NextResponse.json({ message: 'taskId is required' }, { status: 400 });
  }

  const progress = getTaskProgress(taskId);

  if (!progress) {
    return NextResponse.json({ message: 'Task not found' }, { status: 404 });
  }

  // Calculate ETA
  const elapsed = Date.now() - progress.startedAt;
  const rate = progress.processed / (elapsed / 1000); // items per second
  const remaining = progress.total - progress.processed;
  let eta = 0;
  if (rate > 0) {
    eta = remaining / rate;
  }

  return NextResponse.json({ ...progress, eta, rate });
}
