// test/routes/wallet.test.js
const request = require('supertest');
const express = require('express');

// Mock middleware
jest.mock('../../../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next()
}));

// Mock controller
jest.mock('../../../src/controllers/walletController', () => ({
  getBalance: (req, res) => res.json({ route: 'getBalance' }),
  topup: (req, res) => res.json({ route: 'topup' }),
  topupWebhook: (req, res) => res.json({ route: 'topupWebhook' }),
  getTransactions: (req, res) => res.json({ route: 'getTransactions' })
}));

const walletRoutes = require('../../../src/routes/wallet');

describe('Wallet Routes - unit tests', () => {
  const app = express();
  app.use(express.json());
  app.use('/wallet', walletRoutes);

  test('GET /wallet/balance - should call getBalance controller', async () => {
    const res = await request(app).get('/wallet/balance');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getBalance');
  });

  test('POST /wallet/topup - should call topup controller', async () => {
    const topupData = { amount: 50, paymentMethod: 'card' };
    const res = await request(app).post('/wallet/topup').send(topupData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('topup');
  });

  test('POST /wallet/topup/webhook - should call topupWebhook controller (no auth)', async () => {
    const webhookData = { event: 'payment.succeeded' };
    const res = await request(app).post('/wallet/topup/webhook').send(webhookData);
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('topupWebhook');
  });

  test('GET /wallet/transactions - should call getTransactions controller', async () => {
    const res = await request(app).get('/wallet/transactions');
    expect(res.status).toBe(200);
    expect(res.body.route).toBe('getTransactions');
  });
});