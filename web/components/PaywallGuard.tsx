'use client'

import { ReactNode } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

interface PaywallGuardProps {
  children: ReactNode
  fallback?: ReactNode
  showUpgradeButton?: boolean
}

export function PaywallGuard({ 
  children, 
  fallback,
  showUpgradeButton = true 
}: PaywallGuardProps) {
  const { isPaid } = useAuthStore()
  const { t } = useTranslations('common')

  if (isPaid) {
    return <>{children}</>
  }

  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t('paywall.title')}
          </h3>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            {t('paywall.description')}
          </p>
        </div>
        {showUpgradeButton && (
          <Button 
            size="sm" 
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
            onClick={() => window.location.href = '/upgrade'}
          >
            {t('paywall.upgrade')}
          </Button>
        )}
      </div>
    </div>
  )
}



