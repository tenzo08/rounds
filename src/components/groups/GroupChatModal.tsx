"use client";

import { useEffect, useRef, useState } from "react";
import { ModalShell } from "@/components/binder/ModalShell";
import { getSupabaseRealtimeClient } from "@/lib/supabaseRealtime";
import { mintGroupRealtimeToken } from "@/lib/actions/realtime";
import {
  getGroupMessages,
  sendGroupMessage,
  type ChatMessageDTO,
} from "@/lib/actions/chat";
import type { GroupMemberDTO } from "@/lib/types";

interface GroupChatModalProps {
  groupId: string;
  currentUserId: string;
  members: GroupMemberDTO[];
  onClose: () => void;
}

const TOKEN_REFRESH_MS = 4 * 60 * 1000;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function GroupChatModal({
  groupId,
  currentUserId,
  members,
  onClose,
}: GroupChatModalProps) {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const memberById = new Map(members.map((m) => [m.userId, m]));

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseRealtimeClient();
    let tokenTimer: ReturnType<typeof setInterval> | null = null;

    async function authenticate() {
      try {
        const token = await mintGroupRealtimeToken(groupId);
        if (!cancelled) await supabase.realtime.setAuth(token);
      } catch {
        // Handled by the channel simply going quiet once the token expires.
      }
    }

    getGroupMessages(groupId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    const channel = supabase
      .channel(`group-chat-${groupId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` },
        (payload) => {
          const row = payload.new as {
            id: string;
            sender_id: string;
            body: string;
            created_at: string;
          };
          const sender = memberById.get(row.sender_id);
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                body: row.body,
                createdAt: row.created_at,
                senderId: row.sender_id,
                senderName: sender?.name ?? "Someone",
                senderImage: sender?.image ?? null,
              },
            ];
          });
        },
      );

    void authenticate().then(() => channel.subscribe());
    tokenTimer = setInterval(() => void authenticate(), TOKEN_REFRESH_MS);

    return () => {
      cancelled = true;
      if (tokenTimer) clearInterval(tokenTimer);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setIsSending(true);
    setError(null);
    try {
      await sendGroupMessage(groupId, trimmed);
      setDraft("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <ModalShell accentColor="#3B6E8F" onClose={onClose}>
      <h3 className="m-0 pr-6 font-serif text-[19px] text-ink">Group chat</h3>

      <div
        ref={listRef}
        className="mt-3.5 flex max-h-[50vh] min-h-[240px] flex-col gap-2.5 overflow-y-auto rounded border border-line bg-paper-grid p-3"
      >
        {isLoading ? (
          <p className="m-0 text-[13px] text-ink-soft">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-soft">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={"flex flex-col " + (isMe ? "items-end" : "items-start")}
              >
                <div
                  className={
                    "max-w-[85%] rounded-[8px] px-3 py-2 text-[13px] leading-[1.4] " +
                    (isMe ? "bg-ink text-paper" : "bg-card text-ink")
                  }
                >
                  {!isMe && (
                    <p className="m-0 mb-0.5 font-mono text-[10px] font-semibold uppercase opacity-70">
                      {m.senderName}
                    </p>
                  )}
                  <p className="m-0 break-words whitespace-pre-wrap">{m.body}</p>
                </div>
                <span className="mt-0.5 font-mono text-[9.5px] text-ink-soft opacity-70">
                  {formatTime(m.createdAt)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="mt-2 text-sm text-c-crit">{error}</p>}

      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Message the group…"
          maxLength={2000}
          className="min-h-[42px] w-full min-w-0 flex-1 rounded border border-line bg-paper px-3 font-sans text-sm text-ink outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || !draft.trim()}
          className="min-h-[42px] shrink-0 rounded bg-ink px-4 text-[13.5px] font-semibold text-paper transition-opacity hover:opacity-88 disabled:opacity-50"
        >
          Send
        </button>
      </div>

      <div className="mt-[18px] flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] rounded border border-line px-4 text-[13.5px] font-semibold text-ink transition-opacity hover:opacity-88"
        >
          Close
        </button>
      </div>
    </ModalShell>
  );
}
