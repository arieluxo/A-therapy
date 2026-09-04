# CHANGELOG — A-THERAPY Training Platform

Formato: `[fecha] — título` + descripción breve. Entradas nuevas arriba.

## 2026-09-05 — Estabilización base + tooling (checkpoint 0)
- Instalado tooling Windows vía winget: Git 2.55, Node 24 (LTS), Bun 1.4.
- `bun install`: 834 paquetes, sin errores.
- `prisma generate`: OK (v6.19.2).
- `eslint .`: OK (0 errores — reglas estrictas desactivadas, ver deuda técnica).
- `next build`: OK (compila en ~7s, 13 rutas, `ignoreBuildErrors: true` activo).
- `tsc --noEmit`: 47 errores conocidos (tipado `unknown` en `lib/api.ts` + `examples/websocket` sin deps). No bloquean build por `ignoreBuildErrors`.
- Añadidos `docs/CHANGELOG.md`, `docs/CHECKPOINTS.md` y `.env.example`.
- `.gitignore`: ignorados SQLite (`*.db*`), `.zscripts/dev.pid` y `tool-results/`.
- `package.json`: `build` pasa a ser solo `next build` (compatible Vercel/Windows); el empaquetado standalone se mueve a `build:standalone`.
- Sin cambios funcionales. Trabajo previo preservado (ver `worklog.md`, Task IDs 1–8).

## Histórico previo (resumen de `worklog.md`)
- Tracker Excel profesional de 4 hojas (Task 1).
- Backend: 14 rutas API + auth JWT + roles admin/client (Tasks 3, 5).
- Frontend SPA: Dashboard, Clientes, ClientDetail 5 tabs, ExerciseLibrary, AdminPanel (Task 5).
- Gestión de accesos email/password por admin (Task 6).
- Experiencia cliente separada (client-home, training, sessions, questionnaire, progress) (Task 7).
- Rebrand slate `#334155` + cyan `#0E7490`; registro de sesiones por el cliente con RPE (Task 8 + follow-up).
