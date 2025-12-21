// Notification Service for sending emails, push notifications, SMS
// In production, integrate with actual services (SendGrid, Firebase, Twilio, etc.)

class NotificationService {
  /**
   * Send email notification
   */
  static async sendEmail(to, subject, html, text) {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL] Body: ${text || html}`);
    return { success: true, messageId: `email_${Date.now()}` };
  }

  /**
   * Send push notification
   */
  static async sendPushNotification(userId, title, body, data = {}) {
    // TODO: Integrate with Firebase Cloud Messaging or similar
    console.log(`[PUSH] User: ${userId}, Title: ${title}, Body: ${body}`);
    return { success: true, messageId: `push_${Date.now()}` };
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(phoneNumber, message) {
    // TODO: Integrate with SMS service (Twilio, etc.)
    console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
    return { success: true, messageId: `sms_${Date.now()}` };
  }

  /**
   * Send meal reservation confirmation
   */
  static async sendMealReservationConfirmation(userEmail, reservation) {
    const subject = 'Yemek Rezervasyonu Onayı';
    const html = `
      <h2>Yemek Rezervasyonunuz Onaylandı</h2>
      <p>Merhaba,</p>
      <p>Yemek rezervasyonunuz başarıyla oluşturuldu.</p>
      <ul>
        <li><strong>Tarih:</strong> ${new Date(reservation.date).toLocaleDateString('tr-TR')}</li>
        <li><strong>Öğün:</strong> ${reservation.meal_type === 'lunch' ? 'Öğle Yemeği' : reservation.meal_type === 'dinner' ? 'Akşam Yemeği' : 'Kahvaltı'}</li>
        <li><strong>Kafeterya:</strong> ${reservation.cafeteria?.name || 'N/A'}</li>
        <li><strong>QR Kod:</strong> ${reservation.qr_code}</li>
      </ul>
      <p>QR kodunuzu kafeteryada göstererek yemeğinizi alabilirsiniz.</p>
    `;
    return await this.sendEmail(userEmail, subject, html);
  }

  /**
   * Send event registration confirmation
   */
  static async sendEventRegistrationConfirmation(userEmail, event, registration) {
    const subject = 'Etkinlik Kaydı Onayı';
    const html = `
      <h2>Etkinlik Kaydınız Onaylandı</h2>
      <p>Merhaba,</p>
      <p>Etkinlik kaydınız başarıyla oluşturuldu.</p>
      <ul>
        <li><strong>Etkinlik:</strong> ${event.title}</li>
        <li><strong>Tarih:</strong> ${new Date(event.date).toLocaleDateString('tr-TR')}</li>
        <li><strong>Saat:</strong> ${event.start_time} - ${event.end_time}</li>
        <li><strong>Konum:</strong> ${event.location}</li>
        <li><strong>QR Kod:</strong> ${registration.qr_code}</li>
      </ul>
      <p>QR kodunuzu etkinlik girişinde göstererek katılımınızı onaylatabilirsiniz.</p>
    `;
    return await this.sendEmail(userEmail, subject, html);
  }
}

module.exports = NotificationService;



