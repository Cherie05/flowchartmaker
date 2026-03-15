# FlowChart Maker

A local-first React application for creating flowcharts with AI-assisted templates. It runs fully in the browser and saves flowcharts to `localStorage`.

## Features

- AI-assisted flowchart generation
- Interactive editor with drag-and-drop nodes
- Start, Process, Decision, Connector, and End node types
- Visual node connections with labels
- Auto-save and manual save
- Dashboard for managing saved flowcharts
- JSON import and export
- Undo and redo support

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Browser `localStorage`

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

No `.env` file or external backend is required.

## Project Structure

```text
src/
  components/          Reusable UI components
  hooks/               Custom hooks
  lib/                 Small shared utilities
  pages/               Dashboard and editor screens
  services/            AI generation and local persistence
  types/               TypeScript types
```

## Data Storage

- Flowcharts are saved in this browser only.
- Clearing browser storage will remove saved flowcharts.
- Export JSON if you want backups or portability.

## Build

```bash
npm run build
```

Production files are generated in `dist/`.
