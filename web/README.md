# FossesNotes Web Frontend

Production-grade Next.js frontend with MapLibre, PWA support, and comprehensive river coverage.

## Features

- **🌍 Interactive Map**: MapLibre GL JS with clustering and layer toggles
- **📱 PWA Support**: Installable app with offline capabilities
- **🌐 Bilingual**: French/English with next-intl
- **🎨 Modern UI**: Tailwind CSS + shadcn/ui components
- **⚡ Performance**: React Query for data fetching, Zustand for state
- **🔒 Paywall**: Premium content protection with role-based access
- **📊 Offline Packs**: Download river data for offline use (paid users)

## Quick Start

### Prerequisites

- Node.js 18+
- Backend API running on port 5000

### Installation

```bash
# Install dependencies
pnpm install

# Set environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
pnpm dev

# Open http://localhost:3000
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

## Environment Variables

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:5000
NEXT_PUBLIC_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Feature Flags
NEXT_PUBLIC_FEATURE_OFFLINE=true
NEXT_PUBLIC_FEATURE_PREMIUM=true
```

## Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main map page
│   └── api-proxy.ts       # API proxy helper
├── components/            # React components
│   ├── MapView.tsx        # Main map component
│   ├── LayerToggle.tsx    # Layer visibility controls
│   ├── PaywallGuard.tsx   # Premium content protection
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities and API
│   ├── api.ts            # API hooks and types
│   └── i18n.ts           # Internationalization setup
├── store/                 # Zustand stores
│   ├── useMapStore.ts    # Map state management
│   └── useAuthStore.ts   # Authentication state
├── messages/              # Translation files
│   ├── fr.json           # French translations
│   └── en.json           # English translations
└── public/                # Static assets
    ├── manifest.webmanifest  # PWA manifest
    └── icons/             # App icons
```

## Key Components

### MapView
Main map component using MapLibre GL JS with:
- River clustering and popups
- Layer toggles (rivers, pools, premium)
- Navigation controls
- Scale and attribution

### PaywallGuard
Conditional rendering component that:
- Shows premium content only to paid users
- Displays upgrade prompts for free users
- Supports custom fallback content

### OfflinePackCard
Manages offline pack downloads:
- Shows download/installed status
- Handles download progress
- Manages pack installation/uninstallation

## Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run linting
pnpm lint
```

## PWA Features

The app is configured as a Progressive Web App with:

- **Installable**: Add to home screen on mobile/desktop
- **Offline Support**: Service worker caches essential resources
- **App Manifest**: Proper app metadata and icons
- **Background Sync**: Queue operations when offline

## Internationalization

Uses `next-intl` for French/English support:

- **Default**: French
- **Toggle**: Language switcher in header
- **Persistence**: Language choice saved in localStorage
- **Namespaces**: Organized by feature (common, map, offline)

## State Management

### MapStore (Zustand)
Manages map state:
- Center coordinates and zoom level
- Layer visibility toggles
- Device information (DPR, mobile detection)
- Persistent storage

### AuthStore (Zustand)
Manages authentication:
- User role and permissions
- Derived flags (isPaid, isAdmin)
- Token management
- Persistent storage

## API Integration

Uses React Query for data fetching:

- **Rivers**: `/api/rivieres` - List all rivers
- **Pools**: `/api/pools` - River-specific pools
- **Layers**: `/api/layers` - Premium map layers
- **Offline Packs**: `/api/packs` - Downloadable content

## Deployment

### Vercel (Recommended)
```bash
# Deploy to Vercel
vercel --prod
```

### Docker
```bash
# Build image
docker build -t fossesnotes-web .

# Run container
docker run -p 3000:3000 fossesnotes-web
```

## Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Submit PR

## License

MIT License - see main project license.



