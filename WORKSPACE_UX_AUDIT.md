# Wizzleflow Workspace UX Audit

Date: 2026-07-18

This audit covers the code-confirmed journey from landing page through local persistence and export. “Manual verification” means the interaction still requires browser inspection; UI code alone is not treated as proof of usability.

## Journey summary

Current journey before this task:

```text
Landing page -> Try Tool -> fake name/email form -> localStorage access flag
-> Dashboard -> New Board -> Editor -> two-second local autosave -> export
```

The editor is capable, but access is needlessly blocked by a non-authentication email form. The dashboard lacks templates, search, rename, card export, and a calm empty-state hierarchy. The editor has strong diagram tools but weak document hierarchy: its top bar auto-collapses after selection, autosave status reflects manual save more clearly than background save, AI controls occupy prime space despite being unavailable, and frequent actions are duplicated across the rail, inspector, and top bar.

## Entry experience

| Severity | Problem | User impact | Relevant files | Recommended correction | Fixed in this task |
| --- | --- | --- | --- | --- | --- |
| Critical | “Try Tool” routes to `/auth`, which requests name and email but only sets localStorage flags. | Users must surrender personal information for a local tool; the flow looks like authentication but provides no security. | `src/pages/LandingPage.tsx`, `src/pages/AuthPage.tsx`, `src/components/RequireAuth.tsx`, `src/App.tsx` | Route primary CTAs directly to `/dashboard`; remove fake auth and gate. | Yes |
| Critical | Landing waitlist submits personal information directly to Supabase. | Adds a network dependency and email capture that contradicts direct local access. | `src/pages/LandingPage.tsx`, `src/lib/supabase.ts` | Remove the waitlist and replace it with a local-product CTA. | Yes |
| High | The entire application is hidden below `md`, including marketing and legal pages. | Mobile visitors cannot read product information or understand that no account is required. | `src/App.tsx`, `src/components/MobileBlocker.tsx` | Keep landing/dashboard/legal pages available; apply a helpful small-screen guard only to the editor. | Yes |
| Medium | Two hero CTAs use different labels and both lead to the email gate. | Entry intent is inconsistent and adds uncertainty. | `src/pages/LandingPage.tsx` | Use one primary “Try Tool” action and an optional features anchor. | Yes |

## Dashboard

| Severity | Problem | User impact | Relevant files | Recommended correction | Fixed in this task |
| --- | --- | --- | --- | --- | --- |
| High | Header greets a `user_name` from the fake access flow. | Reinforces a non-existent account model. | `src/pages/Dashboard.tsx` | Remove account language; use brand, Home, and New Diagram actions. | Yes |
| High | Empty state offers only a blank board and does not explain local persistence. | First-time users get no examples, backup guidance, or clear mental model. | `src/pages/Dashboard.tsx` | Add local deterministic templates, a primary create action, and a local-storage notice. | Yes |
| Medium | Cards lack rename, export, and reliable always-visible actions. | Routine board management requires opening the editor or discovering hover-only controls. | `src/pages/Dashboard.tsx`, `src/services/flowchartService.ts` | Add inline rename, local JSON export, duplicate, delete confirmation, and stable accessible actions. | Yes |
| Medium | No search exists. | Larger local collections become hard to scan. | `src/pages/Dashboard.tsx` | Add local name filtering. | Yes |
| Medium | Storage warning is visually dominant and uses account/device wording. | Creates anxiety and suggests a login model. | `src/pages/Dashboard.tsx` | Replace with one subtle persistent backup notice. | Yes |
| Low | “Boards”, “flowcharts”, and “diagrams” are mixed. | Product terminology feels unfinished. | Dashboard/editor copy | Standardize user-facing copy around “diagram”. | Yes |

## Editor workspace

| Severity | Problem | User impact | Relevant files | Recommended correction | Fixed in this task |
| --- | --- | --- | --- | --- | --- |
| High | The top bar automatically collapses after selecting a node. | Document name, save state, undo/redo, and export disappear during the core editing loop. | `src/pages/Editor.tsx` | Keep the workspace bar stable except in presentation mode. | Yes |
| High | Background autosave errors are inline, while visible save success primarily follows manual Save. | “Saved” can be ambiguous and localStorage failures are easy to miss. | `src/pages/Editor.tsx`, `src/components/editor/EditorTopBar.tsx` | Use a truthful `Saving…` / `Saved locally` / `Unable to save` live status driven by autosave and manual save. | Yes |
| High | Disabled AI composer and AI rail action occupy prominent workspace positions. | Users may believe AI is usable and must scan irrelevant controls. | `EditorSidebar.tsx`, `EditorToolRail.tsx`, `Editor.tsx`, `aiService.ts` | Remove editor AI controls and mock execution path; retain honest product limitation copy in docs/marketing. | Yes |
| High | Invalid editor IDs leave an error inside an otherwise active editor. | Users can edit a board that cannot be persisted. | `src/pages/Editor.tsx` | Show a dedicated missing-diagram state with Dashboard/Create actions. | Yes |
| Medium | Import/export appears in multiple unrelated surfaces; clear-board sits beside routine export buttons. | Hierarchy is noisy and destructive intent is less clear. | `EditorTopBar.tsx`, `EditorToolRail.tsx`, `EditorSidebar.tsx` | Put Import/Export in the workspace bar and Clear board in a secondary menu; keep inspector actions contextual. | Yes |
| Medium | Inspector begins with AI and always shows a large shape library before contextual properties. | Selection editing requires excessive scrolling and irrelevant content dominates. | `EditorSidebar.tsx` | Put contextual inspector first; show diagram settings/quick actions when nothing is selected. | Yes |
| Medium | Empty canvas card is decorative, dismissible, and lacks functional quick actions. | New users read instructions but cannot act from the card. | `EditorCanvasChrome.tsx` | Add functional Start/Process/Decision and starter-template actions. | Yes |
| Medium | Many icon-only controls rely on `title`; dialogs lack complete semantics/focus lifecycle. | Keyboard and assistive-technology use is unreliable. | editor components, `ConfirmModal.tsx`, `CommandMenu.tsx` | Add accessible names, dialog semantics, Escape handling, focus entry/return, and live regions. | Yes for modified surfaces; canvas limitations remain |
| Medium | Left rail only appears at `xl`; collapsed-panel recovery is also `xl`-only. | 1024–1279 px layouts lose efficient access and may strand hidden panels. | `EditorToolRail.tsx`, `EditorSidebar.tsx`, `Editor.tsx` | Support desktop/tablet-landscape shell behavior and retain clear panel recovery controls. | Partially |
| Low | Theme, status chips, large rounded cards, and many accent colours compete. | Workspace feels more like a marketing surface than a focused editor. | editor components, `src/index.css` | Consolidate neutral tokens, restrained accent, radii, shadows, focus ring, and typography. | Yes for modified workspace surfaces |

## Save, reopen, and export

| Severity | Problem | User impact | Relevant files | Recommended correction | Fixed in this task |
| --- | --- | --- | --- | --- | --- |
| High | Local writes throw on quota/serialization failure but the dashboard and editor do not share a clear status pattern. | Users can assume data is safe when a write failed. | `flowchartService.ts`, Dashboard, Editor | Normalize local persistence errors and surface them through consistent status/toast UI. | Yes |
| Medium | Dashboard has no direct backup action. | Users must open every diagram before exporting. | Dashboard, export helpers | Add local JSON export to cards. | Yes |
| Medium | Rich editor export paths exist but completion feedback is inconsistent. | Downloads can appear to do nothing. | `Editor.tsx` | Emit one lightweight success/error notification pattern. | Yes |
| Low | PDF is a rasterized image inside a PDF. | Output is not truly editable/vector PDF. | `flowchartExport.ts`, `Editor.tsx` | Document this limitation; preserve current behavior in this task. | No |

## Accessibility and responsive limits

The custom canvas is not fully screen-reader accessible: nodes, edge paths, resize handles, connector handles, minimap navigation, and drag interactions remain primarily pointer-based. This task can improve surrounding controls, focus, dialogs, status announcements, and small-screen messaging without claiming full canvas accessibility.

Desktop and tablet-landscape are the implementation priority. The editor will present a helpful small-screen message rather than attempt touch-first editing. Landing, dashboard, privacy, and terms remain readable on mobile.

## Priority conclusion

The critical path is: remove Supabase and fake access, make routes direct, establish a useful local dashboard, make autosave truthful, stabilize the editor’s document hierarchy, remove unavailable AI controls, and update tests/docs. Full touch editing and semantic canvas accessibility remain later architectural work.
