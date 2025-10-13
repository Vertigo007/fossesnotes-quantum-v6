import { headers } from 'next/headers'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

export async function apiProxy(endpoint: string, options: RequestInit = {}) {
  const headersList = await headers()
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': headersList.get('X-User-Role') || 'free',
      'Authorization': headersList.get('Authorization') || '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

export async function apiGet(endpoint: string) {
  return apiProxy(endpoint, { method: 'GET' })
}

export async function apiPost(endpoint: string, data: any) {
  return apiProxy(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function apiPut(endpoint: string, data: any) {
  return apiProxy(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function apiDelete(endpoint: string) {
  return apiProxy(endpoint, { method: 'DELETE' })
}



