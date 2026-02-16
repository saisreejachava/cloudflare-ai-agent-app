# Cloudflare Agents Chat (Workers AI + Durable State)

A small AI-powered chat app built on **Cloudflare Agents**.

## What this demonstrates (matches the assignment rubric)

- **LLM:** Llama 3.3 on **Workers AI**
- **Workflow / coordination:** (optional extension) use **Cloudflare Workflows** to post-process chats (summaries / memory extraction)
- **User input:** browser **chat UI** using a **WebSocket**
- **Memory / state:** per-user chat history stored in an **Agent** (Durable Object + SQLite-backed state)

## Local dev

### Prereqs
- Node.js 18+
- Cloudflare account (for deploy)
- Wrangler CLI (installed via devDependencies)

### Run
```bash
npm install
npm run dev
```

Then open:
- Frontend: http://localhost:8787

## Deploy

```bash
npm run deploy
```

## Notes
- Each browser gets a generated `agentId` stored in `localStorage`, so your chat history persists for that user/device.
- The WebSocket endpoint is `/agent/ChatAgent/<agentId>`.

## Customize
- Change the model in `src/server.ts` (`env.AI.run(...)`)
- Adjust `system` prompt for your use-case (career guidance, study buddy, etc.)
