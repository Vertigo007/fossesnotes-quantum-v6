import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed'
})

export default function middleware(request: NextRequest) {
  // Handle internationalization
  const response = intlMiddleware(request)
  
  // Inject auth headers if available
  const userRole = request.headers.get('X-User-Role') || 'free'
  const authToken = request.headers.get('Authorization')
  
  if (response) {
    response.headers.set('X-User-Role', userRole)
    if (authToken) {
      response.headers.set('Authorization', authToken)
    }
  }
  
  return response
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}



