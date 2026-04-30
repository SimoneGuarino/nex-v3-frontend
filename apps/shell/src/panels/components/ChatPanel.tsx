import React, { useEffect, useMemo, useState } from "react";
import { ensureChatBlock, loadChatMessages, searchChatUsers, sendChatMessage, type ChatBlock, type ChatMessage } from "@nex/shared-platform";
import { useRealtimeSelector } from "@nex/realtime-store";

function sortMessages(messages: ChatMessage[]) {
  return [...messages].sort((a, b) => new Date(a.date ?? 0).getTime() - new Date(b.date ?? 0).getTime());
}

export default function ChatPanel() {
  const session = useRealtimeSelector((s) => s.session);
  const usersOnline = useRealtimeSelector((s) => s.usersOnline as Array<Record<string, unknown>>);
  const apiChat = import.meta.env.VITE_API_CHAT;
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Array<Record<string, unknown>>>([]);
  const [activeBlock, setActiveBlock] = useState<ChatBlock | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const t = window.setTimeout(async () => {
      try { setSearchResults(await searchChatUsers({ apiChat, search })); } catch { setSearchResults([]); }
    }, 250);
    return () => window.clearTimeout(t);
  }, [search, apiChat]);

  const displayedMessages = useMemo(() => sortMessages(activeBlock?.messages ?? []), [activeBlock]);

  async function openConversation(user: Record<string, unknown>) {
    if (!session?.details?._id || !user?._id) return;
    setBusy(true);
    try {
      const idBlock = await ensureChatBlock({
        apiChat,
        type: 0,
        idBlock: null,
        data: {
          idb: null,
          titleBlock: `${String(user.nome ?? "")} ${String(user.cognome ?? "")}`.trim(),
          path: "privata",
          disabilitato: false,
          users: [
            { _id: user._id, nome: user.nome, cognome: user.cognome },
            { _id: session.details._id, nome: session.details.nome, cognome: session.details.cognome },
          ],
        },
      });
      if (!idBlock) return;
      const loaded = await loadChatMessages({ apiChat, idBlock });
      setActiveBlock({
        idBlock,
        titleBlock: `${String(user.nome ?? "")} ${String(user.cognome ?? "")}`.trim(),
        path: "privata",
        users: [user as any],
        messages: loaded.remoteMessages ?? [],
        disabilitato: loaded.isBlockDisabled,
      });
    } finally { setBusy(false); }
  }

  async function handleSend() {
    if (!activeBlock?.idBlock || !message.trim()) return;
    setBusy(true);
    try {
      const response = await sendChatMessage({ idBlock: activeBlock.idBlock, path: activeBlock.path, message: message.trim() });
      const optimistic: ChatMessage = {
        _id: response.message_id,
        msg: message.trim(),
        date: new Date().toISOString(),
        viewed: false,
        user: { _id: session?.details?._id ?? "", nome: session?.details?.nome, cognome: session?.details?.cognome },
      };
      setActiveBlock((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);
      setMessage("");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: 520, maxHeight: 620 }}>
      <aside style={{ borderRight: "1px solid rgba(148,163,184,.18)", padding: 12, display: "grid", gap: 12, alignContent: "start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Chat</div>
          <div style={{ fontSize: 12, opacity: .7 }}>Utenti online: {usersOnline.length}</div>
        </div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cerca utente..." />
        <div style={{ display: "grid", gap: 8, overflow: "auto" }}>
          {searchResults.map((user, index) => (
            <button key={String(user._id ?? index)} type="button" onClick={() => openConversation(user)} style={{ textAlign: "left", border: "1px solid rgba(148,163,184,.16)", background: "rgba(148,163,184,.06)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 600 }}>{String(user.nome ?? "")} {String(user.cognome ?? "")}</div>
              <div style={{ fontSize: 12, opacity: .7 }}>{String(user._id ?? "")}</div>
            </button>
          ))}
          {!searchResults.length ? <div style={{ fontSize: 13, opacity: .65 }}>Cerca un utente per avviare o aprire una conversazione privata.</div> : null}
        </div>
      </aside>
      <section style={{ display: "grid", gridTemplateRows: "auto 1fr auto", minWidth: 0 }}>
        <div style={{ padding: 16, borderBottom: "1px solid rgba(148,163,184,.18)", fontWeight: 700 }}>{activeBlock?.titleBlock ?? "Seleziona una conversazione"}</div>
        <div style={{ padding: 16, overflow: "auto", display: "grid", gap: 10, alignContent: "start" }}>
          {displayedMessages.map((m) => (
            <div key={String(m._id ?? Math.random())} style={{ borderRadius: 12, padding: 12, background: "rgba(148,163,184,.08)" }}>
              <div style={{ fontSize: 12, opacity: .7 }}>{String(m.user?.nome ?? "")} {String(m.user?.cognome ?? "")}</div>
              <div style={{ marginTop: 6 }}>{m.msg}</div>
            </div>
          ))}
          {!displayedMessages.length ? <div style={{ opacity: .7 }}>Nessun messaggio.</div> : null}
        </div>
        <div style={{ padding: 12, borderTop: "1px solid rgba(148,163,184,.18)", display: "flex", gap: 8 }}>
          <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Scrivi un messaggio..." style={{ flex: 1 }} />
          <button type="button" onClick={handleSend} disabled={busy || !activeBlock}>Invia</button>
        </div>
      </section>
    </div>
  );
}
