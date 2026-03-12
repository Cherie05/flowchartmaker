# FlowChart Maker

A production-grade React application for creating beautiful flowcharts with AI assistance. Built with React, TypeScript, Supabase, and Tailwind CSS.

## Features

- **AI-Powered Generation**: Describe your workflow in natural language and let AI generate the flowchart
- **Interactive Editor**: Drag-and-drop interface for creating and editing flowcharts
- **Multiple Node Types**: Start, Process, Decision, Connector, and End nodes
- **Smart Connections**: Connect nodes with visual arrows and paths
- **Auto-Save**: Automatic saving to Supabase database every 2 seconds
- **User Authentication**: Secure email/password authentication with Supabase Auth
- **Dashboard**: Manage all your flowcharts in one place
- **Export/Import**: Export flowcharts as JSON
- **Undo/Redo**: Full history management for all changes
- **Responsive Design**: Works on desktop and tablet devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Routing**: React Router v6
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Database Setup

The database schema is already set up in your Supabase project with the following tables:

- `flowcharts`: Stores flowchart data with nodes and connections
- `flowchart_shares`: Manages sharing permissions between users

All tables have Row Level Security (RLS) enabled for secure data access.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Node.tsx        # Flowchart node component
│   ├── ConnectionLine.tsx # Connection line component
│   ├── ErrorBoundary.tsx  # Error handling
│   └── ProtectedRoute.tsx # Route authentication
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
│   └── useFlowChart.ts # Flowchart state management
├── lib/                # Library configurations
│   └── supabase.ts    # Supabase client
├── pages/              # Page components
│   ├── Auth.tsx       # Login/signup page
│   ├── Dashboard.tsx  # Flowchart list
│   └── Editor.tsx     # Flowchart editor
├── services/           # API services
│   ├── aiService.ts   # AI flowchart generation
│   └── flowchartService.ts # Flowchart CRUD operations
├── types/              # TypeScript types
│   └── flowChart.ts   # Flowchart data types
└── App.tsx            # Main app component
```

## Usage

### Creating a Flowchart

1. Sign up or sign in to your account
2. Click "New Flowchart" on the dashboard
3. Use AI generation or manually add nodes by:
   - Double-clicking on the canvas
   - Clicking node type buttons in the sidebar

### Connecting Nodes

1. Select a node
2. Click one of the blue connection points
3. Click a connection point on another node to create a link

### Editing Nodes

- Double-click a node to edit its text
- Drag nodes to reposition them
- Click the X button to delete a node

### Saving

- Flowcharts auto-save every 2 seconds
- Click the "Save" button for manual save

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Security Features

- Row Level Security (RLS) on all database tables
- Secure authentication with Supabase Auth
- Protected routes requiring authentication
- User-scoped data access

## License

MIT
