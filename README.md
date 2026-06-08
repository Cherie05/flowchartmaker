# Wizzleflow

Wizzleflow is a professional, local-first React application for creating flowcharts, diagrams, and process maps. It runs fully in the browser with an ultra-sleek UI designed for speed and productivity.

## 🚀 Features

- **Local-First Architecture:** All flowcharts are saved instantly to your browser's `localStorage`. No user data or diagrams are ever transmitted to a server.
- **Interactive Editor:** Drag-and-drop nodes, create decision branches, and map processes seamlessly with React Flow.
- **Dynamic Routing:** Real-time smart pathing prevents lines from overlapping nodes.
- **High-Performance:** Built on React 18, Vite, and Tailwind CSS.
- **Waitlist & Analytics:** Secure, insert-only Supabase integration for waitlist lead generation without exposing any private data.

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion, Lucide React
- **Diagram Engine:** React Flow
- **Typography:** Space Grotesk & IBM Plex Mono
- **Database (Optional):** Supabase (strictly used for Waitlist & usage analytics via RLS)

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment Variables:
   Copy `.env.example` to `.env.local` and add your Supabase keys (only required if you want to use the Waitlist/Analytics features).
   ```bash
   cp .env.example .env.local
   ```
   *Note: Ensure `.env.local` remains hidden and is never committed to Git.*

3. Start the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security & Privacy

Wizzleflow was engineered with privacy at its core:
- **Zero-Knowledge Backend:** The core editor operates 100% offline.
- **Secure Database:** Supabase policies are configured as **INSERT-only**. The public frontend has zero `SELECT` privileges, ensuring waitlist and analytics data is impossible to scrape or steal.

## 📦 Build for Production

```bash
npm run build
```
Production files are generated in the `dist/` directory, ready to be deployed to Vercel, Netlify, or any static hosting provider.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

*Designed and engineered by [Arunvpp](https://arunvpp.xyz).*
