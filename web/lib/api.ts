import { useQuery, useMutation } from '@tanstack/react-query'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'

// Types
export interface River {
  id: number
  nom: string
  nom_anglais: string
  pays: string
  province_etat: string
  region: string
  type: string
  classe: number
  latitude: number
  longitude: number
  longueur_km: number
  nombre_fosses: number
  statut_conditions: string
  description: string
}

export interface Pool {
  id: number
  river_id: number
  name: string
  name_en: string
  latitude: number
  longitude: number
  type: string
  description: string
}

export interface Layer {
  id: number
  river_id: number
  name: string
  type: 'raster' | 'vector'
  url: string
  bounds: [number, number, number, number]
  zoom_levels: [number, number]
}

export interface OfflinePack {
  river_id: number
  river_name: string
  river_name_en: string
  download_url: string
  size: string
  pools_count: number
  last_updated: string
}

// API functions
async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-User-Role': 'free', // Will be overridden by middleware
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Rivers API
export function useRivers() {
  return useQuery({
    queryKey: ['rivers'],
    queryFn: () => fetchApi<{ success: boolean; rivieres: River[] }>('/api/rivieres'),
    select: (data) => data.rivieres,
  })
}

export function useRiver(id: number) {
  return useQuery({
    queryKey: ['river', id],
    queryFn: () => fetchApi<{ success: boolean; riviere: River }>(`/api/rivieres/${id}`),
    select: (data) => data.riviere,
    enabled: !!id,
  })
}

// Pools API
export function usePools(riverId?: number) {
  return useQuery({
    queryKey: ['pools', riverId],
    queryFn: () => fetchApi<{ success: boolean; pools: Pool[] }>(`/api/pools${riverId ? `?river_id=${riverId}` : ''}`),
    select: (data) => data.pools,
    enabled: !!riverId,
  })
}

// Layers API (Premium)
export function useLayers(riverId?: number) {
  return useQuery({
    queryKey: ['layers', riverId],
    queryFn: () => fetchApi<{ success: boolean; layers: Layer[] }>(`/api/layers${riverId ? `?river_id=${riverId}` : ''}`),
    select: (data) => data.layers,
    enabled: !!riverId,
  })
}

// Offline Packs API
export function useOfflinePacks() {
  return useQuery({
    queryKey: ['offline-packs'],
    queryFn: () => fetchApi<{ success: boolean; packs: OfflinePack[] }>('/api/packs'),
    select: (data) => data.packs,
  })
}

export function useOfflinePack(riverId: number) {
  return useQuery({
    queryKey: ['offline-pack', riverId],
    queryFn: () => fetchApi<{ success: boolean; pack: OfflinePack }>(`/api/packs/${riverId}`),
    select: (data) => data.pack,
    enabled: !!riverId,
  })
}

// Download mutation
export function useDownloadPack() {
  return useMutation({
    mutationFn: async (riverId: number) => {
      const response = await fetch(`${API_BASE}/api/packs/${riverId}/download`, {
        method: 'GET',
        headers: {
          'X-User-Role': 'paid',
        },
      })

      if (!response.ok) {
        throw new Error('Download failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `river-${riverId}-offline-pack.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { riverId, success: true }
    },
  })
}



