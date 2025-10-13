const { test, expect } = require('@playwright/test');

test.describe('UI Plan Gating & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should show pricing plans for unauthenticated users', async ({ page }) => {
    // Aller à la page de pricing
    await page.goto('http://localhost:3000/pricing');
    
    // Vérifier que les 3 plans sont affichés
    await expect(page.locator('[data-testid="plan-free"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-pro"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-elite"]')).toBeVisible();
    
    // Vérifier les prix
    await expect(page.locator('[data-testid="plan-free"] .price')).toContainText('0$');
    await expect(page.locator('[data-testid="plan-pro"] .price')).toContainText('199$');
    await expect(page.locator('[data-testid="plan-elite"] .price')).toContainText('399$');
  });

  test('should show login form', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show register form', async ({ page }) => {
    await page.goto('http://localhost:3000/register');
    
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('select[name="plan"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show paywall for premium features', async ({ page }) => {
    // Aller à la carte
    await page.goto('http://localhost:3000/map');
    
    // Essayer d'accéder à une fonctionnalité premium
    await page.click('[data-testid="premium-layer-toggle"]');
    
    // Vérifier que le paywall s'affiche
    await expect(page.locator('[data-testid="paywall-guard"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible();
  });

  test('should show different content based on plan', async ({ page }) => {
    // Simuler un utilisateur Pro
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'pro@test.com',
        plan: 'pro',
        lang: 'fr'
      }));
      localStorage.setItem('token', 'fake-token');
    });
    
    await page.goto('http://localhost:3000/map');
    
    // Vérifier que les couches Pro sont disponibles
    await expect(page.locator('[data-testid="weather-layer"]')).toBeVisible();
    await expect(page.locator('[data-testid="offline-pack-button"]')).toBeVisible();
    
    // Vérifier que les couches Elite ne sont pas disponibles
    await expect(page.locator('[data-testid="ai-predictions"]')).not.toBeVisible();
  });

  test('should show elite features for elite users', async ({ page }) => {
    // Simuler un utilisateur Elite
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'elite@test.com',
        plan: 'elite',
        lang: 'fr'
      }));
      localStorage.setItem('token', 'fake-token');
    });
    
    await page.goto('http://localhost:3000/map');
    
    // Vérifier que toutes les couches sont disponibles
    await expect(page.locator('[data-testid="weather-layer"]')).toBeVisible();
    await expect(page.locator('[data-testid="water-temp-layer"]')).toBeVisible();
    await expect(page.locator('[data-testid="ai-predictions"]')).toBeVisible();
  });

  test('should handle language switching', async ({ page }) => {
    await page.goto('http://localhost:3000/pricing');
    
    // Vérifier le texte en français
    await expect(page.locator('h2')).toContainText('Choisis ton plan');
    
    // Changer vers l'anglais
    await page.click('[data-testid="language-switcher"]');
    await page.click('[data-testid="lang-en"]');
    
    // Vérifier le texte en anglais
    await expect(page.locator('h2')).toContainText('Choose your plan');
  });

  test('should show subscription management for paid users', async ({ page }) => {
    // Simuler un utilisateur Pro
    await page.addInitScript(() => {
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'pro@test.com',
        plan: 'pro',
        lang: 'fr'
      }));
      localStorage.setItem('token', 'fake-token');
    });
    
    await page.goto('http://localhost:3000/account');
    
    // Vérifier que le bouton de gestion d'abonnement est visible
    await expect(page.locator('[data-testid="manage-subscription"]')).toBeVisible();
    
    // Vérifier les statistiques premium
    await expect(page.locator('[data-testid="offline-packs-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="saved-routes-count"]')).toBeVisible();
  });
});

test.describe('Map Features', () => {
  test('should load map with basic features', async ({ page }) => {
    await page.goto('http://localhost:3000/map');
    
    // Vérifier que la carte se charge
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Vérifier les contrôles de base
    await expect(page.locator('[data-testid="zoom-in"]')).toBeVisible();
    await expect(page.locator('[data-testid="zoom-out"]')).toBeVisible();
    await expect(page.locator('[data-testid="locate-me"]')).toBeVisible();
  });

  test('should show river markers', async ({ page }) => {
    await page.goto('http://localhost:3000/map');
    
    // Attendre que les marqueurs se chargent
    await page.waitForSelector('[data-testid="river-marker"]', { timeout: 10000 });
    
    // Vérifier qu'il y a des marqueurs de rivières
    const markers = await page.locator('[data-testid="river-marker"]').count();
    expect(markers).toBeGreaterThan(0);
  });

  test('should filter rivers by search', async ({ page }) => {
    await page.goto('http://localhost:3000/map');
    
    // Taper dans la barre de recherche
    await page.fill('[data-testid="search-input"]', 'Matapédia');
    
    // Vérifier que les résultats se filtrent
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="search-results"]')).toContainText('Matapédia');
  });
});
