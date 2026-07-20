# 🌊 Wizzleflow

**An intuitive, local-first flowchart editor built for speed and powered by AI.**

Created for the **OpenAI Build Week**.

![Wizzleflow Overview](https://wizzleflow.xyz/og-image.png)

## 🚀 The Pitch

Creating flowcharts usually involves signing up for a bloated SaaS tool, wrestling with manual layout mechanics, or paying monthly subscriptions.

**Wizzleflow** is different. It’s a direct-access, local-first flowchart editor that runs entirely in your browser.

- **Zero friction:** No account, no email, no sign-in required.
- **Lightning fast:** Diagrams are saved directly to your browser's local storage.
- **AI-Powered:** Describe your process in plain English, and the AI instantly generates a logically complete, properly routed, and editable flowchart for you.

## 🛠️ Features

- **Text-to-Flowchart (AI Generate):** Describe a workflow (e.g. "Create a login process with 3 retries and account lockout") and get a structured, editable diagram instantly.
- **AI Review:** Analyzes your current diagram for logic risks, missing branches, or unreachable nodes.
- **AI Test Case Generation:** Automatically creates practical QA test scenarios covering normal paths and edge cases based on your flow.
- **Selective AI Editing:** Select a group of nodes and ask the AI to "Regenerate this branch to include manager approval."
- **Export Anywhere:** Export your diagrams to PNG, SVG, PDF, or JSON.

## 💻 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Canvas:** Custom HTML/SVG rendering engine (no heavy graph libraries)
- **Backend:** Node.js (Express) / Cloudflare Workers
- **AI Integration:** LLM Structured Outputs for deterministic graph generation
- **Validation:** Zod for runtime schema validation

## 🏗️ How We Built It for Build Week

For the **OpenAI Build Week**, we focused on solving the deterministic layout problem with LLMs. LLMs are great at text, but traditionally struggle to output strictly typed graph structures (nodes, edges, node types).

> **Note on AI Provider:** While this project was built for the OpenAI Build Week, the codebase currently uses the **Google Gemini API** for LLM structured outputs because Gemini provides a generous free tier for developers, whereas OpenAI requires a paid account. The structured graph generation pipeline concept remains identical regardless of the provider used.

We built a **structured JSON schema pipeline** that forces the AI to return exactly the format our custom canvas engine needs:

1. **System Prompting:** Defines strict node types (start, process, decision, inputOutput, end) and routing rules.
2. **Structured Outputs:** Guarantees that every `edge` references a valid `nodeId` that actually exists in the generation payload.
3. **BFS Layout Engine:** A custom breadth-first search algorithm computes X/Y coordinates dynamically based on the AI's logical output, routing connections automatically.

## ⚙️ Local Development

Requires Node.js 20+.

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up your environment variables:

```bash
cp .env.example .env
```

_(Add your Gemini API key to `.env`)_

3. Start the development server (Frontend + API):

```bash
npm run dev
```

4. Open `http://localhost:5173` and click **Generate with AI** to test the prompt-to-diagram pipeline.

## 🛡️ Privacy & Storage

Wizzleflow is fundamentally local-first.

- Diagrams never leave your browser unless you explicitly invoke an AI feature.
- AI features only send the prompt (or current canvas state) at the exact moment you click "Generate" or "Review".
- There is no database. Your data belongs to you.

## 📜 License

MIT License. See [LICENSE](LICENSE) for details.
