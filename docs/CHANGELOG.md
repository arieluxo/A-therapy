# CHANGELOG — A-THERAPY Training Platform

Formato: `[fecha] — título` + descripción breve. Entradas nuevas arriba.

## 2026-09-05 — Login muestra el error real (CP5)
- `LoginForm`: antes mostraba "Credenciales incorrectas" ante CUALQUIER fallo
  (incluido 500 por BD caída) — eso ocultaba la causa real. Ahora muestra el
  mensaje del servidor (p. ej. "Error del servidor: base de datos no
  disponible" en 500).

## 2026-09-05 — Site UP en Vercel (CP4, sin cambios de código)
- Causa real del 404: `framework: null` en el proyecto → Vercel desplegaba
  en modo estático (solo `public/`, sin `.next`). Fix vía API: `framework:
  "nextjs"` + redeploy → `/` 200 (11 KB, título A-THERAPY), `/api` 200.
- Antes: desprotegido el site (`ssoProtection: null`, pedía login Vercel) y
  creado `JWT_SECRET` aleatorio en Vercel (production/preview/development).
- `/api/auth/login` aún devuelve 500: no hay `DATABASE_URL` en Vercel
  (SQLite no viable en serverless). Siguiente paso: Postgres.

## 2026-09-05 — Fix 404 Vercel: quitar `output standalone` (CP3)
- Causa del 404: `next.config.ts` tenía `output: "standalone"` (pensado para
  self-host Caddy). El builder de Vercel generaba deployments READY pero sin
  rutas servibles (edge devolvía 404 vacío).
- `next.config.ts`: eliminado `output: "standalone"` (con comentario).
- `package.json`: eliminados scripts `build:standalone` y `start` (dependían
  del modo standalone; despliegue canónico = Vercel).
- Vercel vía API/CLI con token: desactivado `ssoProtection` (muro de login),
  creado `JWT_SECRET` aleatorio (production/preview/development), redeploy.
- Verificado: `bun run build` OK · `eslint` OK.

## 2026-09-05 — Fix deploy Vercel: `postinstall prisma generate` (CP2)
- `package.json`: añadido `"postinstall": "prisma generate"`. Sin esto, la
  instalación fresca de Vercel dejaba `@prisma/client` sin generar y todas
  las rutas API fallaban en runtime.
- Verificado: `bun run build` OK · `eslint` OK.

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
