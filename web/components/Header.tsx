'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'
import { useAuthStore } from '@/store/useAuthStore'
import { MapPin, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const { t } = useTranslations('common')
  const { isPaid, isAdmin } = useAuthStore()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                FossesNotes
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('tagline')}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost" size="sm">
              {t('nav.map')}
            </Button>
            <Button variant="ghost" size="sm">
              {t('nav.rivers')}
            </Button>
            {isPaid && (
              <Button variant="ghost" size="sm">
                {t('nav.offline')}
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm">
                {t('nav.admin')}
              </Button>
            )}
          </nav>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
            <nav className="flex flex-col space-y-2">
              <Button variant="ghost" size="sm" className="justify-start">
                {t('nav.map')}
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                {t('nav.rivers')}
              </Button>
              {isPaid && (
                <Button variant="ghost" size="sm" className="justify-start">
                  {t('nav.offline')}
                </Button>
              )}
              {isAdmin && (
                <Button variant="ghost" size="sm" className="justify-start">
                  {t('nav.admin')}
                </Button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}



