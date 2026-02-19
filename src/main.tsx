import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

type ChatRole = "user" | "assistant";
type ChatMessage = { role: ChatRole; content: string };
type ServerMessage =
  | { type: "history"; messages: ChatMessage[] }
  | { type: "assistant"; content: string };

const AGENT_STORAGE_KEY = "cf_agent_demo_id";

function getAgentId() {
  const existing = localStorage.getItem(AGENT_STORAGE_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  localStorage.setItem(AGENT_STORAGE_KEY, next);
  return next;
}

function App() {
  const chatRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const [agentId] = useState<string>(() => getAgentId());
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [online, setOnline] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);

  const wsUrl = useMemo(() => {
    const scheme = location.protocol === "https:" ? "wss" : "ws";
    const port = location.port ? `:${location.port}` : "";
    return `${scheme}://${location.hostname}${port}/agents/chat-agent/${agentId}`;
  }, [agentId]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, waitingForReply]);

  useEffect(() => {
    let closedByCleanup = false;

    function clearReconnectTimer() {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    }

    function connect() {
      clearReconnectTimer();
      setStatus("Connecting...");
      setOnline(false);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("Live");
        setOnline(true);
      };

      ws.onmessage = (evt) => {
        const payload = JSON.parse(evt.data) as ServerMessage;

        if (payload.type === "history" && Array.isArray(payload.messages)) {
          setMessages(payload.messages);
          setWaitingForReply(false);
          return;
        }

        if (payload.type === "assistant") {
          setMessages((prev) => [...prev, { role: "assistant", content: payload.content }]);
          setWaitingForReply(false);
        }
      };

      ws.onclose = () => {
        setStatus("Reconnecting...");
        setOnline(false);
        if (closedByCleanup) return;
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(connect, 850);
      };

      ws.onerror = () => {
        setStatus("Connection issue");
        setOnline(false);
        try {
          ws.close();
        } catch {
          // no-op
        }
      };
    }

    connect();

    return () => {
      closedByCleanup = true;
      clearReconnectTimer();
      try {
        wsRef.current?.close();
      } catch {
        // no-op
      }
      wsRef.current = null;
    };
  }, [wsUrl]);

  function sendMessage() {
    const text = input.trim();
    const ws = wsRef.current;
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setWaitingForReply(true);

    ws.send(JSON.stringify({ type: "user", content: text }));
  }

  return (
    <main className="shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <section className="chat-card">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Cloudflare Agent</p>
            <h1>Realtime AI Chat</h1>
          </div>

          <div className="meta">
            <span className={`status-pill ${online ? "online" : "offline"}`}>{status}</span>
            <code>{agentId}</code>
          </div>
        </header>

        <div ref={chatRef} className="chat-log">
          {messages.length === 0 && (
            <div className="welcome">
              <h2>Ask anything</h2>
              <p>
                This chat keeps short-term memory in a Cloudflare Agent and streams answers from Workers AI.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <article key={`${msg.role}-${i}`} className={`bubble ${msg.role}`}>
              <span className="role">{msg.role === "user" ? "You" : "Assistant"}</span>
              <p>{msg.content}</p>
            </article>
          ))}

          {waitingForReply && (
            <article className="bubble assistant typing" aria-live="polite" aria-label="Assistant is typing">
              <span className="role">Assistant</span>
              <div className="dots">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
        </div>

        <footer className="composer">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message (Shift+Enter for newline)"
          />

          <button onClick={sendMessage} disabled={!online || input.trim().length === 0}>
            Send
          </button>
        </footer>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
