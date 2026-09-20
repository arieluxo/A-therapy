// Rate limiting en memoria (ventana deslizante simple).
// NOTA: en serverless (Vercel) cada instancia tiene su propio contador,
// así que es una mitigación básica anti-fuerza-bruta, no una barrera total.
// Para protección completa usar Vercel Firewall / WAF o un store externo.
interface Entry {
  count: number
  resetAt: number
}

const buckets = new Map<string, Entry>()

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now()
  const entry = buckets.get(key)
  if (!entry || now >= entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  entry.count += 1
  if (entry.count > limit) {
    return { ok: false, remaining: 0 }
  }
  return { ok: true, remaining: limit - entry.count }
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
