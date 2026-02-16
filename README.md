# 🚀 Cloudflare AI Agent Chat App

An AI-powered real-time chat application built using **Cloudflare Workers, Agents SDK, Durable Objects, and Workers AI (Llama 3.3)**.  
This project demonstrates how to build a scalable, serverless AI chat system with persistent conversation memory and WebSocket-based real-time messaging.

---
## 🌐 Live Demo
👉 https://cloudflare-agents-chat.chavasaisreeja2002.workers.dev

## 💻 GitHub Repository
👉 https://github.com/saisreejachava/cloudflare-ai-agent-app
---
## 🚀 Features
- LLM Integration: Llama 3.3 via Cloudflare Workers AI  
- Persistent memory using Durable Objects  
- Real-time chat via WebSockets  
- Fully serverless deployment on Cloudflare Workers  
- Per-user conversation state  
- Fast global edge deployment  

## 🏗️ Architecture
User → Web Chat UI → Cloudflare Agent (Durable Object) → Workers AI (Llama 3.3) → Response to UI


## ⚙️ How It Works

1. User opens chat UI  
2. A unique Agent ID is generated per user  
3. WebSocket connects to Cloudflare Agent (Durable Object)  
4. User message → sent to Worker  
5. Worker calls Workers AI (Llama 3.3)  
6. Response returned in real-time  
7. Conversation stored in Durable Object memory  

---

## 🛠️ Tech Stack
- Cloudflare Workers  
- Cloudflare Agents SDK  
- Workers AI (Llama 3.3)  
- Durable Objects (state & memory)  
- WebSockets  
- TypeScript  
- HTML/CSS frontend  

## 📂 Project Structure
cloudflare-ai-agent-app/  
│── public/index.html      → Chat UI  
│── src/server.ts          → Agent + AI logic  
│── wrangler.jsonc         → Cloudflare config  
│── package.json  
│── README.md  

## 💻 Run Locally
npm install  
npx wrangler dev  

Open:  
http://localhost:8787  

## 🌍 Deploy
npx wrangler deploy  

After deploy you will get a live link like:  
https://your-app-name.your-subdomain.workers.dev  

## 🧪 Example
Type in chat:  
Hi  

AI responds using Llama 3.3 with conversation memory.

## 🎯 Purpose
This project demonstrates building a complete AI-powered application using Cloudflare’s ecosystem including LLM integration, agent workflows, persistent memory, and real-time communication.

## 👤 Author
Sai Sreeja Chava  
MS Computer Science – University of Florida  



## ⭐ Future Improvements
- Streaming AI responses  
- Voice input  
- Multi-agent workflows  
- Document (PDF) chat using RAG  
