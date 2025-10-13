'use client'

import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useTranslations } from 'next-intl'
import { useMapStore } from '@/store/useMapStore'

interface LayerToggleProps {
  layerId: string
  label: string
  defaultChecked?: boolean
  onToggle?: (checked: boolean) => void
}

export function LayerToggle({ 
  layerId, 
  label, 
  defaultChecked = true,
  onToggle 
}: LayerToggleProps) {
  const { t } = useTranslations('map')
  const { toggleLayer, isLayerVisible } = useMapStore()
  
  const isVisible = isLayerVisible(layerId) ?? defaultChecked

  const handleToggle = (checked: boolean) => {
    toggleLayer(layerId, checked)
    onToggle?.(checked)
  }

  return (
    <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3">
      <Switch
        id={layerId}
        checked={isVisible}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor={layerId} className="text-sm font-medium">
        {t(label)}
      </Label>
    </div>
  )
}

export function LayerToggleGroup() {
  const { t } = useTranslations('map')
  
  return (
    <div className="space-y-2">
      <LayerToggle 
        layerId="rivers" 
        label="layers.rivers" 
        defaultChecked={true}
      />
      <LayerToggle 
        layerId="pools" 
        label="layers.pools" 
        defaultChecked={true}
      />
      <LayerToggle 
        layerId="premium" 
        label="layers.premium" 
        defaultChecked={false}
      />
    </div>
  )
}



