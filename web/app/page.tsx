import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import { MapViewSkeleton } from '@/components/MapViewSkeleton'
import { Header } from '@/components/Header'
import { OfflineBanner } from '@/components/OfflineBanner'

// Dynamic import to avoid SSR issues with MapLibre
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => <MapViewSkeleton />
})

export default function HomePage() {
  const t = useTranslations('common')

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <OfflineBanner />
      <main className="flex-1 relative">
        <Suspense fallback={<MapViewSkeleton />}>
          <MapView />
        </Suspense>
      </main>
    </div>
  )
}



