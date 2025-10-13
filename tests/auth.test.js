const request = require('supertest');
const app = require('../server/index');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Utiliser la base de données de test
const testDbPath = path.join(__dirname, '../test-database.sqlite');
const db = new sqlite3.Database(testDbPath);

describe('Authentication & Plan Gating', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Nettoyer la base de test
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM subscriptions', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with free plan', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nom: 'Test',
          prenom: 'User',
          lang: 'fr'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.plan).toBe('free');
      expect(response.body.user.lang).toBe('fr');

      testUser = response.body.user;
      authToken = response.body.accessToken;
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // D'abord se connecter pour obtenir un refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const refreshToken = loginResponse.body.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: refreshToken
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Plan Gating - /api/secure/layers', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/secure/layers');

      expect(response.status).toBe(401);
    });

    it('should reject free plan users', async () => {
      const response = await request(app)
        .get('/api/secure/layers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('need');
      expect(response.body.need).toBe('pro');
    });

    it('should allow pro plan users', async () => {
      // Mettre à jour l'utilisateur vers Pro
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET plan = ? WHERE id = ?', ['pro', testUser.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const response = await request(app)
        .get('/api/secure/layers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('layers');
      expect(response.body).toHaveProperty('userPlan');
      expect(response.body.userPlan).toBe('pro');
    });
  });

  describe('Plan Gating - /api/secure/analytics', () => {
    it('should reject pro plan users for elite features', async () => {
      const response = await request(app)
        .get('/api/secure/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('need');
      expect(response.body.need).toBe('elite');
    });

    it('should allow elite plan users', async () => {
      // Mettre à jour l'utilisateur vers Elite
      await new Promise((resolve, reject) => {
        db.run('UPDATE users SET plan = ? WHERE id = ?', ['elite', testUser.id], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      const response = await request(app)
        .get('/api/secure/analytics')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('fishingTrends');
      expect(response.body).toHaveProperty('riverRankings');
      expect(response.body).toHaveProperty('aiInsights');
    });
  });

  describe('Profile API', () => {
    it('should return user profile with plan-specific data', async () => {
      const response = await request(app)
        .get('/api/secure/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('stats');
      expect(response.body).toHaveProperty('premium');
      expect(response.body).toHaveProperty('elite');
      expect(response.body.plan).toBe('elite');
    });
  });
});

