const express = require('express');
const router = express.Router();
const PaymentService = require('../services/PaymentService');
const prisma = require('../prisma');

// Mock payment page - in production, this would redirect to Stripe/PayTR
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Extract userId from sessionId (format: payment_timestamp_userId)
    const parts = sessionId.split('_');
    if (parts.length < 3) {
      return res.status(400).send(`
        <html>
          <head><title>Ödeme Hatası</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Ödeme Hatası</h1>
            <p>Geçersiz ödeme oturumu.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet">Cüzdan Sayfasına Dön</a>
          </body>
        </html>
      `);
    }

    const userId = parts[2];
    const timestamp = parseInt(parts[1]);
    const expiresAt = new Date(timestamp + 15 * 60 * 1000); // 15 minutes

    // Get payment amount from pending transaction (if exists)
    let paymentAmount = 0;
    try {
      const wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });
      if (wallet) {
        const pendingTransaction = await prisma.transaction.findFirst({
          where: {
            wallet_id: wallet.id,
            description: { contains: sessionId }
          },
          orderBy: { created_at: 'desc' }
        });
        if (pendingTransaction) {
          paymentAmount = pendingTransaction.amount;
        }
      }
    } catch (err) {
      console.error('Error fetching payment amount:', err);
    }

    if (new Date() > expiresAt) {
      return res.status(400).send(`
        <html>
          <head><title>Ödeme Süresi Doldu</title></head>
          <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>Ödeme Süresi Doldu</h1>
            <p>Ödeme oturumunuzun süresi dolmuş.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet">Cüzdan Sayfasına Dön</a>
          </body>
        </html>
      `);
    }

    // Get payment amount from wallet transaction (if exists) or use default
    // For now, show a mock payment page
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ödeme Sayfası - Mock</title>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .payment-container {
              background: white;
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              max-width: 500px;
              width: 90%;
            }
            h1 { color: #333; margin-top: 0; }
            .amount {
              font-size: 36px;
              font-weight: bold;
              color: #667eea;
              margin: 20px 0;
            }
            .info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info p {
              margin: 5px 0;
              color: #666;
            }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 15px 30px;
              font-size: 16px;
              border-radius: 8px;
              cursor: pointer;
              width: 100%;
              margin: 10px 0;
            }
            button:hover {
              background: #5568d3;
            }
            button.cancel {
              background: #ccc;
            }
            button.cancel:hover {
              background: #aaa;
            }
            .note {
              font-size: 12px;
              color: #999;
              margin-top: 20px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="payment-container">
            <h1>💳 Ödeme Sayfası</h1>
            <p style="color: #666;">Bu bir mock ödeme sayfasıdır. Gerçek entegrasyonda Stripe veya PayTR kullanılacaktır.</p>
            <div class="info">
              <p><strong>Oturum ID:</strong> ${sessionId}</p>
              <p><strong>Süre:</strong> ${new Date(expiresAt).toLocaleString('tr-TR')}</p>
            </div>
            <div style="text-align: center;">
              <div class="amount">Tutar: ${paymentAmount > 0 ? paymentAmount.toFixed(2) + ' TRY' : '[Bilgi Bekleniyor]'}</div>
              <button onclick="processPayment(${paymentAmount})">✅ Ödemeyi Onayla (Mock)</button>
              <button class="cancel" onclick="cancelPayment()">❌ İptal</button>
            </div>
            <p class="note">NOT: Bu sayfa development amaçlıdır. Gerçek ödeme gateway'i entegrasyonu yapıldığında bu sayfa değiştirilecektir.</p>
          </div>
          <script>
            function processPayment(amount) {
              const sessionId = '${sessionId}';
              const paymentAmount = amount || 50;
              // Simulate successful payment
              fetch('/api/v1/wallet/topup/webhook', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sessionId: sessionId,
                  amount: paymentAmount,
                  status: 'success',
                  signature: 'mock_signature'
                })
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?payment=success';
                } else {
                  alert('Ödeme işlemi başarısız: ' + (data.error || 'Bilinmeyen hata'));
                }
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Ödeme işlemi sırasında bir hata oluştu.');
              });
            }
            
            function cancelPayment() {
              window.location.href = '${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet?payment=cancelled';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Payment page error:', error);
    res.status(500).send(`
      <html>
        <head><title>Ödeme Hatası</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>Ödeme Hatası</h1>
          <p>Bir hata oluştu: ${error.message}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet">Cüzdan Sayfasına Dön</a>
        </body>
      </html>
    `);
  }
});

module.exports = router;

