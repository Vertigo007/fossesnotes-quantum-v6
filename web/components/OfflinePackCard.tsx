'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Download, CheckCircle, Trash2, MapPin } from 'lucide-react'
import { useOfflineStore } from '@/store/useOfflineStore'
import { toast } from '@/hooks/use-toast'

interface OfflinePackCardProps {
  riverId: string
  riverName: string
  riverNameEn: string
  province: string
  poolsCount: number
  size: string
}

export function OfflinePackCard({
  riverId,
  riverName,
  riverNameEn,
  province,
  poolsCount,
  size
}: OfflinePackCardProps) {
  const { t } = useTranslations('offline')
  const { isInstalled, installPack, uninstallPack } = useOfflineStore()
  const [isDownloading, setIsDownloading] = useState(false)
  
  const installed = isInstalled(riverId)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await installPack(riverId)
      toast({
        title: t('download.success'),
        description: t('download.description', { river: riverName }),
      })
    } catch (error) {
      toast({
        title: t('download.error'),
        description: t('download.errorDescription'),
        variant: 'destructive'
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleUninstall = async () => {
    try {
      await uninstallPack(riverId)
      toast({
        title: t('uninstall.success'),
        description: t('uninstall.description', { river: riverName }),
      })
    } catch (error) {
      toast({
        title: t('uninstall.error'),
        description: t('uninstall.errorDescription'),
        variant: 'destructive'
      })
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{riverName}</CardTitle>
            <CardDescription className="text-sm">
              {riverNameEn} • {province}
            </CardDescription>
          </div>
          {installed && (
            <Badge variant="secondary" className="ml-2">
              <CheckCircle className="w-3 h-3 mr-1" />
              {t('installed')}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{t('pools')}: {poolsCount}</span>
          </div>
          <span className="text-gray-500">{size}</span>
        </div>

        <div className="flex space-x-2">
          {installed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleUninstall}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {t('uninstall')}
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? t('downloading') : t('download')}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}



