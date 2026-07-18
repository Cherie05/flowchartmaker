# Wizzleflow

Wizzleflow is a direct-access, local-first flowchart editor. Open the product, choose **Try Tool**, and create diagrams without an account, sign-in step, or email address.

## Product model

- The landing page links directly to the local diagram dashboard.
- Diagrams are created, edited, and autosaved in the browser's `localStorage`.
- The editor uses a custom HTML/SVG canvas; it does not use React Flow.
- Starter diagrams are deterministic data bundled with the application and do not call a remote service.
- PNG, SVG, JSON, and PDF export are available. JSON diagrams can be imported into the editor.

## Storage and backups

Diagram data remains in the current browser profile. It is not automatically synchronized to another browser or device. Clearing site data can remove saved diagrams, so export important diagrams as JSON for backup.

Wizzleflow currently has:

- No account or email requirement
- No cloud sync or account recovery
- No collaboration or shared links
- No mobile-first editing experience (desktop and tablet landscape are recommended)
- No AI generation, AI chat, or AI workflow analysis

## Technology stack

- React 18 and React DOM 18
- TypeScript
- Vite 8
- Tailwind CSS 3
- Framer Motion, Lucide React, and Lenis
- Custom HTML/SVG diagram rendering and connection routing
- Vitest, Testing Library, and Playwright

There is no application backend, database, authentication service, or required runtime environment variable in the current local-first product.

## Local development

Node.js 20 and npm are used by the project workflow.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. No environment setup or access credentials are required.

## Validation commands

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run test:e2e
npm run build
```

To inspect a production build locally:

```bash
npm run preview
```

Vite writes the static build to `dist/`. Static hosting must provide a single-page application fallback so `/dashboard` and `/editor/:id` resolve to `index.html`.

## Privacy

Wizzleflow stores diagram content in browser local storage. No account or email is required, and diagrams are not automatically uploaded or synchronized. The deployed site may still make network requests for hosting, externally loaded fonts, or other static resources. See the in-product privacy page for the current disclosure.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
