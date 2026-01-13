const prisma = require('../prisma');
const socketService = require('../services/socketService');

const sensorsController = {
  // GET /api/v1/sensors - Get all sensors
  async getSensors(req, res, next) {
    try {
      const sensors = await prisma.sensor.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      res.status(200).json({
        success: true,
        data: sensors
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/sensors/:id/data - Get sensor data with filters
  async getSensorData(req, res, next) {
    try {
      const { id } = req.params;
      const { startDate, endDate, aggregation, interval } = req.query;

      // Verify sensor exists
      const sensor = await prisma.sensor.findUnique({
        where: { id }
      });

      if (!sensor) {
        return res.status(404).json({
          success: false,
          error: 'Sensor not found'
        });
      }

      const where = {
        sensorId: id
      };

      // Date range filter
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      let data;

      if (aggregation && interval) {
        // Aggregated data
        const allData = await prisma.sensorData.findMany({
          where,
          orderBy: {
            timestamp: 'asc'
          }
        });

        // Group by interval
        const grouped = {};
        allData.forEach(item => {
          const date = new Date(item.timestamp);
          let key;

          if (interval === 'hour') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00:00`;
          } else if (interval === 'day') {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          } else {
            return; // Invalid interval
          }

          if (!grouped[key]) {
            grouped[key] = [];
          }
          grouped[key].push(parseFloat(item.value));
        });

        // Calculate aggregation
        data = Object.keys(grouped).map(key => {
          const values = grouped[key];
          let aggregatedValue;

          switch (aggregation) {
            case 'avg':
              aggregatedValue = values.reduce((sum, v) => sum + v, 0) / values.length;
              break;
            case 'min':
              aggregatedValue = Math.min(...values);
              break;
            case 'max':
              aggregatedValue = Math.max(...values);
              break;
            case 'sum':
              aggregatedValue = values.reduce((sum, v) => sum + v, 0);
              break;
            default:
              aggregatedValue = values[values.length - 1]; // Last value
          }

          return {
            timestamp: key,
            value: Math.round(aggregatedValue * 10000) / 10000,
            unit: sensor.unit,
            count: values.length
          };
        }).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      } else {
        // Raw data
        data = await prisma.sensorData.findMany({
          where,
          orderBy: {
            timestamp: 'desc'
          },
          take: 1000 // Limit to prevent huge responses
        });

        data = data.map(item => ({
          id: item.id,
          value: parseFloat(item.value),
          unit: item.unit,
          timestamp: item.timestamp.toISOString ? item.timestamp.toISOString() : item.timestamp,
          metadata: item.metadata
        }));
      }

      res.status(200).json({
        success: true,
        data: {
          sensor: {
            id: sensor.id,
            sensorId: sensor.sensorId,
            name: sensor.name,
            type: sensor.type,
            location: sensor.location,
            unit: sensor.unit
          },
          data,
          count: data.length
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/v1/sensors - Create sensor (admin only)
  async createSensor(req, res, next) {
    try {
      const { sensorId, name, type, location, unit, metadata } = req.body;

      if (!sensorId || !name || !type || !unit) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: sensorId, name, type, unit'
        });
      }

      const sensor = await prisma.sensor.create({
        data: {
          sensorId,
          name,
          type,
          location,
          unit,
          metadata: metadata || {}
        }
      });

      res.status(201).json({
        success: true,
        data: sensor
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(400).json({
          success: false,
          error: 'Sensor with this sensorId already exists'
        });
      }
      next(error);
    }
  },

  // POST /api/v1/sensors/:id/data - Add sensor data
  async addSensorData(req, res, next) {
    try {
      const { id } = req.params;
      const { value, metadata } = req.body;

      if (value === undefined || value === null) {
        return res.status(400).json({
          success: false,
          error: 'Value is required'
        });
      }

      // Verify sensor exists
      const sensor = await prisma.sensor.findUnique({
        where: { id }
      });

      if (!sensor) {
        return res.status(404).json({
          success: false,
          error: 'Sensor not found'
        });
      }

      const sensorData = await prisma.sensorData.create({
        data: {
          sensorId: id,
          value: parseFloat(value),
          unit: sensor.unit,
          metadata: metadata || {}
        }
      });

      // Broadcast real-time data via WebSocket
      socketService.broadcastSensorData(id, {
        sensorId: sensor.sensorId,
        value: parseFloat(value),
        unit: sensor.unit,
        timestamp: sensorData.timestamp
      });

      res.status(201).json({
        success: true,
        data: sensorData
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/sensors/:id - Get sensor details
  async getSensorById(req, res, next) {
    try {
      const { id } = req.params;

      const sensor = await prisma.sensor.findUnique({
        where: { id },
        include: {
          sensorData: {
            orderBy: {
              timestamp: 'desc'
            },
            take: 1
          }
        }
      });

      if (!sensor) {
        return res.status(404).json({
          success: false,
          error: 'Sensor not found'
        });
      }

      const latestReading = sensor.sensorData[0] || null;

      res.status(200).json({
        success: true,
        data: {
          ...sensor,
          latestReading: latestReading ? {
            value: parseFloat(latestReading.value),
            unit: latestReading.unit,
            timestamp: latestReading.timestamp
          } : null
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = sensorsController;

