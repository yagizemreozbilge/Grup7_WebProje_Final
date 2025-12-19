# Payment Integration Guide

Bu dokümantasyon, yemek rezervasyonu ve cüzdan sistemi için ödeme entegrasyonunu açıklar.

## Genel Bakış

Sistem şu anda **mock payment service** kullanmaktadır. Production ortamında gerçek bir ödeme gateway'i (Stripe veya PayTR) entegre edilmelidir.

## Mevcut Implementasyon

### PaymentService

`src/services/PaymentService.js` dosyasında şu metodlar bulunmaktadır:

1. **createPaymentSession**: Ödeme oturumu oluşturur
2. **verifyWebhookSignature**: Webhook imzasını doğrular
3. **processPayment**: Başarılı ödemeyi işler (cüzdan bakiyesini artırır)
4. **deductFromWallet**: Cüzdandan para çeker
5. **refundToWallet**: Cüzdana iade yapar

### Mock Payment Flow

```
1. Kullanıcı para yükleme isteği gönderir
   POST /api/v1/wallet/topup
   { "amount": 100 }

2. Backend payment session oluşturur
   Response: { "paymentUrl": "http://localhost:5000/payment/session_id" }

3. Kullanıcı payment URL'ye yönlendirilir (mock)

4. Ödeme başarılı olduğunda webhook çağrılır
   POST /api/v1/wallet/topup/webhook
   { "sessionId": "...", "status": "success", "amount": 100 }

5. Backend cüzdan bakiyesini günceller
```

## Stripe Entegrasyonu

### 1. Stripe Hesabı Oluşturma

1. [Stripe Dashboard](https://dashboard.stripe.com) üzerinden hesap oluşturun
2. Test API key'lerini alın:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

### 2. Stripe Paketini Yükleme

```bash
npm install stripe
```

### 3. PaymentService Güncelleme

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentService {
  static async createPaymentSession(amount, currency, userId, description) {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: description,
          },
          unit_amount: amount * 100, // Stripe uses cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/wallet?success=true`,
      cancel_url: `${process.env.FRONTEND_URL}/wallet?canceled=true`,
      metadata: {
        userId: userId,
        type: 'wallet_topup'
      }
    });

    return {
      sessionId: session.id,
      paymentUrl: session.url,
      amount,
      currency,
      expiresAt: new Date(session.expires_at * 1000)
    };
  }

  static verifyWebhookSignature(payload, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return { valid: true, event };
    } catch (err) {
      return { valid: false, error: err.message };
    }
  }
}
```

### 4. Webhook Endpoint Güncelleme

`src/controllers/walletController.js` dosyasında:

```javascript
async topupWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];
    const payload = req.body;

    // Verify webhook signature
    const verification = PaymentService.verifyWebhookSignature(
      payload,
      signature
    );

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid webhook signature'
      });
    }

    const event = verification.event;

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const amount = session.amount_total / 100; // Convert from cents

      // Get user's wallet
      let wallet = await prisma.wallet.findUnique({
        where: { user_id: userId }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            user_id: userId,
            balance: 0,
            currency: 'TRY',
            is_active: true
          }
        });
      }

      // Process payment
      await PaymentService.processPayment(
        wallet.id,
        amount,
        'topup',
        session.id,
        `Wallet top-up via Stripe - ${amount} TRY`
      );

      return res.status(200).json({ success: true });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
}
```

### 5. Environment Variables

`.env` dosyasına ekleyin:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 6. Webhook URL Yapılandırması

Stripe Dashboard'da webhook endpoint ekleyin:
- **URL**: `https://yourdomain.com/api/v1/wallet/topup/webhook`
- **Events**: `checkout.session.completed`

## PayTR Entegrasyonu

### 1. PayTR Hesabı Oluşturma

1. [PayTR](https://www.paytr.com) üzerinden hesap oluşturun
2. Merchant ID ve API key'lerini alın

### 2. PaymentService Güncelleme

```javascript
const crypto = require('crypto');

class PaymentService {
  static async createPaymentSession(amount, currency, userId, description) {
    const merchantId = process.env.PAYTR_MERCHANT_ID;
    const merchantKey = process.env.PAYTR_MERCHANT_KEY;
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;

    const orderId = `topup_${Date.now()}_${userId}`;
    const successUrl = `${process.env.FRONTEND_URL}/wallet?success=true`;
    const failUrl = `${process.env.FRONTEND_URL}/wallet?fail=true`;

    // Create hash
    const hashStr = `${merchantId}${orderId}${amount}${successUrl}${failUrl}${merchantSalt}`;
    const hash = crypto.createHash('sha256').update(hashStr).digest('base64');

    const paymentData = {
      merchant_id: merchantId,
      user_ip: req.ip,
      merchant_oid: orderId,
      email: user.email,
      payment_amount: amount * 100, // PayTR uses kurus
      paytr_token: hash,
      user_basket: Buffer.from(JSON.stringify([description])).toString('base64'),
      no_installment: 0,
      max_installment: 0,
      user_name: user.fullName,
      user_address: 'Campus',
      user_phone: user.phone || '',
      merchant_ok_url: successUrl,
      merchant_fail_url: failUrl,
      timeout_limit: 30
    };

    // Send to PayTR API
    const response = await axios.post(
      'https://www.paytr.com/odeme/api/get-token',
      paymentData
    );

    if (response.data.status === 'success') {
      return {
        sessionId: orderId,
        paymentUrl: `https://www.paytr.com/odeme/guvenli/${response.data.token}`,
        amount,
        currency,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      };
    } else {
      throw new Error('PayTR payment session creation failed');
    }
  }

  static verifyWebhookSignature(payload, hash) {
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT;
    const hashStr = `${payload.merchant_oid}${merchantSalt}${payload.status}${payload.total_amount}`;
    const calculatedHash = crypto.createHash('sha256').update(hashStr).digest('base64');

    return calculatedHash === hash;
  }
}
```

## Test Kartları

### Stripe Test Cards

- **Başarılı ödeme**: `4242 4242 4242 4242`
- **3D Secure**: `4000 0025 0000 3155`
- **Başarısız ödeme**: `4000 0000 0000 0002`

CVV: Herhangi bir 3 haneli sayı  
Expiry: Gelecek bir tarih

### PayTR Test Cards

PayTR test modunda gerçek kart bilgileri kullanılmaz. Test için özel test kartları sağlanır.

## Güvenlik Önerileri

1. **Webhook Signature Verification**: Her zaman webhook imzasını doğrulayın
2. **HTTPS**: Production'da mutlaka HTTPS kullanın
3. **Environment Variables**: API key'leri asla kod içine yazmayın
4. **Idempotency**: Aynı ödeme işleminin tekrar işlenmesini önleyin
5. **Logging**: Tüm ödeme işlemlerini loglayın (PCI-DSS uyumlu)

## Transaction Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ 1. POST /wallet/topup
       ▼
┌─────────────┐
│   Backend   │
└──────┬──────┘
       │ 2. Create Payment Session
       ▼
┌─────────────┐
│   Stripe/   │
│   PayTR     │
└──────┬──────┘
       │ 3. Payment Page
       ▼
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 4. Payment Success
       ▼
┌─────────────┐
│   Stripe/   │
│   PayTR     │
└──────┬──────┘
       │ 5. Webhook
       ▼
┌─────────────┐
│   Backend   │
│  (Webhook)  │
└──────┬──────┘
       │ 6. Update Wallet
       ▼
┌─────────────┐
│  Database   │
└─────────────┘
```

## Error Handling

Ödeme işlemlerinde hata durumları:

1. **Payment Failed**: Kullanıcıya bilgi verilir, cüzdan güncellenmez
2. **Webhook Timeout**: Retry mekanizması kullanılmalı
3. **Duplicate Payment**: Idempotency key ile kontrol edilmeli
4. **Network Error**: Retry logic implementasyonu

## Monitoring

Ödeme işlemlerini izlemek için:

1. **Stripe Dashboard**: Tüm işlemleri görüntüleyin
2. **Application Logs**: Webhook loglarını takip edin
3. **Database**: Transaction tablosunu izleyin
4. **Alerts**: Başarısız ödemeler için alert sistemi kurun

## Kaynaklar

- [Stripe Documentation](https://stripe.com/docs)
- [PayTR Documentation](https://dev.paytr.com)
- [PCI-DSS Compliance](https://www.pcisecuritystandards.org)

