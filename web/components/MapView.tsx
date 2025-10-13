'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslations } from 'next-intl'
import { useMapStore } from '@/store/useMapStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useRivers } from '@/lib/api'
import { MapControls } from './MapControls'
import { LayerToggle } from './LayerToggle'
import { SearchBar } from './SearchBar'
import { LocateButton } from './LocateButton'
import { PaywallGuard } from './PaywallGuard'
import { toast } from '@/hooks/use-toast'

const TILE_URL = process.env.NEXT_PUBLIC_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const { t } = useTranslations('map')
  
  const { center, zoom, setMapCenter, setMapZoom } = useMapStore()
  const { isPaid } = useAuthStore()
  const { data: rivers, isLoading, error } = useRivers()
  
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: [TILE_URL],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 18
          }
        ]
      },
      center: center,
      zoom: zoom,
      preserveDrawingBuffer: false,
      attributionControl: true,
      customAttribution: '© FossesNotes - Données Saumon Québec'
    })

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    
    // Add scale control
    map.current.addControl(new maplibregl.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left')

    map.current.on('load', () => {
      setIsMapLoaded(true)
      addRiversLayer()
    })

    map.current.on('moveend', () => {
      if (map.current) {
        setMapCenter(map.current.getCenter())
        setMapZoom(map.current.getZoom())
      }
    })

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  const addRiversLayer = () => {
    if (!map.current || !rivers) return

    // Add rivers source
    map.current.addSource('rivers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: rivers.map(river => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [river.longitude, river.latitude]
          },
          properties: {
            id: river.id,
            name: river.nom,
            nameEn: river.nom_anglais,
            class: river.classe,
            province: river.province_etat,
            region: river.region,
            pools: river.nombre_fosses,
            status: river.statut_conditions
          }
        }))
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    })

    // Add cluster layer
    map.current.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'rivers',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#51bbd6',
          100,
          '#f1f075',
          750,
          '#f28cb1'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    })

    // Add cluster count layer
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'rivers',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      }
    })

    // Add unclustered point layer
    map.current.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'rivers',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': [
          'match',
          ['get', 'class'],
          1, '#ef4444', // Elite - Red
          2, '#06b6d4', // Standard - Cyan
          3, '#3b82f6', // Beginner - Blue
          '#6b7280' // Default - Gray
        ],
        'circle-radius': 8,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff'
      }
    })

    // Add click handler
    map.current.on('click', 'unclustered-point', (e) => {
      if (!e.features?.[0]) return
      
      const feature = e.features[0]
      const coordinates = feature.geometry.coordinates.slice()
      const properties = feature.properties

      // Create popup
      const popup = new maplibregl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${properties.name}</h3>
            <p class="text-sm text-gray-600">${properties.province}, ${properties.region}</p>
            <p class="text-sm">${t('pools')}: ${properties.pools || 'N/A'}</p>
            <p class="text-sm">${t('status')}: ${properties.status || 'N/A'}</p>
          </div>
        `)
        .addTo(map.current!)
    })

    // Change cursor on hover
    map.current.on('mouseenter', 'unclustered-point', () => {
      map.current!.getCanvas().style.cursor = 'pointer'
    })

    map.current.on('mouseleave', 'unclustered-point', () => {
      map.current!.getCanvas().style.cursor = ''
    })
  }

  useEffect(() => {
    if (isMapLoaded && rivers) {
      addRiversLayer()
    }
  }, [isMapLoaded, rivers])

  useEffect(() => {
    if (error) {
      toast({
        title: t('error.title'),
        description: t('error.loading'),
        variant: 'destructive'
      })
    }
  }, [error, t])

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="h-full w-full" />
      
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <SearchBar />
        <LayerToggle />
        <LocateButton map={map.current} />
      </div>

      <div className="absolute top-4 right-4 z-10">
        <MapControls map={map.current} />
      </div>

      <PaywallGuard>
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
            <h3 className="text-sm font-semibold mb-2">{t('premium.title')}</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {t('premium.description')}
            </p>
          </div>
        </div>
      </PaywallGuard>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  )
}



