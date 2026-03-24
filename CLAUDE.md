# Hostech V2 - Project Guidelines

This file is the "Source of Truth" for AI agents (Claude, Antigravity) working on this project. It defines canonical configurations to prevent environment confusion.

## 🚀 Primary Services & Ports
| Service         | Canonical Port | URL                      | Notes                                     |
|-----------------|----------------|--------------------------|-------------------------------------------|
| **Frontend V2** | `3000`         | `http://localhost:3000`  | Vite (React 19). Enforced via `strictPort`.|
| **Backend**     | `8000`         | `http://127.0.0.1:8000`  | Laravel 12.                               |
| **Testing**     | `5176`         | `http://localhost:5176`  | Reserved for Playwright E2E.              |

## 🛠️ Tech Stack
- **Backend**: Laravel 12, PHP 8.2+, MySQL.
- **Frontend V2**: React 19, TypeScript, Tailwind CSS 4, Zustand, React Query.
- **Testing**: Playwright (E2E), Pest (Backend).

## 📝 Conventions
- **Strict Ports**: Always use `--port XXXX --strictPort` when starting dev servers to avoid port shifting.
- **API Sync**: Run `npm run type-sync` in `frontendV2Hostech` after backend route changes.
- **Verification**: Run `.\verify-all.bat` in the root before claiming a task is complete.

## 📂 Key Directories
- `backend/`: Laravel application.
- `frontendV2Hostech/`: New React frontend.
- `frontend/`: Legacy frontend (avoid editing unless specified).
