# 🤖 PredictAI — AI Predictive Maintenance Intelligence System

An AI-driven predictive maintenance system for manufacturing: it monitors machine data in real time and uses an AI agent engine to flag maintenance needs before failures happen, reducing unplanned downtime and cost.

## ✨ Highlights

- **Real-time monitoring** — live machine data streamed to the dashboard over WebSockets (`ws`)
- **AI agent engine** — server-side agent (`server/agent-engine.js`) analyses incoming data and generates maintenance intelligence
- **Browser AI agent** — `js/ai-agent.js` powers the interactive front-end experience
- **Express backend** — `server.js` serves the app and API with CORS enabled

## 🛠️ Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | HTML, CSS, JavaScript (`index.html`, `css/`, `js/`) |
| Backend | Node.js, Express 4 |
| Realtime | WebSocket (`ws`) |
| Package | `predictai-server` v2.0.0 |

## 🚀 Getting Started

```bash
# install dependencies
npm install

# start the server
npm start
```

Then open the app in your browser (the server serves `index.html`).

## 📂 Project Structure

```
├── index.html          # Dashboard UI
├── css/                # Stylesheets
├── js/
│   └── ai-agent.js     # Front-end AI agent
├── server.js           # Express + WebSocket server (entry point)
├── server/
│   └── agent-engine.js # Server-side AI agent engine
└── package.json
```

## 👤 Author

**Ishan Timalsina** — [GitHub](https://github.com/itsmeishan14-bit)
