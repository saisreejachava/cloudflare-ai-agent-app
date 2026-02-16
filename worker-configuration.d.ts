/// <reference types="@cloudflare/workers-types" />

interface Env {
  AI: any; // Workers AI binding
  ASSETS: Fetcher; // Static assets binding
  ChatAgent: DurableObjectNamespace;
}
