import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface MapState {
  // Map position and zoom
  center: [number, number]
  zoom: number
  
  // Layer visibility
  layers: Record<string, boolean>
  
  // Map controls
  showLegend: boolean
  showSearch: boolean
  showControls: boolean
  
  // Device info
  devicePixelRatio: number
  isMobile: boolean
  
  // Actions
  setMapCenter: (center: [number, number]) => void
  setMapZoom: (zoom: number) => void
  toggleLayer: (layerId: string, visible: boolean) => void
  isLayerVisible: (layerId: string) => boolean | undefined
  setShowLegend: (show: boolean) => void
  setShowSearch: (show: boolean) => void
  setShowControls: (show: boolean) => void
  setDeviceInfo: (dpr: number, isMobile: boolean) => void
  resetMap: () => void
}

const initialState = {
  center: [-71.2080, 46.8139] as [number, number], // Québec center
  zoom: 6,
  layers: {
    rivers: true,
    pools: true,
    premium: false,
  },
  showLegend: true,
  showSearch: true,
  showControls: true,
  devicePixelRatio: 1,
  isMobile: false,
}

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setMapCenter: (center) => set({ center }),
      setMapZoom: (zoom) => set({ zoom }),
      
      toggleLayer: (layerId, visible) => 
        set((state) => ({
          layers: {
            ...state.layers,
            [layerId]: visible,
          },
        })),
      
      isLayerVisible: (layerId) => get().layers[layerId],
      
      setShowLegend: (show) => set({ showLegend: show }),
      setShowSearch: (show) => set({ showSearch: show }),
      setShowControls: (show) => set({ showControls: show }),
      
      setDeviceInfo: (devicePixelRatio, isMobile) => 
        set({ devicePixelRatio, isMobile }),
      
      resetMap: () => set(initialState),
    }),
    {
      name: 'fossesnotes-map-storage',
      partialize: (state) => ({
        center: state.center,
        zoom: state.zoom,
        layers: state.layers,
        showLegend: state.showLegend,
        showSearch: state.showSearch,
        showControls: state.showControls,
      }),
    }
  )
)



