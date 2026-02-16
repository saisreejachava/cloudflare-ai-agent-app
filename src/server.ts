import { Agent, routeAgentRequest } from "agents";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ChatState = {
  messages: ChatMessage[];
};

export class ChatAgent extends Agent<Env, ChatState> {
  initialState: ChatState = { messages: [] };

  async onConnect(connection: WebSocket) {
    // Send existing history when a client connects
    connection.send(
      JSON.stringify({ type: "history", messages: this.state.messages.slice(-50) })
    );
  }

  async onMessage(connection: WebSocket, message: string) {
    // Expect JSON payloads from the browser
    let payload: any;
    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }
    if (payload?.type !== "user" || typeof payload?.content !== "string") return;

    const userText = payload.content.trim();
    if (!userText) return;

    // Store user message
    const nextMessages = [...this.state.messages, { role: "user", content: userText } as ChatMessage];
    this.setState({ messages: nextMessages });

    // Call Workers AI (Llama 3.3). Keep context small for speed.
    const context = nextMessages.slice(-12);

    const system = [
      "You are a helpful assistant running on Cloudflare.",
      "Be concise, actionable, and friendly.",
      "If you don't know something, say so and suggest next steps."
    ].join(" ");

    const aiResp = await this.env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [{ role: "system", content: system }, ...context],
        max_tokens: 512
      }
    );

    const assistantText =
      (aiResp && (aiResp.response || aiResp.result || aiResp.output_text)) ??
      (typeof aiResp === "string" ? aiResp : JSON.stringify(aiResp));

    const updated = [...context, { role: "assistant", content: String(assistantText) } as ChatMessage];

    // Merge into full history (append assistant)
    const full = [...nextMessages, { role: "assistant", content: String(assistantText) } as ChatMessage];
    this.setState({ messages: full });

    // Send assistant response to the current connection (and broadcast to others via state sync if needed)
    connection.send(JSON.stringify({ type: "assistant", content: String(assistantText) }));
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Route /agent/<AgentName>/<id> to the right Agent instance (WebSockets + HTTP)
    const routed = await routeAgentRequest(request, env);
    if (routed) return routed;


    // Serve the frontend (static assets)
    return env.ASSETS.fetch(request);
  }
};
