# Wizzleflow

Wizzleflow is a direct-access, local-first flowchart editor. Open the product, choose **Try Tool**, and create diagrams without an account, sign-in step, or email address.

## Product model

- The landing page links directly to the local diagram dashboard.
- Diagrams are created, edited, and autosaved in the browser's `localStorage`.
- The editor uses a custom HTML/SVG canvas; it does not use React Flow.
- Starter diagrams are deterministic data bundled with the application and do not call a remote service.
- An optional AI action generates a validated flowchart from a process description and inserts it only after review.
- AI can also review the current diagram for logic risks, revise a selected area on request, and generate test cases, all previewed before anything changes.
- PNG, SVG, JSON, and PDF export are available. JSON diagrams can be imported into the editor.

## Storage and backups

Diagram data remains in the current browser profile. It is not automatically synchronized to another browser or device. Clearing site data can remove saved diagrams, so export important diagrams as JSON for backup.

Wizzleflow currently has:

- No account or email requirement
- No cloud sync or account recovery
- No collaboration or shared links
- No mobile-first editing experience (desktop and tablet landscape are recommended)
- No open-ended AI chat; AI actions are the four scoped workflows described below

## Technology stack

- React 18 and React DOM 18
- TypeScript
- Vite 8
- Tailwind CSS 3
- Framer Motion, Lucide React, and Lenis
- Custom HTML/SVG diagram rendering and connection routing
- Express 5 server boundary and the official `@google/genai` SDK
- Alternative Cloudflare Workers deployment (`worker/`) using Hono and Workers KV, reusing the same AI service/provider code
- Zod runtime validation for AI requests and structured flowcharts
- Vitest, Testing Library, and Playwright

There is no database or authentication service. Manual editing needs no provider credentials. AI generation requires a server-side Gemini key.

## AI flowchart generation

Wizzleflow can convert a natural-language process description into an editable flowchart. Provider output never enters the editor directly:

```text
Browser workspace
→ same-origin POST /api/ai/generate-flowchart
→ Gemini Interactions API
→ structured response and runtime graph validation
→ deterministic top-to-bottom layout
→ preview and explicit acceptance
→ editable Wizzleflow nodes and connections
```

The browser never imports the Gemini SDK and never receives the provider key. Gemini is called only after the user clicks **Generate**. Invalid responses and provider failures leave the current diagram unchanged; there is no mock fallback.

Prototype protection defaults to three attempted generations per IP per UTC day, one attempt every 20 seconds, one active request per IP, prompts up to 2,000 characters, and generated diagrams up to 25 nodes and 40 edges. The in-memory IP limiter is intended for a single prototype process and is not reliable across multiple server instances.

## AI review, selective editing, and test cases

Beyond generating a new flowchart, three additional AI actions work on the diagram already on the canvas. Each is reachable from the top-bar overflow menu (or the selection toolbar for editing) and shares the same same-origin API boundary, daily quota, and no-mock-fallback guarantee as generation:

- **Review with AI** (`POST /api/ai/review-flowchart`) — sends the current diagram and returns a summary plus a list of findings (severity, category, message, recommendation). Read-only; nothing on the canvas changes.
- **Edit with AI** (`POST /api/ai/edit-flowchart`) — available from the selection toolbar once one or more nodes are selected. Describe how the selected area should change; Gemini returns a self-contained replacement fragment, previewed before anything is applied. On acceptance, the selected nodes/connections are removed and the fragment is spliced in, reconnecting any connections that crossed the selection boundary to the fragment's first start/end step. One Undo reverses the whole edit.
- **Generate test cases with AI** (`POST /api/ai/generate-test-cases`) — sends the current diagram and returns practical test scenarios (inputs, expected path, expected outcome, risk covered) covering normal paths, rejected paths, and boundary decisions. Read-only.

## Enable AI Flowchart Generation

Node.js 20 and npm are used by the project workflow.

1. Copy the tracked environment template to one root `.env` file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Add your Gemini API key to the root `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

`GEMINI_API_KEY` is the only required setting. The model, limits, and timeout have safe defaults in `.env.example`.

3. Install and start the frontend and backend together:

```bash
npm install
npm run dev
```

4. Open the Vite URL and click **Generate with AI**. Once a diagram exists, **Review with AI** and **Generate test cases with AI** are in the top-bar overflow menu, and **Edit with AI** appears in the selection toolbar after selecting one or more nodes.

The key stays on the Node server and must never use a `VITE_`, `PUBLIC_`, or `NEXT_PUBLIC_` prefix. Restart `npm run dev` after changing `.env`. Never commit `.env`; it is ignored by Git. Manual flowchart editing works without a key, while AI generation is subject to Gemini and prototype quotas.

`npm run dev` starts Vite and the TypeScript API server together. Vite serves the frontend on its printed development URL and proxies relative `/api` requests to `http://127.0.0.1:8787`. Ctrl+C stops both processes.

To verify configuration without revealing the key:

```bash
npm run check:ai
```

To make one optional real provider request after configuring a key:

```bash
npm run test:ai:smoke
```

The smoke script skips safely when the key is absent and never runs a real provider request when `CI` is set.

## Sample data for testing

No sample files are required: manual editing starts from deterministic starter diagrams bundled with the app, and AI generation takes a plain-text prompt instead of an uploaded dataset. To try AI generation quickly, use one of the built-in example prompts (also selectable from the **Generate with AI** modal):

- "Create an employee leave approval workflow. The employee submits a request, the manager reviews it, and HR checks the leave balance. Include approval and rejection outcomes."
- "Create an online refund process. Support checks eligibility. Refunds above ₹5,000 require manager approval. Finance processes approved refunds and the customer is notified of every result."
- "Create a user registration workflow. Validate the entered details, create the account when valid, send verification, and show errors when invalid."

Any of these produces a small validated flowchart (start/decision/process/end nodes) within the daily quota described below.

## Local development without AI

No `.env` file is required for the manual editor:

```bash
npm install
npm run dev
```

The server still starts, `/api/health` reports AI as unconfigured, and local diagram creation/editing remains available.

The processes can also be started separately:

```bash
npm run dev:client
npm run dev:server
```

## Validation commands

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run server:test
npm run server:build
npm run test:e2e
npm run build
```

## AI troubleshooting

### AI is not configured

Confirm `GEMINI_API_KEY` exists in the repository-root `.env` file, then restart both processes:

```bash
npm run dev
```

Check the safe health response at `GET /api/health`. A configured development server reports the Gemini provider and model but never the key.

### Server unavailable

Use the combined command so Vite and the AI server start together:

```bash
npm run dev
```

The browser intentionally calls relative `/api` endpoints. Do not add a localhost provider URL or key to frontend code.

### Gemini quota reached

Wait for the applicable free quota or prototype limit to reset, or use another eligible Gemini project/key. Wizzleflow does not automatically enable paid billing or switch providers.

The production build creates `dist/` and `dist-server/`. A Node deployment can serve the same-origin frontend and API after building:

```bash
npm run build
npm start
```

Static-only hosting can serve the manual editor but cannot securely provide AI generation unless a same-origin server function is also deployed.

## Cloudflare Workers deployment

`worker/index.ts` is a Cloudflare Workers-native equivalent of the Node server: a small Hono app serving the same `/api/health` and four `/api/ai/*` routes, falling through to the built `dist/` assets (with SPA routing) for everything else. It reuses `shared/ai/*`, `server/services/diagramGenerationService.ts`, and `server/providers/geminiFlowchartProvider.ts` unchanged — the `@google/genai` SDK runs as-is under the `nodejs_compat` compatibility flag. Rate limiting uses Workers KV instead of in-memory state, since Workers run across many distributed edge instances rather than one long-lived process; KV's eventual consistency means the daily count is a prototype-grade deterrent rather than a hard guarantee, matching the original in-memory limiter's documented limits.

This fits entirely inside Cloudflare's free plan: 100,000 requests/day, 10ms CPU time per request (time spent awaiting the Gemini call doesn't count against that), and KV's free 100K reads / 1K writes per day comfortably covers the default 3-per-IP daily AI limit.

One-time setup:

1. Create the KV namespace used for rate limiting:

   ```bash
   npx wrangler kv namespace create RATE_LIMIT_KV
   ```

   Copy the returned `id` into `wrangler.jsonc`'s `kv_namespaces[0].id`, replacing the placeholder.

2. Set the Gemini key as a Worker secret, never as a plain variable:

   ```bash
   npx wrangler secret put GEMINI_API_KEY
   ```

   Or via the dashboard: **Workers & Pages → your project → Settings → Variables and Secrets → Add variable → type Secret**.

3. Test locally before deploying. `wrangler dev` runs the whole Worker — routes, KV, static assets — against local emulated bindings, reading secrets from a git-ignored `.dev.vars` file (same idea as `.env`; never commit it):

   ```bash
   npm run worker:dev
   ```

4. Deploy:

   ```bash
   npm run worker:deploy
   ```

`GET /api/health` on the deployed URL should report `configured: true` once the secret is set.

## Privacy

Wizzleflow stores diagram content in browser local storage. No account or email is required, and diagrams are not automatically uploaded or synchronized. When the user explicitly generates a flowchart, the entered process description is sent through the Wizzleflow server to Gemini. The deployed site may also make network requests for hosting, externally loaded fonts, or other static resources. See the in-product privacy page for the current disclosure.

## Current limitations

- AI editing only replaces a self-contained selected area; there is no open-ended AI chat.
- Connections that crossed the boundary of an AI-edited selection are reattached to the fragment's first start/end step, which may need manual adjustment for diagrams with multiple external entry or exit points.
- There is no cloud synchronization, collaboration, or account recovery.
- Phone editing is not a touch-first experience.
- The Node server's in-memory AI limiter does not coordinate quota across multiple processes or serverless instances; the Cloudflare Workers deployment uses a KV-backed limiter instead, which coordinates globally but isn't strongly consistent (a prototype-grade deterrent, not a hard guarantee).
- A real Gemini smoke test requires a configured `GEMINI_API_KEY`; automated tests always mock the provider.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
