import { Agent, routeAgentRequest } from "agents";

type ChatMessage = { role: "user" | "assistant"; content: string; imageDataUrl?: string };
type ChatState = { messages: ChatMessage[] };
type UserPayload = { type: "user"; content: string; imageDataUrl?: string };
type ResetPayload = { type: "reset" };

const TEXT_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";
const VISION_FALLBACK_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function chunkByWords(text: string, wordsPerChunk = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(" ") + " ");
  }

  return chunks.length ? chunks : [text];
}

function isImageDataUrl(value: unknown): value is string {
  return typeof value === "string" && /^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(value);
}

function toAiMessage(message: ChatMessage) {
  if (message.role === "user" && message.imageDataUrl) {
    return {
      role: "user",
      content: [
        { type: "text", text: message.content || "Please describe this image." },
        { type: "image_url", image_url: { url: message.imageDataUrl } }
      ]
    };
  }

  return { role: message.role, content: message.content };
}

function toTextOnlyMessage(message: ChatMessage) {
  return { role: message.role, content: message.content };
}

export class ChatAgent extends Agent<Env, ChatState> {
  initialState: ChatState = { messages: [] };

  async onConnect(connection: WebSocket) {
    connection.send(JSON.stringify({ type: "history", messages: this.state.messages.slice(-50) }));
  }

  async onMessage(connection: WebSocket, message: string) {
    let payload: UserPayload | ResetPayload | undefined;
    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }

    if (payload?.type === "reset") {
      this.setState({ messages: [] });
      connection.send(JSON.stringify({ type: "history", messages: [] }));
      return;
    }

    if (payload?.type !== "user" || typeof payload?.content !== "string") return;

    const userText = payload.content.trim();
    const imageDataUrl = isImageDataUrl(payload.imageDataUrl) ? payload.imageDataUrl : undefined;
    if (!userText && !imageDataUrl) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: userText || "Describe this image.",
      imageDataUrl
    };
    const nextMessages = [...this.state.messages, userMessage];
    this.setState({ messages: nextMessages });

    const context = nextMessages.slice(-12);
    const system = [
      "You are a helpful assistant running on Cloudflare.",
      "Be concise, actionable, and friendly.",
      "If you do not know something, say so and suggest next steps."
    ].join(" ");

    const visionContext = context.map(toAiMessage);
    const textContext = context.map(toTextOnlyMessage);
    let assistantText = "";
    try {
      const aiResp = await this.env.AI.run(imageDataUrl ? VISION_MODEL : TEXT_MODEL, {
        messages: [{ role: "system", content: system }, ...(imageDataUrl ? visionContext : textContext)],
        max_tokens: 512
      });

      assistantText =
        (aiResp && (aiResp.response || aiResp.result || aiResp.output_text)) ??
        (typeof aiResp === "string" ? aiResp : JSON.stringify(aiResp));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Llama 3.2 vision model may require a one-time license acceptance in some accounts.
      if (imageDataUrl && msg.includes("submit the prompt 'agree'")) {
        try {
          const fallbackResp = await this.env.AI.run(VISION_FALLBACK_MODEL, {
            prompt: `${system}\n\nUser request: ${userText || "Describe this image."}`,
            image: imageDataUrl
          });
          assistantText =
            (fallbackResp &&
              (fallbackResp.response ||
                fallbackResp.result ||
                fallbackResp.output_text ||
                fallbackResp.description)) ??
            (typeof fallbackResp === "string" ? fallbackResp : JSON.stringify(fallbackResp));
        } catch {
          connection.send(
            JSON.stringify({
              type: "assistant_done",
              content:
                "Image analysis is currently unavailable for this account. For Llama 3.2 vision, run one prompt with text 'agree' in Workers AI to accept the license, then try again."
            })
          );
          connection.send(
            JSON.stringify({
              type: "assistant",
              content:
                "Image analysis is currently unavailable for this account. For Llama 3.2 vision, run one prompt with text 'agree' in Workers AI to accept the license, then try again."
            })
          );
          return;
        }
      } else {
        connection.send(
          JSON.stringify({
            type: "assistant_done",
            content:
              "I hit an AI error. Please try again in a moment."
          })
        );
        connection.send(
          JSON.stringify({
            type: "assistant",
            content:
              "I hit an AI error. Please try again in a moment."
          })
        );
        return;
      }
    }

    const finalText = String(assistantText);
    const full = [...nextMessages, { role: "assistant", content: finalText } as ChatMessage];
    this.setState({ messages: full });

    connection.send(JSON.stringify({ type: "assistant_start" }));
    for (const chunk of chunkByWords(finalText, 3)) {
      connection.send(JSON.stringify({ type: "assistant_chunk", content: chunk }));
      await sleep(24);
    }

    connection.send(JSON.stringify({ type: "assistant_done", content: finalText }));
    connection.send(JSON.stringify({ type: "assistant", content: finalText }));
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const routed = await routeAgentRequest(request, env);
    if (routed) return routed;
    return env.ASSETS.fetch(request);
  }
};
