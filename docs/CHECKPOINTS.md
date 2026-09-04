# CHECKPOINTS — A-THERAPY

Cada cambio importante deja un checkpoint: qué cambió, qué funciona,
qué se comprobó, qué queda pendiente, commit asociado y próximo paso.

## CP0 — 2026-09-05 — Análisis + estabilización base
- **Qué cambió**: nada funcional. Solo tooling + docs + higiene de repo
  (ver CHANGELOG). `docs/`, `.env.example`, `.gitignore`, scripts `build`.
- **Qué funciona**: login admin/cliente, dashboard, clientes, detalle 5 tabs,
  registro de sesiones con RPE, panel admin (según `worklog.md` + verificación
  de build del 2026-09-05).
- **Comprobado**: `bun install` OK · `prisma generate` OK · `eslint` OK ·
  `next build` OK (13 rutas) · `tsc` con 47 errores conocidos no bloqueantes.
- **Pendiente**:
  1. Vincular `remote origin` → `github.com/arieluxo/A-therapy` y primer push
     (el repo remoto hoy solo tiene `Index.html`; el push lo reemplaza —
     confirmado por el propietario).
  2. Estrategia de BD en Vercel: hoy SQLite (`db/custom.db`, 135 KB,
     versionado en git) — efímero en serverless. Migrar a Postgres
     (Vercel Postgres/Neon/Supabase) antes de uso real.
  3. `JWT_SECRET` sin valor en `.env` (usa fallback en código). Definirlo en
     Vercel + local.
  4. Sanear `tsc` (tipar `lib/api.ts`, excluir o completar
     `examples/websocket`) y reactivar `ignoreBuildErrors: false`.
  5. Revisar `/api/auth/seed` (crea `admin@atherapy.com/admin123` sin auth;
     acceptable solo como bootstrap — proteger o eliminar tras el seed).
  6. Normalizar commits descriptivos (el historial actual usa UUIDs).
- **Commit**: pendiente (este CP se commiteará como `chore: estabilización base + docs (CP0)`).
- **Próximo paso**: `git add` selectivo + commit + `remote add` + push a `main`
  + verificar deploy en Vercel (`a-therapy-seven`).
