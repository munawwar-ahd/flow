import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";
import type { SyncEntity } from "@/types/models";
import { SUPABASE_TABLE } from "@/types/database";

type RowWithUpdatedAt = { id: string; updated_at: string; user_id?: string };

type Handler = (entity: SyncEntity, row: RowWithUpdatedAt, eventType: "INSERT" | "UPDATE" | "DELETE") => void;

const ENTITIES: SyncEntity[] = ["task", "note", "event", "session", "category", "settings"];

export function subscribeRealtime(
  supabase: SupabaseClient,
  userId: string,
  handler: Handler
): RealtimeChannel {
  let channel = supabase.channel(`flow-sync:${userId}`, {
    config: { broadcast: { self: false } },
  });

  for (const entity of ENTITIES) {
    const table = SUPABASE_TABLE[entity];
    channel = channel.on<RowWithUpdatedAt>(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table,
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<RowWithUpdatedAt>) => {
        const row =
          (payload.new && Object.keys(payload.new).length > 0
            ? (payload.new as RowWithUpdatedAt)
            : (payload.old as RowWithUpdatedAt | undefined)) ?? null;
        if (!row || !row.id) return;
        handler(entity, row, payload.eventType as "INSERT" | "UPDATE" | "DELETE");
      }
    );
  }

  channel.subscribe();
  return channel;
}

export async function unsubscribeRealtime(
  supabase: SupabaseClient,
  channel: RealtimeChannel | null
): Promise<void> {
  if (!channel) return;
  try {
    await supabase.removeChannel(channel);
  } catch {
    // ignore
  }
}
