import { getSupabaseAdmin } from '@/next/app/api/_lib/supabase-admin';
import type { ChatroomRGYAggregate, RGYStatus } from '@/next/types/rgy';

type MemberRow = {
  user_id: string;
};

type StatusRow = {
  user_id: string;
  status: RGYStatus;
  score?: number | null;
};

function dominantStatus(green: number, yellow: number, red: number): RGYStatus {
  if (green >= yellow && green >= red) return 'green';
  if (yellow >= red) return 'yellow';
  return 'red';
}

function mapAggregate(row: Record<string, any>): ChatroomRGYAggregate {
  return {
    chatroomId: row.chatroom_id,
    greenCount: Number(row.green_count || 0),
    yellowCount: Number(row.yellow_count || 0),
    redCount: Number(row.red_count || 0),
    total: Number(row.total_participants ?? row.total_active ?? 0),
    dominantStatus: (row.dominant_status || row.dominant_rgy || 'yellow') as RGYStatus,
    healthScore: Number(row.health_score || 0),
    updatedAt: row.updated_at
  };
}

export async function snapshotChatroomRGY(chatroomId: string): Promise<ChatroomRGYAggregate | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data: members } = await supabase
    .from('cq_chatroom_members')
    .select('user_id')
    .eq('chatroom_id', chatroomId);

  const userIds = ((members ?? []) as MemberRow[]).map(member => member.user_id).filter(Boolean);
  if (!userIds.length) return null;

  const { data: statuses } = await supabase
    .from('rgy_status')
    .select('user_id,status,score')
    .in('user_id', userIds);

  const statusMap = new Map(
    ((statuses ?? []) as StatusRow[]).map(status => [status.user_id, status])
  );
  const now = new Date().toISOString();

  const snapshots = userIds.map(userId => {
    const status = statusMap.get(userId);
    return {
      chatroom_id: chatroomId,
      participant_id: userId,
      rgy_status: status?.status ?? 'yellow',
      rgy_score: status?.score ?? 50,
      captured_at: now
    };
  });

  await supabase.from('chatroom_rgy_snapshots').insert(snapshots);

  const greenCount = snapshots.filter(snapshot => snapshot.rgy_status === 'green').length;
  const yellowCount = snapshots.filter(snapshot => snapshot.rgy_status === 'yellow').length;
  const redCount = snapshots.filter(snapshot => snapshot.rgy_status === 'red').length;
  const total = snapshots.length;
  const status = dominantStatus(greenCount, yellowCount, redCount);
  const healthScore = Math.round((greenCount * 100 + yellowCount * 50) / Math.max(total, 1));

  const payload = {
    chatroom_id: chatroomId,
    green_count: greenCount,
    yellow_count: yellowCount,
    red_count: redCount,
    total_participants: total,
    dominant_status: status,
    dominant_rgy: status,
    health_score: healthScore,
    updated_at: now
  };

  await supabase
    .from('chatroom_rgy_aggregates')
    .upsert(payload, { onConflict: 'chatroom_id' });

  return {
    chatroomId,
    greenCount,
    yellowCount,
    redCount,
    total,
    dominantStatus: status,
    healthScore,
    updatedAt: now
  };
}

export async function getChatroomRGYAggregate(chatroomId: string): Promise<ChatroomRGYAggregate | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data } = await supabase
    .from('chatroom_rgy_aggregates')
    .select('*')
    .eq('chatroom_id', chatroomId)
    .maybeSingle();

  return data ? mapAggregate(data) : null;
}
