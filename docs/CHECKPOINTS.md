# CHECKPOINTS — A-THERAPY

Cada cambio importante deja un checkpoint: qué cambió, qué funciona,
qué se comprobó, qué queda pendiente, commit asociado y próximo paso.

## CP3 — 2026-09-05 — Fix 404 Vercel (quitar output standalone)
- **Causa raíz**: `output: "standalone"` en `next.config.ts` → deployments
  READY pero edge con 404 vacío. Además `ssoProtection` tapaba todo con login.
- **Qué cambió**: `next.config.ts` sin `output`; `package.json` sin scripts
  standalone; `JWT_SECRET` creado en Vercel (3 envs); `ssoProtection: null`.
- **Comprobado**: build local OK · eslint OK · push dispara rebuild en Vercel.
- **Pendiente**: verificar site tras rebuild; `DATABASE_URL` en Vercel
  (SQLite no viable en serverless → migrar a Postgres); revocar token Vercel.
- **Commit**: pendiente (`fix: quitar output standalone para Vercel`).
- **Próximo paso**: push → esperar build → verificar HTTP 200 + login.

## CP2 — 2026-09-05 — Fix deploy Vercel (postinstall prisma)
- **Qué cambió**: solo `package.json` (+`postinstall`) y CHANGELOG.
- **Comprobado**: `bun run build` OK (13 rutas) · `eslint` OK · diff revisado.
- **Pendiente (lado Vercel, requiere dashboard)**: el dominio
  `a-therapy-seven.vercel.app` devuelve 404 aunque GitHub está OK → casi
  seguro que no hay deployment de producción asignado (no se disparó el
  build, falló, o rama/dominio mal configurados). Ver checklist entregado.
- **Commit**: pendiente (`fix: postinstall prisma generate para Vercel`).
- **Próximo paso**: push → comprobar Deployments en Vercel → fijar env vars.

## CP1 — 2026-09-05 — Vinculación GitHub + push
- **Qué cambió**: `git remote add origin → github.com/arieluxo/A-therapy`,
  push forzado de `main` (historias no relacionadas: el remoto solo tenía
  `Index.html`). Tracking `main → origin/main` configurado.
- **Comprobado**: `git push --force-with-lease` → `bf34aad...3f07c77
  main -> main (forced update)`. Sin secretos en lo pusheado (`.env` del
  historial solo contiene `DATABASE_URL` de contenedor; la BD incluye solo
  datos de prueba: admin seed + cliente "Charlie" + 2 sesiones).
- **Pendiente**: verificar deploy auto de Vercel (`a-therapy-seven`); definir
  `DATABASE_URL`/`JWT_SECRET` en Vercel; migrar SQLite → Postgres.
- **Commit**: `3f07c77 chore: estabilización base + docs (CP0)` (pusheado).
- **Próximo paso**: comprobar Vercel y sanear `.env` local (apunta a ruta
  Linux `/home/z/...` inexistente en Windows).

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
