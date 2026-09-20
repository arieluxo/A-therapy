import { useStore } from '@/store/useStore'

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return useStore.getState().token || localStorage.getItem('at-token')
}

function baseInit(token: string | null, extra: RequestInit = {}): RequestInit {
  return {
    ...extra,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    // Envía la cookie httpOnly de sesión cuando exista
    credentials: 'include',
  }
}

function handleResponse(res: Response): Promise<any> {
  if (res.status === 401) {
    useStore.getState().logout()
    throw new Error('Unauthorized')
  }
  if (!res.ok) {
    return res.json().then(data => {
      throw new Error(JSON.stringify({ status: res.status, error: data.error }))
    }).catch(e => {
      if (e instanceof Error && e.message.startsWith('{')) throw e
      throw new Error(JSON.stringify({ status: res.status, error: 'Error de servidor' }))
    })
  }
  return res.json()
}

export async function apiGet(url: string, params?: Record<string, string>) {
  const token = await getToken()
  const q = params ? '?' + new URLSearchParams(params).toString() : ''
  const res = await fetch(url + q, baseInit(token))
  return handleResponse(res)
}

export async function apiPost(url: string, body?: unknown) {
  const token = await getToken()
  const res = await fetch(url, baseInit(token, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  }))
  return handleResponse(res)
}

export async function apiPut(url: string, body?: unknown) {
  const token = await getToken()
  const res = await fetch(url, baseInit(token, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  }))
  return handleResponse(res)
}

export async function apiDelete(url: string) {
  const token = await getToken()
  const res = await fetch(url, baseInit(token, { method: 'DELETE' }))
  return handleResponse(res)
}
