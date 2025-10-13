const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const { authRequired } = require('../utils/auth');
const { oneOrNone, none, one } = require('../utils/db');

// Configuration PayPal
paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID || 'test',
  client_secret: process.env.PAYPAL_CLIENT_SECRET || 'test'
});

// Créer une commande PayPal
router.post('/create-order', authRequired, async (req, res) => {
  try {
    const { plan } = req.body;
    const userId = req.user.uid;
    
    if (!plan || !['pro', 'elite'].includes(plan)) {
      return res.status(400).json({ error: 'Plan invalide' });
    }
    
    // Prix en fonction du plan
    const prices = {
      pro: { amount: '199.00', currency: 'CAD' },
      elite: { amount: '399.00', currency: 'CAD' }
    };
    
    const price = prices[plan];
    
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: `FossesNotes ${plan.toUpperCase()}`,
            sku: `plan-${plan}`,
            price: price.amount,
            currency: price.currency,
            quantity: 1
          }]
        },
        amount: {
          currency: price.currency,
          total: price.amount
        },
        description: `Abonnement FossesNotes ${plan.toUpperCase()} - 1 an`
      }]
    };
    
    paypal.payment.create(create_payment_json, async (error, payment) => {
      if (error) {
        console.error('Erreur PayPal:', error);
        return res.status(500).json({ error: 'Erreur création commande PayPal' });
      }
      
      // Sauvegarder la commande en base
      await none(
        `INSERT INTO subscriptions(user_id, provider, plan, status, paypal_order_id, currency, amount_cents, raw_payload) 
         VALUES(?, 'paypal', ?, 'pending', ?, ?, ?, ?)`,
        [userId, plan, payment.id, price.currency, Math.round(parseFloat(price.amount) * 100), JSON.stringify(payment)]
      );
      
      // Trouver le lien d'approbation
      const approveLink = payment.links.find(link => link.rel === 'approval_url');
      
      res.json({
        orderId: payment.id,
        approveUrl: approveLink ? approveLink.href : null,
        links: payment.links
      });
    });
    
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur création commande' });
  }
});

// Webhook PayPal
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook PayPal reçu:', event.event_type);
    
    if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
      const paymentId = event.resource.id;
      const payerId = event.resource.payer.payer_info.payer_id;
      
      // Récupérer la commande
      const subscription = await oneOrNone(
        'SELECT * FROM subscriptions WHERE paypal_order_id = ? AND status = "pending"',
        [paymentId]
      );
      
      if (subscription) {
        // Mettre à jour le statut
        await none(
          'UPDATE subscriptions SET status = "active", raw_payload = ? WHERE id = ?',
          [JSON.stringify(event), subscription.id]
        );
        
        // Mettre à jour le plan utilisateur
        await none(
          'UPDATE users SET plan = ? WHERE id = ?',
          [subscription.plan, subscription.user_id]
        );
        
        console.log(`Utilisateur ${subscription.user_id} mis à jour vers le plan ${subscription.plan}`);
      }
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Erreur webhook PayPal:', error);
    res.status(500).json({ error: 'Erreur webhook' });
  }
});

// Vérifier le statut d'une commande
router.get('/order/:orderId', authRequired, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.uid;
    
    const subscription = await oneOrNone(
      'SELECT * FROM subscriptions WHERE paypal_order_id = ? AND user_id = ?',
      [orderId, userId]
    );
    
    if (!subscription) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    res.json({
      orderId: subscription.paypal_order_id,
      plan: subscription.plan,
      status: subscription.status,
      amount: subscription.amount_cents / 100,
      currency: subscription.currency
    });
    
  } catch (error) {
    console.error('Erreur vérification commande:', error);
    res.status(500).json({ error: 'Erreur vérification commande' });
  }
});

module.exports = router; 