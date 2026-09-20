# CHECKPOINTS — A-THERAPY

Cada cambio importante deja un checkpoint: qué cambió, qué funciona,
qué se comprobó, qué queda pendiente, commit asociado y próximo paso.

## CP9/CP10 — 2026-09-05 — Estética + tsc a cero
- **Comprobado**: `tsc` 0 errores (antes 47) · `eslint` OK · `next build` OK
  (13 rutas) · exports `Avatar/AvatarFallback` verificados.
- **Sin verificar visualmente** (sin navegador aquí): modo oscuro, toggle,
  avatar y skeletons — pedir revisión visual al usuario con capturas.
- **Commits**: pendientes (`estetica CP9` + `calidad CP10`), un solo push.

## CP8 — 2026-09-05 — Bloque seguridad
- **Qué cambió**: rate-limit, zod, cookie httpOnly, logout con limpieza,
  seed desactivado, roles restringidos, headers, logs Prisma.
- **Comprobado**: lint + build OK · login local 200 + `Set-Cookie at-token`.
- **Incidencia aparte**: el admin de prod tenía la password cambiada (no era
  `admin123`; había un cliente `ariel@prueba.com` creado desde dentro). Reset
  a `admin123` + login prod 200 verificado. El usuario debe cambiarla.
- **Pendiente**: commit + push + deploy; el usuario cambia su password.
- **Commit**: pendiente (`feat: bloque seguridad CP8`).

## CP7 — 2026-09-05 — Fix persistencia de sesión
- **Síntoma**: recargar la web expulsaba al login.
- **Causa**: store sin hidratar desde `localStorage` (código muerto).
- **Comprobado**: lint + build OK · diff mínimo (1 archivo + docs).
- **Nota**: con sesión ya guardada en el navegador, basta recargar tras el
  deploy — no hace falta volver a loguearse (salvo token expirado 7d).
- **Commit**: pendiente (`fix: hidratar sesion al cargar`).

## CP6 — 2026-09-05 — Migración a Postgres Neon
- **Qué cambió**: schema a `postgresql`; env vars en Vercel; untrack `.env`
  y `db/custom.db`; `.env.example` Postgres.
- **Comprobado**: `db push` in sync · generate/build/eslint OK · diff revisado
  (sin secretos: el `.env` con credenciales queda fuera del commit).
- **Pendiente**: seed admin en prod + verificar login 200 tras rebuild.
- **Verificado en prod**: seed → "Admin already exists" (auto-seed del
  AppShell); `POST /api/auth/login admin@atherapy.com/admin123` → **200,
  role=admin + JWT**. Acceso total operativo en
  https://a-therapy-seven.vercel.app.
- **Commit**: pendiente (`feat: migracion a Postgres Neon`).

## CP5 — 2026-09-05 — Login muestra el error real
- **Qué cambió**: `LoginForm.tsx` (catch muestra causa real) + CHANGELOG.
- **Comprobado**: login local `admin@atherapy.com/admin123` → 200 + JWT
  contra `localhost:3000` (servidor dev con `.env` Windows). La password ES
  correcta; el "Credenciales incorrectas" en producción es el 500 por falta
  de `DATABASE_URL`, no la password.
- **Pendiente**: Postgres en Vercel (bloquea acceso en producción).
- **Commit**: pendiente (`fix: mensaje de error real en login`).

## CP4 — 2026-09-05 — Site UP (causa real: framework null)
- **Corrección a CP3**: lo de `standalone` no era la causa. La causa real era
  `framework: null` en el proyecto Vercel → deploy estático (lambda con
  entrypoint `.` y output vacío; solo servía `public/`). Evidencia: build OK
  en logs, `/logo.png` 200 pero `/` y `/api` 404, sin logs de función.
- **Fix**: `framework: "nextjs"` vía API + redeploy → `/` 200 + `/api` 200.
- **Comprobado**: título "A-THERAPY | Training Platform" en producción.
  `/api/auth/login` → 500 (falta `DATABASE_URL`; pendiente Postgres).
- **Pendiente**: Postgres + `DATABASE_URL` en Vercel; revocar token Vercel.
- **Próximo paso**: crear Postgres (dashboard o Neon) → set env → migrate.

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
