# Genta

A desktop application for managing school bell schedules. Built with Tauri 2, React, and Rust.

## Features

- **Bell Scheduling** — Set bell times with per-minute precision, enable/disable individual schedules
- **Schedule Presets** — Create multiple schedule profiles (e.g., regular schedule, exam schedule) with configurable business days
- **Custom Sounds** — Upload your own audio files for each schedule, or use the default bell sound
- **Per-Day Scheduling** — Configure different schedules for each day of the week
- **Dark/Light Theme** — Choose between dark, light, or system theme
- **Auto Updates** — In-app update notifications and installation

## Tech Stack

| Layer    | Technologies                                                |
| -------- | ----------------------------------------------------------- |
| Frontend | React 19, TypeScript, Tailwind CSS 4, TanStack Router/Query |
| Backend  | Tauri 2, Rust, SQLite (sqlx), rodio (audio playback)        |
| Tooling  | Vite 7, pnpm, oxlint, oxfmt, husky, lint-staged             |

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Project Structure

```
src/                  # Frontend (React)
├── components/       # UI components (sidebar, dialogs, etc.)
├── hooks/            # React hooks (queries, mutations)
├── lib/              # Utilities, models, and configuration
└── routes/           # App pages (TanStack Router file-based routing)
src-tauri/            # Backend (Rust/Tauri)
├── src/
│   ├── lib.rs        # Tauri entry point, plugin setup, DB migrations
│   └── scheduler.rs  # Scheduler loop: triggers bells on schedule
└── migrations/       # SQLite database migrations
```

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `pnpm dev`         | Start the Vite dev server         |
| `pnpm build`       | Build the frontend for production |
| `pnpm tauri dev`   | Run the Tauri app (development)   |
| `pnpm tauri build` | Build the Tauri app (production)  |
| `pnpm lint`        | Lint code with oxlint             |
| `pnpm fmt`         | Format code with oxfmt            |

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) with extensions:

- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
