// ============================================================================
// SENSORS CONTROLLER TESTS
// ============================================================================
jest.mock('../../../src/services/socketService');
jest.mock('../../../src/prisma', () => ({
    sensor: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn()
    },
    sensorData: {
        findMany: jest.fn(),
        create: jest.fn()
    }
}));

const sensorsController = require('../../../src/controllers/sensorsController');
const socketService = require('../../../src/services/socketService');
const prisma = require('../../../src/prisma');

describe('Sensors Controller Unit Tests', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 'user123', role: 'admin' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getSensors', () => {
        it('should get all sensors successfully (200)', async () => {
            const mockSensors = [
                {
                    id: 'sens1',
                    sensorId: 'SENS001',
                    name: 'Temperature Sensor',
                    type: 'temperature',
                    location: 'Building A',
                    isActive: true
                }
            ];

            prisma.sensor.findMany.mockResolvedValue(mockSensors);

            await sensorsController.getSensors(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSensors
            });
        });

        it('should filter active sensors only', async () => {
            prisma.sensor.findMany.mockResolvedValue([]);

            await sensorsController.getSensors(req, res, next);

            expect(prisma.sensor.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true }
                })
            );
        });

        it('should handle database error', async () => {
            const error = new Error('DB Error');
            prisma.sensor.findMany.mockRejectedValue(error);

            await sensorsController.getSensors(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getSensorData', () => {
        it('should get sensor data successfully (200)', async () => {
            req.params = { id: 'sens1' };
            const mockSensor = {
                id: 'sens1',
                sensorId: 'SENS001',
                name: 'Temperature',
                type: 'temperature',
                location: 'Building A',
                unit: 'C'
            };
            const mockData = [
                {
                    id: 'data1',
                    value: '25.5',
                    unit: 'C',
                    timestamp: new Date(),
                    metadata: {}
                }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    sensor: expect.any(Object),
                    data: expect.any(Array),
                    count: expect.any(Number)
                })
            });
        });

        it('should return 404 if sensor not found', async () => {
            req.params = { id: 'sens1' };
            prisma.sensor.findUnique.mockResolvedValue(null);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sensor not found'
            });
        });

        it('should filter by date range', async () => {
            req.params = { id: 'sens1' };
            req.query = { startDate: '2024-01-01', endDate: '2024-12-31' };
            const mockSensor = { id: 'sens1', unit: 'C' };

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue([]);

            await sensorsController.getSensorData(req, res, next);

            expect(prisma.sensorData.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        timestamp: expect.any(Object)
                    })
                })
            );
        });

        it('should aggregate data by hour interval with avg', async () => {
            req.params = { id: 'sens1' };
            req.query = { aggregation: 'avg', interval: 'hour' };
            const mockSensor = { id: 'sens1', unit: 'C' };
            const mockData = [
                {
                    value: '25.5',
                    timestamp: new Date('2024-01-01T10:00:00')
                },
                {
                    value: '26.0',
                    timestamp: new Date('2024-01-01T10:30:00')
                }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.data.data).toBeDefined();
        });

        it('should aggregate data by day interval with min', async () => {
            req.params = { id: 'sens1' };
            req.query = { aggregation: 'min', interval: 'day' };
            const mockSensor = { id: 'sens1', unit: 'C' };
            const mockData = [
                { value: '25.5', timestamp: new Date('2024-01-01T10:00:00') },
                { value: '24.0', timestamp: new Date('2024-01-01T14:00:00') }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should aggregate data with max', async () => {
            req.params = { id: 'sens1' };
            req.query = { aggregation: 'max', interval: 'hour' };
            const mockSensor = { id: 'sens1', unit: 'C' };
            const mockData = [
                { value: '25.5', timestamp: new Date('2024-01-01T10:00:00') },
                { value: '26.0', timestamp: new Date('2024-01-01T10:30:00') }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should aggregate data with sum', async () => {
            req.params = { id: 'sens1' };
            req.query = { aggregation: 'sum', interval: 'hour' };
            const mockSensor = { id: 'sens1', unit: 'C' };
            const mockData = [
                { value: '25.5', timestamp: new Date('2024-01-01T10:00:00') },
                { value: '26.0', timestamp: new Date('2024-01-01T10:30:00') }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle invalid interval', async () => {
            req.params = { id: 'sens1' };
            req.query = { aggregation: 'avg', interval: 'invalid' };
            const mockSensor = { id: 'sens1', unit: 'C' };
            const mockData = [
                { value: '25.5', timestamp: new Date('2024-01-01T10:00:00') }
            ];

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.findMany.mockResolvedValue(mockData);

            await sensorsController.getSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('should handle database error', async () => {
            req.params = { id: 'sens1' };
            const error = new Error('DB Error');
            prisma.sensor.findUnique.mockRejectedValue(error);

            await sensorsController.getSensorData(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('createSensor', () => {
        it('should create sensor successfully (201)', async () => {
            req.body = {
                sensorId: 'SENS001',
                name: 'Temperature Sensor',
                type: 'temperature',
                location: 'Building A',
                unit: 'C'
            };

            const mockSensor = {
                id: 'sens1',
                ...req.body,
                isActive: true
            };

            prisma.sensor.create.mockResolvedValue(mockSensor);

            await sensorsController.createSensor(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockSensor
            });
        });

        it('should return 400 if required fields missing', async () => {
            req.body = { name: 'Sensor' };

            await sensorsController.createSensor(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Missing required fields: sensorId, name, type, unit'
            });
        });

        it('should return 400 if sensorId already exists', async () => {
            req.body = {
                sensorId: 'SENS001',
                name: 'Sensor',
                type: 'temperature',
                unit: 'C'
            };

            const error = { code: 'P2002' };
            prisma.sensor.create.mockRejectedValue(error);

            await sensorsController.createSensor(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sensor with this sensorId already exists'
            });
        });

        it('should handle database error', async () => {
            req.body = {
                sensorId: 'SENS001',
                name: 'Sensor',
                type: 'temperature',
                unit: 'C'
            };
            const error = new Error('DB Error');
            prisma.sensor.create.mockRejectedValue(error);

            await sensorsController.createSensor(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('addSensorData', () => {
        it('should add sensor data successfully (201)', async () => {
            req.params = { id: 'sens1' };
            req.body = { value: 25.5, metadata: {} };

            const mockSensor = {
                id: 'sens1',
                sensorId: 'SENS001',
                unit: 'C'
            };
            const mockData = {
                id: 'data1',
                sensorId: 'sens1',
                value: 25.5,
                unit: 'C',
                timestamp: new Date()
            };

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);
            prisma.sensorData.create.mockResolvedValue(mockData);

            await sensorsController.addSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(socketService.broadcastSensorData).toHaveBeenCalled();
        });

        it('should return 400 if value missing', async () => {
            req.params = { id: 'sens1' };
            req.body = { metadata: {} };

            await sensorsController.addSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Value is required'
            });
        });

        it('should return 404 if sensor not found', async () => {
            req.params = { id: 'sens1' };
            req.body = { value: 25.5 };
            prisma.sensor.findUnique.mockResolvedValue(null);

            await sensorsController.addSensorData(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sensor not found'
            });
        });

        it('should handle database error', async () => {
            req.params = { id: 'sens1' };
            req.body = { value: 25.5 };
            const error = new Error('DB Error');
            prisma.sensor.findUnique.mockRejectedValue(error);

            await sensorsController.addSensorData(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('getSensorById', () => {
        it('should get sensor by id successfully (200)', async () => {
            req.params = { id: 'sens1' };
            const mockSensor = {
                id: 'sens1',
                sensorId: 'SENS001',
                name: 'Temperature',
                sensorData: [
                    {
                        value: '25.5',
                        unit: 'C',
                        timestamp: new Date()
                    }
                ]
            };

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);

            await sensorsController.getSensorById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: expect.objectContaining({
                    id: 'sens1',
                    latestReading: expect.any(Object)
                })
            });
        });

        it('should return 404 if sensor not found', async () => {
            req.params = { id: 'sens1' };
            prisma.sensor.findUnique.mockResolvedValue(null);

            await sensorsController.getSensorById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                error: 'Sensor not found'
            });
        });

        it('should handle sensor with no data', async () => {
            req.params = { id: 'sens1' };
            const mockSensor = {
                id: 'sens1',
                sensorId: 'SENS001',
                sensorData: []
            };

            prisma.sensor.findUnique.mockResolvedValue(mockSensor);

            await sensorsController.getSensorById(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            const response = res.json.mock.calls[0][0];
            expect(response.data.latestReading).toBeNull();
        });

        it('should handle database error', async () => {
            req.params = { id: 'sens1' };
            const error = new Error('DB Error');
            prisma.sensor.findUnique.mockRejectedValue(error);

            await sensorsController.getSensorById(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });
});

