# Wizzleflow Repository Audit

**Audit scope:** repository at `C:\Users\arunv\Documents\flowchartmaker`, inspected on 2026-07-18. Findings marked **code-confirmed** are derived from the checked-out source and validation commands. Items marked **manual test** require browser/device verification and were not inferred as working merely from UI code.

## 1. Executive Summary

Wizzleflow is a feature-rich prototype/editor with a custom HTML/SVG diagram surface, browser-local diagram persistence, optional direct-to-Supabase lead/feedback collection, and a polished desktop-oriented visual direction. The strongest areas are the breadth of editor interactions, a well-defined TypeScript diagram model, local-first CRUD, import/export, and a substantial custom connection-routing implementation.

Its maturity is constrained by an incomplete refactor: the application project fails strict TypeScript compilation; the CI workflow's type-check command does not actually compile the referenced application project; the only unit test is stale and does not type-check its component props; and the E2E test is inconsistent with the current local-storage access gate and editor title. The largest source file, `src/pages/Editor.tsx` (3,758 lines), owns most editor behaviours, state, rendering, persistence coordination, and UI composition.

The current UI is desktop-only by deliberate code path (`MobileBlocker` replaces the application below Tailwind `md`), not responsive editor software. The existing client-side AI feature is a deterministic template/keyword mock and its visible composer is disabled/labelled “Coming Soon”; it is not an AI provider integration. There is no application backend in this repository, so provider keys cannot be protected here.

| Area | Assessment |
|---|---|
| Current project maturity | Advanced prototype / pre-hardening |
| Main strengths | Custom editor breadth, typed core model, local-first CRUD, JSON/SVG/PNG/PDF export, import normalization |
| Main weaknesses | Broken app type checking, monolithic editor, stale tests/docs/branding, pseudo-authentication, no server boundary |
| UI readiness | Strong visual prototype; inconsistent, desktop-only and inaccessible for production |
| AI readiness | Reusable conversion seam exists; no secure backend, schema validation, provider integration, or robust layout engine |
| Deployment readiness | Static build shape exists, but provider/rewrite configuration and real CI type checking are absent |
| Overall risk level | **High** for public/product expansion; **Medium** for local prototype use |

## 2. Current Architecture

### Verified technology stack

| Concern | Verified implementation |
|---|---|
| Frontend | React `18.3.1`, React DOM `18.3.1`; Vite `8.0.16` with `@vitejs/plugin-react` `6.0.2` |
| Language | TypeScript; app config is strict, `noUnusedLocals`, `noUnusedParameters`, and `noEmit` in `tsconfig.app.json` |
| Routing | `react-router-dom` `7.17.0`; browser routes in `src/App.tsx` |
| Styling | Tailwind CSS `3.4.17`, PostCSS `8.5.15`, Autoprefixer `10.4.20`, plus extensive inline Tailwind utility classes and inline styles |
| Motion / scrolling | Framer Motion `12.40.0`; `lenis` `1.3.23` is imported by the landing page |
| Icons | `lucide-react` `0.344.0` |
| Diagram surface | Custom absolutely positioned HTML nodes plus SVG connections. **No React Flow/ReactFlow package is declared or imported**, contrary to `README.md`. |
| Connection rendering | `src/components/ConnectionLine.tsx` and `src/lib/connectionRouting.ts`; cubic, straight, and elbow paths with optional waypoints |
| State management | React hooks, component state, refs, and the local `useFlowChart` hook. No direct Redux, Zustand, Jotai, or other global state package is declared. |
| Forms / validation | Native controlled inputs and ad-hoc validation. No form-management or schema-validation library is declared. |
| Sanitization | DOMPurify `3.4.8` is used before rendering node HTML. |
| Persistence | `localStorage` via `src/services/flowchartService.ts`; editor preferences and clipboard fallback also use `localStorage`. |
| Database / external service | Supabase JS `2.107.0`; SQL schema for `waitlist`, `users`, and `feedbacks` in `database/supabase_schema.sql`. Flowcharts are not stored in Supabase. |
| Authentication | Not real authentication: `RequireAuth` checks whether `localStorage.user_email` exists. |
| Backend / API | None in this repository. No API routes, serverless functions, backend framework, request validation, rate limiter, cache, or server logger. |
| Export | Native Blob/download APIs, custom SVG serialization, canvas rasterization, and dynamically imported `jspdf` `4.2.1`. |
| Testing | Vitest `4.1.8`, Testing Library, jsdom, and Playwright `1.60.0`. |
| Build / CI | Vite, ESLint `9.39.4`, GitHub Actions in `.github/workflows/deploy.yml`. |
| Hosting | No Vercel, Netlify, Cloudflare, Docker, or other hosting config is present. The repository supports a static Vite build only. |

The declared `@studio-freight/lenis` and `@studio-freight/react-lenis` packages are not imported by source; the landing page imports `lenis/react`. `sharp` is a direct development dependency with no repository source/config reference. These are candidates for later dependency review, not removal during this audit.

## 3. Repository Map

| Path | Purpose and audit observations |
|---|---|
| `.github/workflows/deploy.yml` | CI workflow named “CI/CD Pipeline”; installs, lints, runs a misleading root `tsc --noEmit`, and builds. It does not deploy or run tests. |
| `database/` | Supabase SQL schema for public insert-only waitlist, pseudo-user, and feedback tables. No migrations framework or `usage_events` table is present. |
| `public/` | Favicons, Apple touch icon, OG image, `robots.txt`, and sitemap. Assets are small and their hashes are distinct; no duplicate asset was found. `index.html` references missing `public/site.webmanifest`. |
| `src/components/` | Reusable visual pieces, error/auth/mobile wrappers, custom node/edge renderers, one stale node test, and editor subcomponents. |
| `src/components/editor/` | Editor chrome: tool rail, top bar, sidebar, minimap, command menu, quick-add menu, selection bars, and small shared display components. |
| `src/hooks/useFlowChart.ts` | Diagram state and capped undo/redo history. It is local to an editor instance, not global state. |
| `src/lib/` | ID generation, errors, export serializer, connection geometry/router, and Supabase client creation. |
| `src/pages/` | Landing, local-email gate, dashboard, editor, legal pages, and 404 route. `Editor.tsx` is 128,899 bytes / 3,758 lines and has too many responsibilities. |
| `src/services/` | Local-storage flowchart CRUD, client-side template/mock AI service, and direct Supabase analytics call. |
| `src/types/flowChart.ts` | Central diagram and record types; it also contains the mock AI request/response types. |
| `tests/` | One Playwright smoke test. It is code-inconsistent with current access control and UI text. |
| Root configs | Vite, Tailwind, PostCSS, ESLint, TypeScript, Playwright, `package.json`, and lockfile. |
| `dist/` | Existing ignored generated build output is present in the worktree but is not tracked by Git. It was not regenerated. |
| `.env.local` | Present and ignored/untracked. Only variable names were inspected; values were not read or exposed. |

No tracked build output, environment file, log, archive, editor cache, or temporary screenshot was found. Git status was clean before this audit file was created. `README.md` is materially stale: it claims React Flow and “no user data ... transmitted to a server,” although the source imports neither React Flow nor a zero-network-only model (waitlist, users, feedback, and analytics use Supabase). `src/pages/Dashboard.tsx` and the landing footer still contain legacy **FlowForge** branding.

## 4. Existing Feature Matrix

| Feature | Status | Relevant files | Notes | Manual testing required |
|---|---|---|---|---|
| Landing page | Partially working | `src/pages/LandingPage.tsx` | Route and visual sections are implemented; waitlist relies on configured Supabase. Footer uses FlowForge branding. | Yes: animation, links, submit path |
| Local email gate | UI-only / insecure | `AuthPage.tsx`, `RequireAuth.tsx` | Any value in `localStorage.user_email` grants access; Supabase failure does not block entry. | Yes |
| Dashboard CRUD | Code-confirmed | `Dashboard.tsx`, `flowchartService.ts` | Creates, lists, duplicates, and deletes local records; dashboard deletion has a confirmation modal. | Yes: browser storage quota/error handling |
| New diagram initialization | Code-confirmed | `Dashboard.tsx`, `useFlowChart.ts` | Dashboard creates empty “Untitled Flowchart”; hook fallback is separate “New FlowChart”. | Yes |
| Add nodes | Code-confirmed | `Editor.tsx`, `Node.tsx` | Tool rail, command menu, shortcuts, double-click canvas, and quick-add create nodes. | Yes |
| Edit node text / rich text | Partially working | `Node.tsx` | `contentEditable` supports toolbar commands and sanitizes on render; rich HTML is persisted as text and exports as literal markup. | Yes |
| Delete nodes | Code-confirmed | `Editor.tsx`, `Node.tsx`, `EditorSidebar.tsx` | Connected edges are removed. Board-level clear has no confirmation. | Yes |
| Connect nodes | Code-confirmed | `Editor.tsx`, `Node.tsx`, `connectionRouting.ts` | Mouse/Alt-drag/handles work in code; duplicate pairs and self links are rejected. | Yes |
| Edit/delete edges | Partially working | `ConnectionLine.tsx`, `EditorSidebar.tsx` | Type, markers, labels, color, routes, and deletion are implemented. Animated-flow toggle is broken by history equality logic. | Yes |
| Drag and resize | Code-confirmed | `Editor.tsx`, `Node.tsx` | Grid snapping, multi-drag, locking, and alignment guides exist. | Yes: drag cancellation / touch |
| Pan and zoom | Code-confirmed | `Editor.tsx`, `EditorCanvasChrome.tsx`, `EditorMinimap.tsx` | Scroll, middle/space pan, Ctrl/Cmd-wheel zoom, fit, minimap. | Yes |
| Undo / redo | Partially working | `useFlowChart.ts`, `EditorTopBar.tsx` | 50 snapshots and buttons exist; no Ctrl/Cmd-Z/Y shortcut; resize can add duplicate snapshots; animated edge edits are ignored. | Yes |
| Copy / paste / duplicate | Code-confirmed | `Editor.tsx` | In-memory, OS clipboard, and local-storage fallback; copied structure gets new IDs. | Yes: browser permissions and malformed clipboard |
| Keyboard shortcuts | Partially working | `Editor.tsx`, `EditorSidebar.tsx` | Many are implemented, but two global keydown listeners both move selected nodes with arrows; documentation omits this conflict and undo/redo shortcuts. | Yes |
| Automatic layout | Not implemented | `Editor.tsx` | “Tidy selection” creates a simple grid; suggested positions and elbow routing are not graph auto-layout. | N/A |
| Templates | Mocked / unused | `aiService.ts` | Internal keyword templates drive the mock generator; no separate user-selectable template gallery. | Yes |
| Save/load | Code-confirmed | `flowchartService.ts`, `Editor.tsx` | Local-storage records load and autosave after 2 seconds. No sync, conflict resolution, or quota feedback. | Yes |
| Import JSON | Partially working | `Editor.tsx` | Normalizes basic shape and references; lacks file-size, node-count, dimensional, and strict style/color limits. | Yes |
| Export JSON/SVG/PNG/PDF | Code-confirmed | `Editor.tsx`, `flowchartExport.ts` | Browser download code exists; PDF is rasterized PNG. | Yes: output fidelity and browser download behavior |
| Responsive/mobile editor | Broken by product policy | `App.tsx`, `MobileBlocker.tsx` | Entire application is replaced by “Desktop Required” below `md`; no touch handling is implemented. | Yes for md–xl layout |
| Settings | Partially working | `Editor.tsx` | Theme, panel visibility, hints, and default node styles persist locally; no standalone settings page. | Yes |
| Sharing/collaboration | Not implemented | repository-wide | No shared diagram backend, users/sessions, permissions, or real-time transport. | N/A |
| Loading/error/empty states | Partially working | `App.tsx`, `Dashboard.tsx`, `Editor.tsx` | Basic loading, errors, empty dashboard, and error boundary exist; several errors use console/alert and are not announced accessibly. | Yes |
| Feedback/waitlist/analytics | Unverified / partially broken | `LandingPage.tsx`, `FeedbackModal.tsx`, `analyticsService.ts` | Direct Supabase inserts; `usage_events` is called but absent from supplied SQL schema. | Yes: deployed database configuration |
| AI generation | Mocked and visibly disabled | `aiService.ts`, `Editor.tsx`, `EditorSidebar.tsx` | Deterministic keyword/template generator with 1.5s timeout; no provider/API. Button and textarea are disabled/Coming Soon. | Yes: Ctrl/Cmd+Enter edge case |

## 5. Diagram Architecture

The diagram engine is custom. `Editor.tsx` owns a large scrollable 6,400×4,200 minimum workspace, scales it with CSS transforms, renders edges inside one SVG, and renders nodes as absolutely positioned HTML `div`s. `Node.tsx` chooses visual shapes with CSS border radius/clip-path. `ConnectionLine.tsx` renders SVG paths and manipulation handles. `src/lib/connectionRouting.ts` computes straight, cubic Bezier, and obstacle-aware elbow geometry.

Simplified persisted node shape:

```ts
{
  id: "node-<uuid>",
  type: "start" | "process" | "decision" | "end" | "connector" |
        "input" | "manualInput" | "manualOperation" | "triangle" |
        "hexagon" | "database" | "annotation",
  position: { x: 480, y: 336 },
  text: "Process Step",
  width: 140,
  height: 80,
  style?: { backgroundColor?, borderColor?, textColor?, borderStyle?, opacity?, fontSize?, fontWeight?, textAlign?, rotation? },
  groupId?: "group-<uuid>", zIndex?: 3, locked?: false
}
```

Simplified persisted edge shape:

```ts
{
  id: "connection-<uuid>", from: "node-a", to: "node-b",
  fromSide: "bottom", toSide: "top", type: "curved" | "straight" | "elbow",
  startMarker: "none", endMarker: "arrow", label?: "Yes",
  color?: "#64748b", labelPosition?: 0.5, waypoints?: [{ x: 520, y: 480 }], animated?: false
}
```

`createId` uses `crypto.randomUUID()` when available and an `Math.random()` fallback. New nodes use type-specific defaults; new connections reject self-links and either direction of a duplicate pair. Loading and importing applies workspace padding. Import creates/normalizes missing IDs and checks edge endpoints. AI conversion creates new node IDs and maps AI edge indices to them. Export uses the same routing library, builds SVG text manually, and turns SVG into PNG/PDF in the browser.

History is held in `useRef`, capped at 50 cloned snapshots. Most mutations call `transformFlowChart`; drag/resize suppresses per-move history and captures on completion. There is no graph validation beyond basic import endpoint checks and duplicate prevention at one creation path. The local-storage record validator verifies only top-level record fields; it does not validate nested nodes/connections on normal load.

AI integration risks in this model:

- `AIFlowChartResponse` uses `Omit<FlowChartNode, 'id'>[]` plus index-based edges, but no runtime validation or limits; a real provider response must never enter `materializeAIFlowChart` unchecked.
- Multiple default text/size functions exist in `useFlowChart.ts` and `Editor.tsx`, already with divergent start/end defaults (100 vs. 132 width). A provider converter could create inconsistent diagrams.
- There is no semantic `description`, `summary`, `metadata`, schema version, or stable semantic node key in the persisted model.
- There is no graph layout engine; generated positions are either mock hard-coded coordinates or a simple padding shift.
- Replacing the whole chart does produce an undoable snapshot, but granular AI edits, user review, conflict handling, and validation are absent.

## 6. UI/UX Findings

### Critical

- The product blocks every screen below 768px in `src/App.tsx` / `src/components/MobileBlocker.tsx`; the editor is unusable on mobile rather than responsively adapted.
- AI messaging is contradictory: the landing page advertises AI generation, the editor tool rail calls it “Generate with AI,” `EditorSidebar.tsx` labels it Coming Soon and disables controls, while `aiService.ts` contains a local mock. This damages user trust and makes current capability unclear.

### High

- `Editor.tsx` concentrates canvas state, persistence, keyboard policy, rendering, export/import, selection, connection creation, layout-like actions, AI conversion, and view composition. This makes visual redesign and safe iteration expensive.
- Destructive node/edge/board actions are immediate. Dashboard deletion has `ConfirmModal`; `EditorSidebar.tsx` Clear board and editor node/edge deletion do not.
- “Automatic layout” is claimed in landing copy but is not implemented; tidy is a fixed grid and edge routing is only route geometry.
- Legacy FlowForge text in `Dashboard.tsx` and landing footer causes brand inconsistency.
- The editor uses a dense top bar, floating context bars, left rail, right inspector, minimap, hints, and empty-state card in the same canvas area. Functional grouping exists, but visual priority/escape routes require manual desktop testing.

### Medium

- UI typography configuration conflicts: `index.html` loads Space Grotesk/IBM Plex Mono, `tailwind.config.js` names them, while `src/index.css` imports and applies Plus Jakarta Sans/Fraunces. This adds requests and weakens system consistency.
- Many controls use `title` only, lack labels or visible shortcut hints, and icon-only close/delete controls are visually ambiguous.
- Direct error feedback is inconsistent: inline cards, `alert`, console logging, and disabled controls are mixed. Loading has no accessible announcement.
- The editor sidebar can be collapsed; visible reopen buttons are `xl:inline-flex`, so md–xl recovery and stacked sidebar behavior need manual testing.
- Empty state labels the surface “Infinite board,” but it is a finite fixed minimum workspace that only grows right/down from content bounds.

### Low

- Colour and shadow values are heavily hard-coded across components, increasing redesign effort.
- Readme/metadata language and product UI do not agree on features/technology.

## 7. Code-Quality Findings

### Critical

- **Application type check fails.** `npx tsc -p tsconfig.app.json --noEmit` exits 1. Examples: `EditorSidebarProps` omits `onClose`, `starterPrompts`, and `onStarterPromptClick` used by `src/pages/Editor.tsx`; `ConnectorQuickAddState` declares `{ nodeId, handleId }` but code uses `{ fromNodeId, fromSide, position, title }`; `Node.test.tsx` supplies obsolete props and an incomplete node; Framer Motion variants in `LandingPage.tsx` fail strict typing.
- **CI masks that failure.** `.github/workflows/deploy.yml` runs `npx tsc --noEmit`, which exits 0 because root `tsconfig.json` has no files and only project references; it does not use build mode or `-p tsconfig.app.json`.

### High

- `src/pages/Editor.tsx` is 3,758 lines / 128,899 bytes. It has unclear responsibility boundaries and duplicates node default data with `src/hooks/useFlowChart.ts`.
- `useFlowChart.ts` equality comparison omits `Connection.animated`. `EditorSidebar.tsx` exposes Animated Flow and calls `updateConnection`, but `transformFlowChart` treats the result as unchanged, preventing update/render/history/persistence.
- `Editor.tsx` registers two global `keydown` listeners. Both process arrow keys: the first nudges with grid logic and lock protections, then the second applies 1/10px movement directly and ignores `locked`. Selection arrow movement is thus doubled and can move locked nodes.
- `src/components/Node.test.tsx` is obsolete relative to `NodeProps`, and `tests/editor.spec.ts` starts at protected `/dashboard` without creating `user_email`; it also expects “New Flowchart” whereas current dashboard creates “Untitled Flowchart.”
- `analyticsService.ts` writes `usage_events`; that table is absent from `database/supabase_schema.sql`, and Git history includes a commit named “remove usage_events.” The supplied local schema and source are inconsistent.

### Medium

- `src/services/aiService.ts` is legacy/mock code that uses hard-coded templates, keyword rules, and a timer while the visible composer is disabled.
- `src/components/ConfirmModal.tsx` exists, but editor destructive calls bypass it. `FeedbackModal.tsx` uses `alert` for errors.
- `src/components/Node.tsx` relies on deprecated `document.execCommand` for rich-text editing and stores HTML in the node `text` field. SVG/PDF export cannot preserve that formatting.
- Direct document mouse listeners in `Node.tsx`, `ConnectionLine.tsx`, and `Editor.tsx` remove themselves on mouseup but have no component-unmount cleanup if an interaction is interrupted by navigation/unmount.
- Console error/warn statements remain in production paths (`Editor.tsx`, `FeedbackModal.tsx`, `AuthPage.tsx`, `analyticsService.ts`, `ErrorBoundary.tsx`).
- No error boundary isolates the editor itself; the root boundary replaces the entire application.

### Low

- The direct `sharp` development dependency and direct `@studio-freight/*` Lenis packages have no source/config import.
- Naming varies between FlowChart/flowchart, Wizzleflow/FlowForge, board/flowchart, and custom “AI” despite mock implementation.

No `TODO`, `FIXME`, `debugger`, `@ts-ignore`, or `as any` was found in application source. ESLint passes because it does not type-check these stale interfaces.

## 8. Security Findings

| Severity | Finding | Evidence and remediation |
|---|---|---|
| High | Client-side access gate is bypassable | `src/components/RequireAuth.tsx` trusts `localStorage.user_email`; `AuthPage.tsx` writes it irrespective of Supabase insert failure. Do not treat this as authentication; use server-verified sessions and authorization before protected data/features exist. |
| High | No secure place for AI provider keys | This is a static browser app with no server route/function. A `VITE_*` provider secret would be public. Add a server/serverless boundary before any OpenAI/Gemini integration. |
| High | Public anonymous inserts have no abuse controls | `database/supabase_schema.sql` uses `WITH CHECK (true)` for waitlist/users/feedback; no request validation, captcha, rate limit, or server-side identity exists. Add a protected endpoint plus validation/rate limiting. |
| Medium | Export XML values are not escaped | `src/lib/flowchartExport.ts` escapes text but interpolates imported node style and connection colour strings directly into SVG attributes. `Editor.tsx` import accepts arbitrary nonempty colour strings. Validate a strict colour grammar and XML-escape all serialized attributes before downloading/rendering SVG. |
| Medium | Imported/local nested diagram data has weak limits | `parseImportedFlowChart` validates basic fields but has no maximum file/node/edge/text/dimension/waypoint limits. `flowchartService` validates only record top-level fields on local load. Add bounded schema validation before rendering/persisting. |
| Medium | Verified dependency advisory | `npm audit --package-lock-only --omit=dev --json` exited 1 with one moderate direct `dompurify` advisory affecting installed `3.4.8` (fix available). Plan an isolated dependency update and regression test. |
| Low | Supabase configuration is browser-public by design | `.env.local` is ignored and was not read; only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` names were observed. Public anon keys are expected in a browser client but must be backed by audited RLS and minimal table privileges. |
| Low | Security headers/CORS are unknown | No hosting config or server response configuration is present. CSP, HSTS, clickjacking, CORS, and static-host headers require deployment-level verification. |

DOMPurify is used in `Node.tsx`, which is a positive control for node HTML. It does not protect dynamically generated SVG attribute interpolation. No committed secret value or hard-coded API key was found; no secret value is reproduced here.

## 9. Performance Findings

The editor has no virtualization, memoized node/edge components, viewport culling, worker, or debounced drag rendering. Each diagram state update re-renders `Editor`, maps/sorts all nodes, maps all connections, repeatedly finds endpoints, filters obstacle nodes, and recalculates path geometry. Single-node drag also scans all other nodes for alignment and updates the full node array on every mouse move.

| Diagram size | Evidence-based likely behavior |
|---|---|
| 25 nodes | Likely acceptable on a modern desktop, subject to manual interaction testing. The implementation still redraws the full graph. |
| 100 nodes | Moderate risk during drag/routing: repeated node scans, edge endpoint searches, obstacle filtering, SVG paths, and non-memoized node rendering grow with diagram size. |
| 500 nodes | High risk of visibly degraded dragging, selection, zoom, and route updates. Rendering and routing do not cull off-screen content; edge work is at least proportional to nodes × edges per render and elbow candidate scoring adds obstacle scans. |

Specific hot paths: `Editor.tsx` does `find`, `filter`, `sort`, and full maps in render; `getNodeAtPoint` sorts all nodes during connector targeting; `connectionRouting.ts` evaluates obstacles/candidates for elbow routing; `ConnectionLine.tsx` updates React state for waypoint drags; every autosave JSON-stringifies the complete local collection. `jspdf` is lazily imported (positive), and Dashboard/Editor are React-lazy loaded (positive). No claim about actual FPS or bundle size is made because no production build/profile was run.

## 10. Accessibility Findings

### Critical

- The editor canvas, nodes, connection paths, handles, resize controls, and minimap are pointer-driven `div`/SVG interactions without semantic roles, tab stops, keyboard selection, or screen-reader representations (`Editor.tsx`, `Node.tsx`, `ConnectionLine.tsx`).
- Mobile users are blocked instead of served an accessible alternative (`MobileBlocker.tsx`).

### High

- `ConfirmModal.tsx`, `FeedbackModal.tsx`, `CommandMenu.tsx`, and `ConnectorQuickAdd.tsx` lack dialog semantics, focus trapping/restoration, `aria-modal`, and comprehensive Escape behavior. Background content remains available to assistive technology.
- Auth and landing inputs rely on placeholders rather than associated labels; feedback's visible label is not associated with the textarea. Errors/success/loading are not `aria-live` announcements.
- Icon-only buttons commonly use `title` but not accessible names (`aria-label`); SVG deletion/waypoint controls cannot receive focus.

### Medium

- Widespread `outline-none`, mouse-hover affordances, custom cursor/cursor-none, and no visible explicit focus design make keyboard focus verification necessary.
- No `prefers-reduced-motion` handling exists despite pervasive Framer Motion and animated SVG edge dash effects.
- Contrast for dynamic dark/orange/translucent styles needs automated contrast and real-browser testing; this was not visually measured in this code audit.

## 11. Responsive-Design Findings

**Code-confirmed:** `App.tsx` hides the full routed application below `md`, while `MobileBlocker.tsx` covers the viewport. The editor uses mouse events, not Pointer/Touch events. The tool rail exists only at `xl`; the editor switches to column layout below `xl`; the inspector has a fixed `xl:w-[360px]` but `w-full` otherwise; and floating quick-add clamps using `window.innerWidth`, not the canvas viewport.

**Manual test required:** 768–1279px editor stacking/overflow, top-bar action wrapping, accessibility of collapsed panels at intermediate widths, browser zoom, landscape tablets, modal/command menu overflow, minimap position, high-DPI export, touchpad versus mouse behaviour, and desktop screen-reader navigation. The repository provides no code evidence for acceptable touch, tablet, or mobile editing usability.

## 12. AI-Readiness Assessment

Reusable seams exist: `src/types/flowChart.ts` has AI types, `src/services/aiService.ts` has a replace-chart response shape, and `materializeAIFlowChart` in `Editor.tsx` converts index-based mock edges into current IDs then calls `replaceFlowChartContent`. `EditorSidebar` is the natural existing location for a future composer, with a tool-rail focus action already present.

However, the current AI module is mocked, hidden/disabled in the visible UI, and runs entirely in the browser. It supports only whole-chart replacement from local templates. It cannot securely call a provider, authenticate users, rate limit, record usage safely, validate provider data, support edit patches, or distinguish model output from user content. Existing `crypto.randomUUID` IDs are suitable for conversion, provided the server never trusts provider-supplied IDs and the client regenerates or namespaces them.

For text-to-flowchart, AI editing, workflow analysis, suggestions, and explanations, retain the current renderer types as a target adapter but introduce a versioned canonical schema, runtime validation, server-side provider calls, deliberate patch semantics, bounded payloads, and a layout pass. AI changes should appear as one reviewable history command (or explicit accepted patch batch) so one Undo reverses one accepted AI operation. Provider errors should map to non-sensitive inline status with retry guidance; raw provider failures should not be exposed to users.

## 13. Recommended Future AI Architecture

Planning only:

```text
Editor composer / AI side panel
  -> authenticated HTTPS server or serverless endpoint
  -> input validation, abuse/rate limiting, usage accounting, cache lookup
  -> OpenAI or Gemini provider (secret retained server-side)
  -> strict structured-response schema validation
  -> canonical diagram -> Wizzleflow node/edge conversion (fresh IDs)
  -> automatic layout / collision pass
  -> preview + user accept
  -> one undoable editable-canvas transaction
```

Recommended canonical future schema (illustrative only; do not add to current code yet):

```json
{
  "schemaVersion": "1.0",
  "title": "Customer onboarding",
  "summary": "Signup-to-activation workflow.",
  "metadata": { "source": "ai", "providerModel": "masked", "createdAt": "ISO-8601" },
  "nodes": [
    { "key": "start", "kind": "start", "label": "Receive signup", "description": "Entry event", "metadata": {} },
    { "key": "verify", "kind": "decision", "label": "Email verified?", "description": "Validation branch" },
    { "key": "finish", "kind": "end", "label": "Activated" }
  ],
  "edges": [
    { "key": "e1", "from": "start", "to": "verify", "label": "" },
    { "key": "e2", "from": "verify", "to": "finish", "label": "Yes" }
  ],
  "startNodeKeys": ["start"]
}
```

Allow only `start`, `process`, `decision`, `inputOutput`, and `end` at the provider boundary; map `inputOutput` to current `input` only in the client adapter. Validate uniqueness, bounded counts/text, allowed kinds, valid edge references, start-node rules, no unsafe style/HTML, and optional metadata size before conversion. Assign client IDs after validation, run deterministic layout, then let users edit resulting Wizzleflow nodes/edges.

Safest future locations: provider keys, prompts, response parsing, schema validation, rate limits, cache, usage tracking, audit logging, and error normalization belong in a new server/serverless layer—not Vite source or `VITE_*` variables.

## 14. Recommended Future UI Improvement Areas

- Establish a responsive interaction strategy instead of a mobile blocker.
- Define information hierarchy between top bar, rail, inspector, canvas overlays, and floating context tools.
- Consolidate typography, tokens, colour/spacing scales, shadows, states, and icon-button treatment.
- Make AI availability truthful, scoped, and review-oriented.
- Add consistent notifications, loading, error, empty, destructive-action, and offline/storage-quota states.
- Provide a discoverable accessible keyboard command model and complete tooltip system.
- Separate high-frequency canvas controls from document-level settings/export controls.
- Resolve all Wizzleflow/FlowForge and README/metadata terminology before public positioning.

## 15. Testing Gaps

There is one stale rendering unit test (`src/components/Node.test.tsx`) and one incompatible Playwright smoke test (`tests/editor.spec.ts`). No evidence of integration, accessibility, visual regression, export fidelity, persistence recovery, or diagram-routing test coverage was found.

Missing coverage includes node/edge creation and deletion; text/rich-text editing; connection type/markers/animated state; drag/resize/multi-select; undo/redo; local-storage CRUD and quota/corruption; import normalization, malicious/oversized JSON, and SVG escaping; PNG/SVG/PDF/JSON export; authentication gate behavior; all keyboard shortcuts; responsive/mouse/touch paths; Supabase failure handling; data schema/RLS assumptions; AI schema validation/conversion/review/rollback; provider failure/rate-limit behaviour; and 25/100/500-node interaction performance.

## 16. Build and Deployment Findings

| Command | Exit code | Result |
|---|---:|---|
| `npx tsc --noEmit` | 0 | Misleading pass: root `tsconfig.json` contains no files and references projects without build mode. This is the command used by CI. |
| `npx tsc -p tsconfig.app.json --noEmit` | 1 | Fails with stale editor sidebar/quick-add interfaces, stale Node test props, missing matcher types, and LandingPage Framer Motion typing. |
| `npm run lint` | 0 | ESLint completed successfully. It is not type-aware for these failures. |
| `npm test -- --run` | 0 | Vitest executed one passing test in one file. It transpiles without strict app type checking. |
| `npm audit --package-lock-only --omit=dev --json` | 1 | One moderate direct DOMPurify advisory, fix available. |
| `npm ls --depth=0` | 1 | Direct dependencies resolve, but installed `@emnapi/runtime@1.10.0` is marked extraneous. |
| `npm run build` | Not run | Deliberately not run: it writes/replaces ignored generated `dist/` output, outside the audit-only creation constraint. |
| `npm run test:e2e` | Not run | Deliberately not run: Playwright writes report/result artifacts; its source is already code-inconsistent with the protected dashboard. |

Exact declared scripts: `dev: vite`; `build: vite build`; `lint: eslint .`; `preview: vite preview`; `test: vitest`; `test:e2e: playwright test`.

The workflow uses Node 20, `npm ci`, lint, the ineffective root type check, and Vite build. Despite its name, it has no deployment step. No `typecheck` script, CI test step, SPA fallback rewrite, provider environment documentation, or hosting config exists. BrowserRouter needs host-side rewrite/fallback configuration for deep links such as `/editor/:id`; whether the live host supplies it is outside repository evidence.

## 17. Dependency Findings

Main runtime dependencies are React/React DOM, React Router, Tailwind output support, Framer Motion, Lenis, Lucide, Supabase, DOMPurify, jsPDF, and two Studio Freight Lenis packages. Development dependencies include Vite, TypeScript, ESLint, Playwright, Vitest, Testing Library, jsdom, Tailwind/PostCSS, and `sharp`.

- `lenis` is used; `@studio-freight/lenis` and `@studio-freight/react-lenis` have no source imports and overlap it.
- `sharp` has no source/config reference and is a relatively heavy native development dependency.
- `@types/dompurify` has no direct source import; verify package-provided types before later cleanup.
- `vite.config.ts` has a manual-chunk condition for `html2canvas`, but no `html2canvas` dependency/import exists.
- `package.json` uses permissive `^` version ranges. The checked installed direct versions are recorded in Section 2; the lockfile is present.
- `npm ls` reports one extraneous installed package. This is installation hygiene, not a source-code defect.
- A verified audit finds one moderate DOMPurify advisory; no other vulnerability claim is made.

## 18. Prioritized Issue Register

| ID | Severity | Category | Problem | Evidence | Affected files | Recommended future action |
|---|---|---|---|---|---|---|
| WF-01 | Critical | Build quality | Strict application TypeScript fails | Direct app type check exit 1 | `Editor.tsx`, `EditorSidebar.tsx`, `Node.test.tsx`, `LandingPage.tsx` | Complete refactor interfaces/tests, then make type check mandatory |
| WF-02 | Critical | CI | CI type check does not compile app | Root `tsc --noEmit` exits 0 while app project fails | `.github/workflows/deploy.yml`, `tsconfig.json` | Use project/build-aware type check and a script |
| WF-03 | High | Security | Local-storage value is treated as authentication | `RequireAuth.tsx`, `AuthPage.tsx` | `RequireAuth.tsx`, `AuthPage.tsx` | Replace before user-owned/shared/server data |
| WF-04 | High | AI/security | No server exists for provider secrets or abuse control | Static Vite repo only | repository-wide | Add serverless/backend foundation before AI |
| WF-05 | High | State | Animated edge update is silently discarded | equality omits `animated` | `useFlowChart.ts`, `EditorSidebar.tsx` | Correct state comparison and add regression tests |
| WF-06 | High | Input | Two key handlers double-move selections and bypass locks | Two effects handle arrows | `Editor.tsx` | Consolidate command handling and test lock behavior |
| WF-07 | High | Architecture | Editor is monolithic and duplicated defaults diverge | 3,758-line component; two default sets | `Editor.tsx`, `useFlowChart.ts` | Separate controller/state/domain/UI modules |
| WF-08 | High | UI/product | Mobile editor is blocked | `<MobileBlocker>` below md | `App.tsx`, `MobileBlocker.tsx` | Define responsive/touch scope for redesign |
| WF-09 | High | Security | Public direct inserts lack abuse control | Supabase `WITH CHECK (true)` | SQL schema, client pages | Broker through validated/rate-limited endpoint |
| WF-10 | Medium | Security | Imported style/colour can enter unescaped generated SVG | raw XML interpolation | `Editor.tsx`, `flowchartExport.ts` | Strictly validate and XML-escape attributes |
| WF-11 | Medium | Dependencies | Verified DOMPurify advisory | `npm audit` exit 1 | `package.json`, lockfile | Update under controlled regression testing |
| WF-12 | Medium | Reliability | Analytics table call absent from provided schema | `usage_events` call, no SQL table | `analyticsService.ts`, SQL schema | Reconcile migration/source and validate failures |
| WF-13 | Medium | Tests | Unit/E2E tests are stale or incompatible | Props/title/auth mismatches | `Node.test.tsx`, `editor.spec.ts` | Rebuild tests around current behaviors |
| WF-14 | Medium | Accessibility | Canvas and dialogs are not keyboard/screen-reader operable | pointer-only div/SVG, no dialog semantics | Editor/components | Establish accessible canvas and modal patterns |
| WF-15 | Medium | Documentation | Readme claims React Flow and zero transmission | source contradicts both | `README.md`, source | Update documentation after stabilization |
| WF-16 | Medium | UX | Board clear/delete lacks confirmation | direct callbacks | `Editor.tsx`, `EditorSidebar.tsx` | Use consistent destructive-action confirmation |
| WF-17 | Medium | Performance | Full graph rerenders/reroutes per drag | maps/filters/sorts in render | `Editor.tsx`, routing, node/edge | Profile then memoize/cull/workerize |
| WF-18 | Low | Branding | FlowForge remains visible | footer/warning copy | `LandingPage.tsx`, `Dashboard.tsx` | Normalize product copy |
| WF-19 | Low | Deploy | Missing manifest and host config | missing `site.webmanifest`; no rewrites | `index.html`, root | Add artifacts/config during deployment phase |
| WF-20 | Low | Hygiene | Unused/overlapping packages | no source refs | `package.json` | Verify then remove in cleanup phase |

## 19. Proposed Future Implementation Phases

### Phase 1 — Project cleanup and architecture stabilization

**Objective:** restore trustworthy type checking/tests; reconcile stale types, copy, docs, schema, and dependency hygiene; split domain/state from `Editor` without feature expansion. **Expected modules:** editor controller/domain modules, corrected type config/CI/tests, database migrations/docs. **Dependencies:** none beyond product decisions on local-only versus account-backed diagrams. **Risks:** regression while extracting editor logic. **Acceptance criteria:** strict app type check, lint, unit/integration suite, and E2E suite pass; one source of defaults/types; CI checks the application; README matches implementation.

### Phase 2 — UI and UX redesign

**Objective:** introduce a coherent, accessible, responsive design system and redesigned information hierarchy. **Expected modules:** tokens/components, modal/toast system, responsive editor shell, accessible command model. **Dependencies:** Phase 1 state boundaries. **Risks:** canvas interaction regression and scope growth. **Acceptance criteria:** approved desktop/tablet/mobile scope, keyboard paths, modal semantics, contrast/focus verification, and visual regression coverage.

### Phase 3 — Secure AI backend foundation

**Objective:** add an authenticated server/serverless boundary with validated request/response contracts, rate limiting, usage tracking, cache, and error normalization. **Expected modules:** API routes/functions, environment separation, schema validator, telemetry/audit controls. **Dependencies:** authentication strategy and deployment platform choice. **Risks:** secret exposure, cost abuse, schema drift. **Acceptance criteria:** no provider secret in client bundle; bounded requests; provider-independent contract; structured logs and error handling.

### Phase 4 — Text-to-flowchart generation

**Objective:** use the canonical schema to generate validated diagrams, layout them, preview them, and accept as one undoable operation. **Expected modules:** AI composer, canonical converter, layout engine, preview/review UI. **Dependencies:** Phases 1–3. **Risks:** unsafe/invalid graph output, excessive diagrams, user trust. **Acceptance criteria:** deterministic validation/layout fallback, conversion tests, rejected invalid output, one-step undo, provider failure UX.

### Phase 5 — AI diagram editing

**Objective:** add explicit, reviewable patch operations for selected nodes/edges or whole diagram intent. **Expected modules:** diagram serializer, patch schema, diff/review UI, history transaction adapter. **Dependencies:** canonical schema and robust history. **Risks:** unintended destructive changes and ID/reference corruption. **Acceptance criteria:** patch validation, preview/accept/reject, granular undo, no dangling edges/duplicate IDs.

### Phase 6 — Workflow analysis

**Objective:** provide explanations, issue detection, suggestions, and optional annotations without silently mutating diagrams. **Expected modules:** analysis endpoint, findings schema, non-destructive inspector UI. **Dependencies:** stable semantic graph/model. **Risks:** inaccurate advice and unclear authority. **Acceptance criteria:** cited/structured findings, clear uncertainty, no automatic destructive mutation, feedback telemetry with consent.

### Phase 7 — Testing, optimization, and deployment

**Objective:** harden quality, performance, accessibility, monitoring, and release infrastructure. **Expected modules:** test matrices, performance profiling, bundle analysis, host rewrites/headers, observability. **Dependencies:** prior phases. **Risks:** performance regressions at scale and static-host routing failures. **Acceptance criteria:** tested 25/100/500-node scenarios, accessibility audit, production CI/CD gate, secure headers, SPA deep-link behavior, rollback plan.

## 20. Final Recommendation

| Readiness area | Score | Recommendation |
|---|---:|---|
| UI redesign | **5/10** | Start only after Phase 1 establishes reliable types/state boundaries; the existing component inventory is useful but current editor coupling and accessibility gaps will otherwise make redesign fragile. |
| AI integration | **2/10** | Do not integrate a provider yet. The mock adapter is a useful reference, but a secure server, schema validation, layout, authentication/rate limiting, and transaction semantics are prerequisites. |
| Public deployment | **4/10** | Suitable only as a clearly labelled prototype after resolving CI/type-test failures, pseudo-auth expectations, public insert abuse controls, missing deployment config, and verified dependency advisory. |
| OpenAI Build Week submission | **4/10** | The interaction prototype is promising, but submission quality would be materially limited by disabled/mock AI, failing strict type checks, stale tests/docs, and absent secure provider architecture. |

Proceed with **Phase 1: Project cleanup and architecture stabilization** before any visual redesign or AI feature work.
