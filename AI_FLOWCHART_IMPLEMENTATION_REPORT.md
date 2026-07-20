# Wizzleflow AI Flowchart Implementation Report

Date: 2026-07-19

## 1. Baseline

The worktree was clean on branch `arunvpp` before this implementation began. The previously completed local-first workspace work is present in the current commit and was not overwritten.

| Command | Exit code | Important output |
| --- | ---: | --- |
| `git status --short --branch` | 0 | Clean worktree on branch `arunvpp`. |
| `npm install` | 0 | Already up to date; 366 packages audited; full dependency tree reported 1 low and 1 high vulnerability. |
| `npm run lint` | 0 | Passed. |
| `npm run typecheck` | 0 | Passed. |
| `npm test -- --run` | 0 | 8 files and 15 tests passed. |
| `npm run test:e2e` | 0 | 5 Chromium tests passed. |
| `npm run build` | 0 | Passed; 2,100 modules transformed. Browserslist data warning remained. |

Existing AI state at baseline:

- `src/services/aiService.ts` is already absent.
- AI response types and `materializeAIFlowChart` are already absent.
- The editor currently exposes no AI control; the landing page and README state that AI is not implemented/coming soon.
- No mock generation, artificial timeout, or silent fake fallback remains in the current source.
- Reusable seams are `replaceFlowChartContent` and `transformFlowChart` in `src/hooks/useFlowChart.ts`, centralized node defaults in `src/features/editor/domain/nodeDefaults.ts`, editor autosave in `src/pages/Editor.tsx`, and the existing local diagram state.
- `replaceFlowChartContent` commits one history snapshot, making it suitable for one-step accepted AI replacement.
- `transformFlowChart` can add generated content as one transaction, making it suitable for one-step accepted AI addition.
- The repository has no backend, serverless function, hosting-provider configuration, or server runtime. Vite serves a static React application and CI validates only the frontend.

## 2. Existing mock AI removed

The deterministic mock had already been removed during the preceding workspace-stabilization phase. Repository tracing confirmed that `src/services/aiService.ts`, the old index-based response types, `materializeAIFlowChart`, keyword templates, artificial generation delays, disabled editor AI controls, and silent fallback behavior were absent before this change.

No mock fallback was reintroduced. If the server, key, Gemini service, or model response is unavailable, the UI displays a safe error and manual editing remains available.

## 3. Server architecture selected

No backend or serverless provider was configured, so a minimal same-origin TypeScript/Express server was added under `server/`. Vite proxies `/api` to `127.0.0.1:8787` during development. The production server can serve `dist/` plus the API after `npm run build` and `npm start`.

Key boundaries:

- `server/app.ts`: Express composition, health endpoint, JSON limit, response headers, routes, optional production static serving, and safe 404 handling.
- `server/routes/generateFlowchart.ts`: content-type/request validation, request ID, client-abort propagation, and rate-limit lifecycle.
- `server/providers/geminiFlowchartProvider.ts`: the only Gemini SDK import and provider-specific logic.
- `server/services/diagramGenerationService.ts`: provider-neutral orchestration and configured graph-size enforcement.
- `server/middleware/`: in-memory limiter and normalized error boundary.
- `shared/ai/`: provider-neutral schema and API contracts shared with the browser.

There is no cross-origin browser/provider call. Static-only hosting remains sufficient for manual editing but cannot securely enable AI generation.

## 4. Gemini SDK and model configuration

Installed the official `@google/genai` package at version 2.12.0. The server initializes `GoogleGenAI` without forcing an incompatible API-version override, allowing the SDK to select the supported Interactions endpoint. It calls `client.interactions.create`, sets `store: false`, uses `response_format` with `mime_type: 'application/json'` and the canonical JSON schema, sets low reasoning and a bounded output size, and permits at most one SDK retry.

The default model is `gemini-3.1-flash-lite`. `GEMINI_API_KEY` and `GEMINI_MODEL` are read only from the Node process environment. The key is never referenced by frontend code. SDK timeout/cancellation options are used; Markdown fence parsing and regex JSON extraction are not used.

## 5. Structured schema

`shared/ai/aiDiagramSchema.ts` defines schema version `1.0` with title, summary, canonical nodes, and canonical edges. Allowed kinds are exactly `start`, `process`, `decision`, `inputOutput`, and `end`. Strict objects reject unknown fields, so provider coordinates, dimensions, colors, CSS, HTML, SVG, URLs, JavaScript, Wizzleflow IDs, and arbitrary node types are not accepted.

The same structural Zod schema supplies the Gemini JSON schema and the browser response validator. A separate semantic refinement protects the editor after JSON parsing.

## 6. Validation rules

Runtime validation enforces:

- Schema version `1.0`.
- 25 nodes and 40 edges maximum, with environment settings permitted to lower those server limits.
- Unique bounded node and edge keys.
- Supported kinds and strict field sets.
- Non-empty bounded title, summary, and node labels; bounded descriptions and edge labels.
- No HTML-like tags or entities in user-visible generated text.
- Valid edge references, no self edges, and no duplicate directed edges.
- At least one start and one end node.
- No isolated nodes.
- Every node reachable from a start.
- Every node able to reach an end, including graphs containing a small cycle with an exit.
- At least two distinctly and non-emptily labelled outgoing branches for every decision.

Invalid model output is converted to `INVALID_AI_RESPONSE` and never reaches the adapter or editor.

## 7. API endpoint

`POST /api/ai/generate-flowchart` accepts only a strict JSON object with a non-blank `prompt`. It rejects non-JSON content, malformed JSON, unknown request fields, bodies above 8 KB, and prompts longer than the configured maximum (2,000 by default). A successful response contains a UUID request ID and the validated canonical diagram.

`GET /api/health` returns a safe nested AI availability object. When configured it includes only provider name and configured model; when unconfigured it includes only `configured: false`. It exposes no key, environment value, internal path, or stack trace.

Errors are normalized to `INVALID_REQUEST`, `PROMPT_TOO_LONG`, `RATE_LIMITED`, `AI_NOT_CONFIGURED`, `AI_TIMEOUT`, `AI_PROVIDER_ERROR`, `INVALID_AI_RESPONSE`, or `INTERNAL_ERROR`. Raw Gemini messages and stacks are not returned.

## 8. Rate limiting

The prototype limiter records attempted generations by IP and UTC day. Defaults are three attempts per day, one attempt every 20 seconds, and one active request per IP. Request validation happens before quota consumption. Provider HTTP 429/resource-exhaustion errors are also normalized to a safe `RATE_LIMITED` response.

The limiter is intentionally in memory: it is suitable for one prototype Node process but is not authoritative across restarts, multiple instances, or serverless replicas. This limitation is documented in the README and UI.

## 9. Adapter and layout

`materializeAiDiagram` is a pure adapter from validated canonical data to ordinary Wizzleflow nodes and connections. It generates fresh node/connection UUIDs, maps canonical keys to new IDs, maps `inputOutput` to the existing `input` node type, uses centralized node dimensions, preserves edge labels, ignores all provider styling, rejects unresolved references, and does not mutate its input.

`layoutAiDiagram` performs deterministic top-to-bottom layered positioning. Starts remain at the top, ends are pushed below meaningful work, siblings/decision branches are spaced horizontally, merged paths return to later layers, and cycles are bounded to avoid infinite traversal. Add mode places generated content beyond the right edge of existing nodes. Tests cover linear, branch/merge, multiple decisions, multiple ends, a cycle with an exit, repeat stability, and overlap avoidance for supported cases.

## 10. AI workspace UI

The existing workspace design and custom canvas were preserved. The only editor chrome change is a `Generate with AI` action in the existing top bar/overflow pattern. It opens `AiFlowchartModal`, which uses the established violet/slate visual language and contains a labelled prompt, 2,000-character counter, three example prompts, explicit free-limit note, loading messages without fake percentages, cancellation, and safe inline errors.

No unrelated landing, dashboard, toolbar, inspector, node, edge, or canvas redesign was performed. The stale landing “Coming Soon” wording was changed only to accurately describe the now-available configured feature.

## 11. Preview and acceptance workflow

Generation never mutates the canvas immediately. A validated result shows title, summary, counts, and a small deterministic SVG preview. The user can accept, generate again, or cancel.

An empty canvas accepts as a replacement. A non-empty canvas requires the user to choose add or replace; replacement then requires an explicit second confirmation. Add mode offsets the generated graph away from current content. Cancel, request failure, and invalid output preserve the current diagram.

## 12. Undo and persistence integration

Replace mode calls the existing `replaceFlowChartContent` once. Add mode calls `transformFlowChart` once. Each accepted generation is therefore one logical history entry, and one Undo reverses it. Replace mode adopts the generated title; add mode preserves the existing diagram title.

The existing local autosave observes the resulting state change and truthfully moves through Saving to Saved locally or reports local-storage failure. The prompt, API key, raw Gemini interaction, and provider response are not persisted. Generated items are ordinary unlocked Wizzleflow nodes/connections and remain editable/exportable.

## 13. Tests added

Automated coverage now includes:

- Canonical schema validity and rejection of duplicate keys, missing start/end, dangling/self edges, isolated nodes, unsupported kinds, HTML, oversize, and weak decision branches.
- Gemini provider structured Interactions options, `store: false`, malformed/invalid/missing output, timeout, provider-error normalization, and no fake fallback.
- Endpoint health, missing key, valid/empty/oversized prompt, content type, unknown fields, malformed/oversized body, safe errors, cooldown, and daily limits.
- Adapter fresh IDs, key mapping, `inputOutput` mapping, labels, non-mutation, and add offset.
- Layout stability, direction, branch/merge, multiple decisions/end states, cycle safety, and supported overlap cases.
- AI modal prompt examples, loading/duplicate-submit prevention, safe server error, preview, add/replace selection, and confirmed replacement.
- One-step generated replacement undo.
- Playwright coverage for preview/accept/undo/redo/autosave/reload and failure preservation, plus all existing editor/dashboard regressions.

All Gemini SDK calls are mocked in automation; CI makes no provider request.

## 14. Files added, changed, and deleted

Added:

- `server/` application, route, provider, service, middleware, configuration, and tests.
- `shared/ai/aiDiagramSchema.ts`, `shared/ai/apiSchemas.ts`, and schema tests.
- `src/features/ai/components/AiFlowchartModal.tsx` and tests.
- `src/features/ai/services/aiFlowchartClient.ts`.
- `src/features/ai/adapter/materializeAiDiagram.ts` and tests.
- `src/features/ai/layout/layoutAiDiagram.ts` and tests.
- `tsconfig.server.json`, `vitest.server.config.ts`, and this report.

Changed:

- Runtime/scripts/dependencies: `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, `vite.config.ts`, `eslint.config.js`, `tsconfig.app.json`.
- Integration/copy: `src/pages/Editor.tsx`, `src/components/editor/EditorTopBar.tsx`, `src/pages/LandingPage.tsx`, `src/pages/PrivacyPage.tsx`.
- Tests/docs: `src/hooks/useFlowChart.test.tsx`, `tests/editor.spec.ts`, `README.md`.

Deleted: none. The old mock files were already absent at baseline.

## 15. Commands and exit codes

Baseline commands are recorded in Section 1. Dependency commands completed with exit code 0:

- `npm install @google/genai zod express`
- `npm install --save-dev @types/express @types/node tsx concurrently`
- `npm install dotenv`
- `npm install --save-dev supertest @types/supertest`

Final validation:

| Command | Exit code | Result |
| --- | ---: | --- |
| `npm run lint` | 0 | Passed. |
| `npm run typecheck` | 0 | Frontend/shared and server type checks passed. |
| `npm test -- --run` | 0 | 14 files, 64 tests passed. |
| `npm run test:e2e` | 0 | 7 Chromium tests passed, including AI acceptance/persistence and failure preservation. |
| `npm run build` | 0 | Server and Vite production builds passed; Vite transformed 2,185 modules. A non-failing outdated Browserslist-data warning remains. |
| `npm audit --package-lock-only --omit=dev` | 0 | 0 production vulnerabilities reported. |
| `npm run server:typecheck` | 0 | Passed. |
| `npm run server:test` | 0 | 3 files, 39 server/shared tests passed. |
| `npm run server:build` | 0 | Passed; final dependency-external Node artifact is 17.3 KB. |
| Production health/static smoke | 0 | Built server returned `200` for `/`, `{ status: "ok", ai: { configured: false } }` for `/api/health`, then was deliberately stopped. |
| Frontend secret-reference scan | 0 | No `GEMINI_API_KEY`, public Gemini key variable, or `@google/genai` reference in `src/` or `dist/`. |
| Repository key-pattern scan | 0 | No Google API-key-shaped value found outside ignored dependencies/generated output. |

Two intermediate failures were retained as implementation evidence rather than hidden:

1. The first new E2E run exited 1 because its `Generate` locator also matched `Generate with AI`; the test was corrected to use an exact accessible name.
2. The next E2E run exited 1 and exposed a real request-cancellation race caused by a changing parent callback; the modal now keeps a stable callback reference, and both focused AI E2E tests passed afterward.
3. The first `npm start` smoke exited 1 because the initial server bundle embedded CommonJS `dotenv` internals into ESM. The build was corrected to keep Node packages external; rebuilt `npm start`, `/api/health`, and static application delivery then worked.

## 16. Real Gemini smoke-test result

Initially not run because no key was configured. On 2026-07-20, after a root `.env` was configured, the safe real-provider smoke test passed with `gemini-3.1-flash-lite`: structured diagram validation passed with 9 nodes and 8 edges. The key and raw provider response were not printed.

## 17. Remaining limitations

- The in-memory limiter resets on process restart and is not coordinated across replicas.
- The repository has no provider-specific managed deployment configuration; a Node-compatible host must run `dist-server/index.js`, or the API must be adapted to the selected host's secure function format.
- The layered layout is deliberately focused rather than a general graph-layout engine; unusually dense/cyclic graphs may need manual adjustment after generation.
- AI editing, chat, workflow analysis, collaboration, cloud storage, and provider switching remain out of scope.
- The custom visual canvas still has the accessibility limitations documented in the repository audit.

## Simple environment setup

The preferred development workflow is now exactly one repository-root `.env`, followed by `npm install` and `npm run dev`. `GEMINI_API_KEY` is the only required AI value. All other AI settings have centralized defaults. No frontend environment variable, provider-class edit, duplicated configuration file, or separate frontend/server startup command is required.

## Root `.env` loading

`server/config/env.ts` explicitly locates the repository root by walking upward from the module location until it finds the Wizzleflow `package.json` and `server/` directory. It then loads only `<repository-root>/.env` with the existing `dotenv` package before parsing configuration or creating the application.

This works from source under `tsx`, from the dependency-external compiled server in `dist-server/`, from root npm scripts, and without relying solely on the shell's current directory. Automated tests load a temporary root `.env` and verify values reach the central configuration. Process environment values retain precedence over `.env` values.

Missing `.env` and missing `GEMINI_API_KEY` are valid: the server starts, the editor remains manual/local, health reports unconfigured, and generation returns `AI_NOT_CONFIGURED`. Invalid explicit numeric values or an explicitly empty model fail with a variable-named, value-free configuration error.

## Development scripts

`npm run dev` retains the existing `concurrently -k` composition and starts `npm run dev:client` (`vite`) plus `npm run dev:server` (`tsx watch server/index.ts`). Named process output keeps errors visible, and Ctrl+C terminates the pair. The API listens on `127.0.0.1:8787`; Vite uses its first available development port and prints it.

Added:

- `npm run check:ai` for safe local configuration status.
- `npm run test:ai:smoke` for one optional, non-CI real Gemini request.

Production remains `npm run build` followed by `npm start`.

## Vite API proxy

`vite.config.ts` forwards `/api` to `http://127.0.0.1:8787` with `changeOrigin: true`. The browser uses only relative `/api/health` and `/api/ai/generate-flowchart` URLs. No provider URL, key, or custom authentication header exists in frontend code.

## Gemini configuration

`server/config/env.ts` is the only runtime default source. It exposes an optional trimmed key, a non-empty configurable model, and bounded positive numeric settings. The default model is `gemini-3.1-flash-lite`.

`server/app.ts` creates `createGeminiFlowchartProvider` only when `config.geminiApiKey` exists and passes the centralized model and timeout. The provider does not read process environment directly. When the key is absent, the provider is not instantiated and the provider-neutral service returns the existing safe `AI_NOT_CONFIGURED` error.

## Health endpoint

Configured response:

```json
{
  "status": "ok",
  "ai": {
    "configured": true,
    "provider": "gemini",
    "model": "gemini-3.1-flash-lite"
  }
}
```

Unconfigured response:

```json
{
  "status": "ok",
  "ai": {
    "configured": false
  }
}
```

Tests verify that neither form includes the API key, its name, internal paths, or provider internals.

## Frontend availability state

Opening the existing AI modal makes one cached request to `/api/health`. A configured response enables Generate. An unconfigured response disables only Generate and shows root-`.env` restart guidance in development; production shows the shorter “AI generation is currently unavailable” copy. A server failure is distinguished in development. The rest of the editor remains usable and no key is sent to or inspected by the browser.

## Configuration checker

`npm run check:ai` reports only whether the root environment file exists, whether a key is configured, the model when enabled, and whether server configuration is valid. It never prints the key, partial key, file path, environment object, or all process variables. Missing key exits successfully and states that AI is disabled; malformed configuration exits unsuccessfully with only the invalid variable name.

## Smoke-test script

`npm run test:ai:smoke` loads the same central root configuration. It skips successfully when the key is absent and always skips real provider traffic when `CI` is set. With a configured key it starts the Express application on an ephemeral loopback port, submits one controlled prompt through the real API endpoint, validates the response with the shared schema, and prints only model and node/edge counts. Expected failures print a normalized code without raw provider content or stack traces.

## Secret exposure verification

The ignore rules explicitly cover `.env`, `.env.local`, `.env.*.local`, and `server/.env`, while retaining `.env.example`. The root example contains placeholders only. Runtime code contains the environment variable name but no value. Final frontend-source, frontend-bundle, key-pattern, logs/error, and generated-artifact scans are recorded in the final command table below.

## README setup instructions

The README now provides Unix and PowerShell copy commands, the single required key line, the two-command install/start workflow, server-only key guidance, restart requirements, manual no-key behavior, quota guidance, `check:ai`, optional smoke testing, health checks, and troubleshooting for unconfigured AI, unavailable server, and quota exhaustion.

## Commands and exit codes

Configuration follow-up validation:

| Command | Exit code | Result |
| --- | ---: | --- |
| `npm run lint` | 0 | Passed. |
| `npm run typecheck` | 0 | Frontend/shared and server type checks passed. |
| `npm test -- --run` | 0 | 18 files and 84 tests passed after the live compatibility regression coverage was added. |
| `npm run server:test` | 0 | 6 files and 56 tests passed. |
| `npm run test:e2e` | 0 | 8 Chromium tests passed, including configured AI, unavailable AI, and continued manual editing. |
| `npm run build` | 0 | Server and frontend production builds passed; Vite transformed 2,185 modules. The existing non-failing Browserslist-data warning remains. |
| `npm run server:build` | 0 | Passed; final compiled dependency-external server artifact was 22.4 KB. |
| `npm run check:ai` | 0 | Safely reported no root `.env`, no configured key, AI disabled, and valid manual-editor configuration. |
| `AI_DAILY_LIMIT=0` plus `npm run check:ai` | 1 (expected) | Rejected invalid configuration and printed only the variable name, not its value or the environment. |
| `npm run test:ai:smoke` | 0 | Safely skipped because no key is configured; no provider request was made. |
| `npm run test:ai:smoke` after key configuration and compatibility repair | 0 | Real Gemini Interactions request passed; runtime diagram validation passed with 9 nodes and 8 edges. |
| `npm audit --package-lock-only --omit=dev` | 0 | Found 0 production vulnerabilities. |
| `npm run dev` no-key startup | 0 (deliberately stopped) | Started Vite and the API together. Vite selected `5174` because an unrelated existing process already occupied `5173`; the API started on `8787`. Proxy health returned `ok/configured: false`, frontend returned 200, and generation returned `AI_NOT_CONFIGURED`. Ctrl+C stopped the newly started pair. |
| Compiled `npm start` no-key smoke | 0 (deliberately stopped) | Root app returned 200, health returned `ok/configured: false`, and generation returned `AI_NOT_CONFIGURED`. This verifies compiled root resolution. |
| Checker launched from repository parent directory | 0 | Located the repository root without relying on the current working directory and safely reported AI disabled. |

Secret checks:

- No Google API-key-shaped value was found in the worktree scan.
- No Google API-key-shaped value was found in Git history.
- No `@google/genai` import/reference exists in frontend source or the frontend production bundle.
- No frontend-public Gemini environment variable exists.
- No `GEMINI_API_KEY` name or API-key-shaped value exists in the frontend production bundle.
- The development-only modal guidance intentionally names `GEMINI_API_KEY` but never receives, reads, or prints its value.
- `.env`, `.env.local`, `.env.*.local`, and `server/.env` are ignored; `.env.example` remains tracked.

## Real Gemini test status

PASS. A real Gemini request succeeded with the configured root `.env`, model `gemini-3.1-flash-lite`, the Interactions API, structured output, and runtime diagram validation. Safe summary: 9 nodes and 8 edges. The key, raw response, and full prompt were not printed. Automated tests remain mocked and do not consume provider quota.

## Live generation compatibility repair

The configured key and model were valid: model lookup, basic Interactions, and a simple structured-output request all succeeded. The full request failed for two provider-compatibility reasons:

1. The client forced `apiVersion: 'v1'`, while the current Interactions endpoint is selected correctly by the SDK default. The override was removed.
2. The Zod-generated JSON Schema included keywords rejected by this model/Interactions combination. The provider now receives a focused supported schema without `$schema`, `const`, regex/string-length constraints, or array-size keywords. Strict Zod runtime validation still enforces schema version, key formats, text bounds, 25-node/40-edge limits, reachability, branch semantics, and graph integrity before editor insertion.

Regression tests now lock the provider schema to the known-compatible keyword subset and verify that the Gemini client is initialized with the API key only, without a forced API-version override.
