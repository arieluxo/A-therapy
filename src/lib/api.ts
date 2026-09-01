import { useStore } from '@/store/useStore'

async function getToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  return useStore.getState().token || localStorage.getItem('at-token')
}

function handleResponse(res: Response): Promise<unknown> {
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
  const res = await fetch(url + q, {
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  return handleResponse(res)
}

export async function apiPost(url: string, body?: unknown) {
  const token = await getToken()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse(res)
}

export async function apiPut(url: string, body?: unknown) {
  const token = await getToken()
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  return handleResponse(res)
}

export async function apiDelete(url: string) {
  const token = await getToken()
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  return handleResponse(res)
}
