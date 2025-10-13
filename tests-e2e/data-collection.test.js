const { test, expect } = require('@playwright/test');

test.describe('Data Collection & Anonymization System', () => {
  let authToken;
  let userId;

  test.beforeEach(async ({ page }) => {
    // Login as test user
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for login and get token
    await page.waitForURL('/dashboard');
    authToken = await page.evaluate(() => localStorage.getItem('token'));
    
    // Get user ID from profile
    const profileResponse = await page.request.get('/api/profile/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const profile = await profileResponse.json();
    userId = profile.id;
  });

  test('User can opt-in to data sharing', async ({ page }) => {
    await page.goto('/profile');
    
    // Check initial consent state
    const consentCheckbox = page.locator('[data-testid="consent-checkbox"]');
    await expect(consentCheckbox).not.toBeChecked();
    
    // Opt-in to data sharing
    await consentCheckbox.check();
    await page.waitForTimeout(1000); // Wait for API call
    
    // Verify consent was saved
    const profileResponse = await page.request.get('/api/profile/me', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const profile = await profileResponse.json();
    expect(profile.consent_share).toBe(true);
    expect(profile.consent_version).toBeTruthy();
  });

  test('Community privacy catches are anonymized in data warehouse', async ({ page }) => {
    // First, ensure user has consented
    await page.request.post('/api/profile/consent', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: { share: true }
    });

    // Create a fishing log with community privacy
    const logResponse = await page.request.post('/api/logs', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        started_at: new Date().toISOString(),
        privacy: 'community',
        notes_fr: 'Test log for anonymization',
        rivers: []
      }
    });
    expect(logResponse.ok()).toBeTruthy();
    const log = await logResponse.json();
    
    // Add a catch to the log
    const catchResponse = await page.request.post(`/api/logs/${log.id}/catches`, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        caught_at: new Date().toISOString(),
        species: 'Atlantic Salmon',
        length_cm: 75,
        weight_kg: 4.2,
        method: 'dry',
        fly_name: 'Adams',
        released: true
      }
    });
    expect(catchResponse.ok()).toBeTruthy();
    
    // Wait for ETL process (in real scenario, this would be a scheduled job)
    // For testing, we'll manually trigger the ETL
    await page.waitForTimeout(2000);
    
    // Verify data appears in anonymized warehouse
    const dwResponse = await page.request.get('/api/admin/reports/summary', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(dwResponse.ok()).toBeTruthy();
    
    const summary = await dwResponse.json();
    expect(Array.isArray(summary)).toBeTruthy();
    
    // Check that our catch data is anonymized (no direct user identification)
    const dwDataResponse = await page.request.get('/api/admin/exports/csv', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(dwDataResponse.ok()).toBeTruthy();
    
    const csvData = await dwDataResponse.text();
    expect(csvData).toContain('Atlantic Salmon');
    expect(csvData).toContain('dry');
    expect(csvData).toContain('adams'); // normalized fly name
    expect(csvData).not.toContain(userId.toString()); // user ID should be hashed
  });

  test('Private catches are not included in anonymized data', async ({ page }) => {
    // Ensure user has consented
    await page.request.post('/api/profile/consent', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: { share: true }
    });

    // Create a fishing log with private privacy
    const logResponse = await page.request.post('/api/logs', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        started_at: new Date().toISOString(),
        privacy: 'private',
        notes_fr: 'Private test log',
        rivers: []
      }
    });
    expect(logResponse.ok()).toBeTruthy();
    const log = await logResponse.json();
    
    // Add a catch to the private log
    const catchResponse = await page.request.post(`/api/logs/${log.id}/catches`, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        caught_at: new Date().toISOString(),
        species: 'Brook Trout',
        length_cm: 25,
        method: 'nymph',
        fly_name: 'Private Fly',
        released: true
      }
    });
    expect(catchResponse.ok()).toBeTruthy();
    
    // Wait for ETL process
    await page.waitForTimeout(2000);
    
    // Verify private data is NOT in anonymized warehouse
    const dwResponse = await page.request.get('/api/admin/exports/csv', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(dwResponse.ok()).toBeTruthy();
    
    const csvData = await dwDataResponse.text();
    expect(csvData).not.toContain('Brook Trout'); // Private catch should not appear
    expect(csvData).not.toContain('Private Fly');
  });

  test('Admin reports endpoints return proper data structure', async ({ page }) => {
    // Test summary endpoint
    const summaryResponse = await page.request.get('/api/admin/reports/summary', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(summaryResponse.ok()).toBeTruthy();
    
    const summary = await summaryResponse.json();
    expect(Array.isArray(summary)).toBeTruthy();
    
    if (summary.length > 0) {
      const firstItem = summary[0];
      expect(firstItem).toHaveProperty('river_slug');
      expect(firstItem).toHaveProperty('total_catches');
      expect(firstItem).toHaveProperty('unique_fishers');
      expect(firstItem).toHaveProperty('avg_length');
    }
    
    // Test methods_flies endpoint
    const methodsResponse = await page.request.get('/api/admin/reports/methods_flies', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(methodsResponse.ok()).toBeTruthy();
    
    const methodsData = await methodsResponse.json();
    expect(methodsData).toHaveProperty('methods');
    expect(methodsData).toHaveProperty('flies');
    expect(Array.isArray(methodsData.methods)).toBeTruthy();
    expect(Array.isArray(methodsData.flies)).toBeTruthy();
    
    // Test weather correlation endpoint
    const weatherResponse = await page.request.get('/api/admin/reports/weather_correlation', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(weatherResponse.ok()).toBeTruthy();
    
    const weatherData = await weatherResponse.json();
    expect(Array.isArray(weatherData)).toBeTruthy();
    
    // Test hourly heatmap endpoint
    const heatmapResponse = await page.request.get('/api/admin/reports/hourly_heatmap', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(heatmapResponse.ok()).toBeTruthy();
    
    const heatmapData = await heatmapResponse.json();
    expect(Array.isArray(heatmapData)).toBeTruthy();
  });

  test('CSV export includes proper headers and data', async ({ page }) => {
    const csvResponse = await page.request.get('/api/admin/exports/csv', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    expect(csvResponse.ok()).toBeTruthy();
    
    const csvData = await csvResponse.text();
    const lines = csvData.split('\n');
    
    // Check headers
    const headers = lines[0].split(',');
    expect(headers).toContain('"river_slug"');
    expect(headers).toContain('"pool_bucket"');
    expect(headers).toContain('"date_utc"');
    expect(headers).toContain('"hour_bucket"');
    expect(headers).toContain('"species"');
    expect(headers).toContain('"method"');
    expect(headers).toContain('"fly_name_norm"');
    expect(headers).toContain('"length_cm"');
    expect(headers).toContain('"weight_kg"');
    
    // Check that user_hash is NOT in headers (privacy)
    expect(headers).not.toContain('"user_hash"');
  });

  test('User can revoke consent and data is excluded', async ({ page }) => {
    // First opt-in
    await page.request.post('/api/profile/consent', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: { share: true }
    });

    // Create community catch
    const logResponse = await page.request.post('/api/logs', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        started_at: new Date().toISOString(),
        privacy: 'community',
        notes_fr: 'Test before revoking consent',
        rivers: []
      }
    });
    const log = await logResponse.json();
    
    await page.request.post(`/api/logs/${log.id}/catches`, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        caught_at: new Date().toISOString(),
        species: 'Rainbow Trout',
        method: 'wet',
        fly_name: 'Before Revoke Fly',
        released: true
      }
    });

    // Now revoke consent
    await page.request.post('/api/profile/consent', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: { share: false }
    });

    // Create another community catch after revoking
    const log2Response = await page.request.post('/api/logs', {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        started_at: new Date().toISOString(),
        privacy: 'community',
        notes_fr: 'Test after revoking consent',
        rivers: []
      }
    });
    const log2 = await log2Response.json();
    
    await page.request.post(`/api/logs/${log2.id}/catches`, {
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`
      },
      data: {
        caught_at: new Date().toISOString(),
        species: 'Brown Trout',
        method: 'spey',
        fly_name: 'After Revoke Fly',
        released: true
      }
    });

    // Wait for ETL
    await page.waitForTimeout(2000);
    
    // Verify only pre-revoke data is in warehouse
    const csvResponse = await page.request.get('/api/admin/exports/csv', {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const csvData = await csvResponse.text();
    
    expect(csvData).toContain('Rainbow Trout'); // Before revoke
    expect(csvData).not.toContain('Brown Trout'); // After revoke
  });
});



