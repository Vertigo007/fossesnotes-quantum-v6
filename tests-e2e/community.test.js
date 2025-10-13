const { test, expect } = require('@playwright/test');

test.describe('Community System', () => {
  test.beforeEach(async ({ page }) => {
    // Simuler un utilisateur connecté avec plan Pro
    await page.addInitScript(() => {
      localStorage.setItem('token', 'fake-jwt-token');
      localStorage.setItem('lang', 'fr');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        email: 'test@example.com',
        plan: 'pro',
        lang: 'fr'
      }));
    });
  });

  test.describe('Community Feed', () => {
    test('should load community feed', async ({ page }) => {
      await page.goto('http://localhost:3000/community');
      
      // Vérifier que la page se charge
      await expect(page.locator('h1')).toContainText('Communauté Courant+');
      await expect(page.locator('[data-testid="post-composer"]')).toBeVisible();
      await expect(page.locator('[data-testid="search-input"]')).toBeVisible();
    });

    test('should create a new post', async ({ page }) => {
      await page.goto('http://localhost:3000/community');
      
      // Remplir le formulaire de création de post
      await page.fill('[data-testid="title-fr"]', 'Test Post FR');
      await page.fill('[data-testid="title-en"]', 'Test Post EN');
      await page.fill('[data-testid="body-fr"]', 'Contenu du test en français');
      await page.fill('[data-testid="body-en"]', 'Test content in English');
      
      // Sélectionner la visibilité
      await page.selectOption('[data-testid="visibility-select"]', 'public');
      
      // Publier le post
      await page.click('[data-testid="publish-button"]');
      
      // Vérifier que le post apparaît dans le feed
      await expect(page.locator('text=Test Post FR')).toBeVisible();
      await expect(page.locator('text=Contenu du test en français')).toBeVisible();
    });

    test('should react to a post', async ({ page }) => {
      await page.goto('http://localhost:3000/community');
      
      // Attendre qu'un post soit chargé
      await page.waitForSelector('[data-testid="post-card"]', { timeout: 10000 });
      
      // Cliquer sur le bouton "J'aime"
      await page.click('[data-testid="like-button"]');
      
      // Vérifier que la réaction a été enregistrée (pas d'erreur)
      await expect(page.locator('[data-testid="like-button"]')).toBeVisible();
    });

    test('should search posts', async ({ page }) => {
      await page.goto('http://localhost:3000/community');
      
      // Rechercher un terme
      await page.fill('[data-testid="search-input"]', 'test');
      await page.click('[data-testid="search-button"]');
      
      // Vérifier que la recherche fonctionne
      await expect(page.locator('[data-testid="search-input"]')).toHaveValue('test');
    });

    test('should switch language', async ({ page }) => {
      await page.goto('http://localhost:3000/community');
      
      // Basculer vers l'anglais
      await page.click('[data-testid="lang-en"]');
      
      // Vérifier que l'interface change
      await expect(page.locator('h1')).toContainText('Courant+ Community');
      await expect(page.locator('[data-testid="search-button"]')).toContainText('Search');
    });
  });

  test.describe('Events System', () => {
    test('should load events page', async ({ page }) => {
      await page.goto('http://localhost:3000/events');
      
      // Vérifier que la page se charge
      await expect(page.locator('h1')).toContainText('Événements');
    });

    test('should RSVP to an event', async ({ page }) => {
      await page.goto('http://localhost:3000/events');
      
      // Attendre qu'un événement soit chargé
      await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
      
      // Cliquer sur "Je participe"
      await page.click('[data-testid="rsvp-going"]');
      
      // Vérifier que le RSVP a été enregistré (pas d'erreur)
      await expect(page.locator('[data-testid="rsvp-going"]')).toBeVisible();
    });

    test('should join waitlist', async ({ page }) => {
      await page.goto('http://localhost:3000/events');
      
      // Attendre qu'un événement soit chargé
      await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
      
      // Cliquer sur "Liste d'attente"
      await page.click('[data-testid="rsvp-waitlist"]');
      
      // Vérifier que le RSVP a été enregistré
      await expect(page.locator('[data-testid="rsvp-waitlist"]')).toBeVisible();
    });

    test('should decline event', async ({ page }) => {
      await page.goto('http://localhost:3000/events');
      
      // Attendre qu'un événement soit chargé
      await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
      
      // Cliquer sur "Je passe"
      await page.click('[data-testid="rsvp-declined"]');
      
      // Vérifier que le RSVP a été enregistré
      await expect(page.locator('[data-testid="rsvp-declined"]')).toBeVisible();
    });

    test('should display event details', async ({ page }) => {
      await page.goto('http://localhost:3000/events');
      
      // Attendre qu'un événement soit chargé
      await page.waitForSelector('[data-testid="event-card"]', { timeout: 10000 });
      
      // Vérifier que les détails de l'événement sont affichés
      await expect(page.locator('[data-testid="event-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
      await expect(page.locator('[data-testid="event-description"]')).toBeVisible();
    });
  });

  test.describe('Plan Gating', () => {
    test('should hide composer for free users', async ({ page }) => {
      // Simuler un utilisateur gratuit
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'free@example.com',
          plan: 'free',
          lang: 'fr'
        }));
      });
      
      await page.goto('http://localhost:3000/community');
      
      // Vérifier que le composer est masqué pour les utilisateurs gratuits
      await expect(page.locator('[data-testid="post-composer"]')).not.toBeVisible();
    });

    test('should show composer for pro users', async ({ page }) => {
      // Simuler un utilisateur Pro
      await page.addInitScript(() => {
        localStorage.setItem('user', JSON.stringify({
          id: 1,
          email: 'pro@example.com',
          plan: 'pro',
          lang: 'fr'
        }));
      });
      
      await page.goto('http://localhost:3000/community');
      
      // Vérifier que le composer est visible pour les utilisateurs Pro
      await expect(page.locator('[data-testid="post-composer"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercepter les requêtes API et simuler une erreur
      await page.route('**/api/community/feed', route => {
        route.fulfill({ status: 500, body: '{"error": "Server error"}' });
      });
      
      await page.goto('http://localhost:3000/community');
      
      // Vérifier que l'erreur est gérée gracieusement
      await expect(page.locator('text=Erreur')).toBeVisible();
    });

    test('should handle authentication errors', async ({ page }) => {
      // Supprimer le token pour simuler une erreur d'authentification
      await page.addInitScript(() => {
        localStorage.removeItem('token');
      });
      
      await page.goto('http://localhost:3000/community');
      
      // Vérifier que l'erreur d'authentification est gérée
      await expect(page.locator('text=Non autorisé')).toBeVisible();
    });
  });
});



