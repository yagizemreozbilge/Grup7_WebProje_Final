const NotificationService = require('../../src/services/NotificationService');

describe('NotificationService Unit Tests', () => {
    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('sendEmail should log and return success', async () => {
        const result = await NotificationService.sendEmail('test@example.com', 'Subject', '<h1>Html</h1>', 'Text');
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
    });

    test('sendPushNotification should log and return success', async () => {
        const result = await NotificationService.sendPushNotification('user-1', 'Title', 'Body');
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('user-1'));
    });

    test('sendSMS should log and return success', async () => {
        const result = await NotificationService.sendSMS('5551234567', 'Message');
        expect(result.success).toBe(true);
        expect(result.messageId).toBeDefined();
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining('5551234567'));
    });

    test('sendMealReservationConfirmation should call sendEmail for all meal types', async () => {
        const spy = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue({ success: true });

        const meals = ['lunch', 'breakfast', 'dinner'];
        for (const meal of meals) {
            const reservation = {
                date: new Date(),
                meal_type: meal,
                cafeteria: { name: 'Main' },
                qr_code: 'QR123'
            };
            await NotificationService.sendMealReservationConfirmation('user@test.com', reservation);
            expect(spy).toHaveBeenCalled();
            spy.mockClear();
        }
    });

    test('sendMealReservationConfirmation should use fallback for cafeteria name', async () => {
        const spy = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue({ success: true });
        const reservation = {
            date: new Date(),
            meal_type: 'lunch',
            cafeteria: {}, // No name
            qr_code: 'QR123'
        };
        await NotificationService.sendMealReservationConfirmation('user@test.com', reservation);
        expect(spy).toHaveBeenCalledWith(
            'user@test.com',
            expect.any(String),
            expect.stringContaining('Kampüs Yemekhanesi'),
            expect.any(String)
        );
    });

    test('sendEventRegistrationConfirmation should call sendEmail', async () => {
        const spy = jest.spyOn(NotificationService, 'sendEmail').mockResolvedValue({ success: true });
        const event = { title: 'Event', date: new Date(), start_time: '10:00', end_time: '12:00', location: 'Hall' };
        const registration = { qr_code: 'QR_EVET' };
        await NotificationService.sendEventRegistrationConfirmation('user@test.com', event, registration);
        expect(spy).toHaveBeenCalled();
        expect(spy.mock.calls[0][1]).toBe('Etkinlik Kaydı Onayı');
    });
});
