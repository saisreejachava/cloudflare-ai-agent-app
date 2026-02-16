# 🧠 Cloudflare AI Agent Chat App

An AI-powered real-time chat application built using Cloudflare Workers AI, Agents SDK, and Durable Objects.  
This project demonstrates how to build a scalable serverless AI application with memory and real-time communication.

## 🚀 Features
- LLM Integration: Llama 3.3 via Cloudflare Workers AI  
- Persistent memory using Durable Objects  
- Real-time chat via WebSockets  
- Fully serverless deployment on Cloudflare Workers  
- Per-user conversation state  
- Fast global edge deployment  

## 🏗️ Architecture
User → Web Chat UI → Cloudflare Agent (Durable Object) → Workers AI (Llama 3.3) → Response to UI

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
GitHub: https://github.com/saisreejachava

## ⭐ Future Improvements
- Streaming AI responses  
- Voice input  
- Multi-agent workflows  
- Document (PDF) chat using RAG  
