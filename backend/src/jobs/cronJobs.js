const cron = require('node-cron');
const prisma = require('../prisma');
const notificationsController = require('../controllers/notificationsController');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class CronJobs {
  constructor() {
    this.jobs = [];
  }

  start() {
    console.log('Starting cron jobs...');

    // Daily absence warnings - Run at 9 AM every day
    this.jobs.push(
      cron.schedule('0 9 * * *', async () => {
        console.log('Running daily absence warnings...');
        await this.sendDailyAbsenceWarnings();
      })
    );

    // Event reminders - Run every hour
    this.jobs.push(
      cron.schedule('0 * * * *', async () => {
        console.log('Checking for event reminders...');
        await this.sendEventReminders();
      })
    );

    // Meal reservation reminders - Run at 6 PM every day
    this.jobs.push(
      cron.schedule('0 18 * * *', async () => {
        console.log('Sending meal reservation reminders...');
        await this.sendMealReservationReminders();
      })
    );

    // Database backup - Run daily at 2 AM
    this.jobs.push(
      cron.schedule('0 2 * * *', async () => {
        console.log('Running database backup...');
        await this.backupDatabase();
      })
    );

    // Log cleanup - Run weekly on Sunday at 3 AM
    this.jobs.push(
      cron.schedule('0 3 * * 0', async () => {
        console.log('Cleaning up old logs...');
        await this.cleanupLogs();
      })
    );

    // Analytics data aggregation - Run daily at 1 AM
    this.jobs.push(
      cron.schedule('0 1 * * *', async () => {
        console.log('Aggregating analytics data...');
        await this.aggregateAnalyticsData();
      })
    );

    console.log(`Started ${this.jobs.length} cron jobs`);
  }

  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('Stopped all cron jobs');
  }

  // Send daily absence warnings to students with critical absence rates
  async sendDailyAbsenceWarnings() {
    try {
      const students = await prisma.student.findMany({
        include: {
          attendanceRecords: {
            include: {
              session: {
                include: {
                  section: {
                    include: {
                      enrollments: true
                    }
                  }
                }
              }
            }
          },
          enrollments: {
            where: {
              status: 'active'
            },
            include: {
              section: {
                include: {
                  attendanceSessions: true
                }
              }
            }
          },
          user: true
        }
      });

      for (const student of students) {
        let totalExpected = 0;
        let totalPresent = 0;

        student.enrollments.forEach(enrollment => {
          totalExpected += enrollment.section.attendanceSessions.length;
        });

        totalPresent = student.attendanceRecords.length;
        const attendanceRate = totalExpected > 0 
          ? (totalPresent / totalExpected) * 100 
          : 100;

        // Warn if attendance rate is below 70%
        if (attendanceRate < 70 && totalExpected > 0) {
          await notificationsController.createNotification(
            student.userId,
            'attendance',
            'Yoklama Uyarısı',
            `Yoklama oranınız %${Math.round(attendanceRate)} seviyesinde. Lütfen derslere düzenli katılım sağlayın.`,
            {
              attendanceRate: Math.round(attendanceRate),
              totalPresent,
              totalExpected
            }
          );
        }
      }
    } catch (error) {
      console.error('Error sending daily absence warnings:', error);
    }
  }

  // Send event reminders (1 day before and 1 hour before)
  async sendEventReminders() {
    try {
      const now = new Date();
      const oneDayLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      // Events happening in 1 day
      const eventsInOneDay = await prisma.event.findMany({
        where: {
          date: {
            gte: new Date(oneDayLater.getFullYear(), oneDayLater.getMonth(), oneDayLater.getDate()),
            lt: new Date(oneDayLater.getFullYear(), oneDayLater.getMonth(), oneDayLater.getDate() + 1)
          },
          status: 'published'
        },
        include: {
          registrations: {
            include: {
              user: true
            }
          }
        }
      });

      for (const event of eventsInOneDay) {
        for (const registration of event.registrations) {
          await notificationsController.createNotification(
            registration.userId,
            'event',
            'Etkinlik Hatırlatması',
            `${event.title} etkinliği yarın gerçekleşecek. Tarih: ${event.date.toLocaleDateString('tr-TR')}, Saat: ${event.startTime}`,
            {
              eventId: event.id,
              eventTitle: event.title,
              date: event.date,
              startTime: event.startTime
            }
          );
        }
      }

      // Events happening in 1 hour (check time as well)
      const eventsInOneHour = await prisma.event.findMany({
        where: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lte: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          },
          status: 'published'
        },
        include: {
          registrations: {
            include: {
              user: true
            }
          }
        }
      });

      for (const event of eventsInOneHour) {
        const eventHour = parseInt(event.startTime.split(':')[0]);
        const currentHour = now.getHours();

        if (eventHour === currentHour + 1) {
          for (const registration of event.registrations) {
            await notificationsController.createNotification(
              registration.userId,
              'event',
              'Etkinlik Hatırlatması',
              `${event.title} etkinliği 1 saat sonra başlayacak.`,
              {
                eventId: event.id,
                eventTitle: event.title,
                date: event.date,
                startTime: event.startTime
              }
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  }

  // Send meal reservation reminders
  async sendMealReservationReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const reservations = await prisma.mealReservation.findMany({
        where: {
          date: tomorrow
        },
        include: {
          user: true,
          menu: true
        }
      });

      for (const reservation of reservations) {
        await notificationsController.createNotification(
          reservation.userId,
          'meal',
          'Yemek Rezervasyon Hatırlatması',
          `Yarın için ${reservation.mealType} rezervasyonunuz bulunmaktadır.`,
          {
            reservationId: reservation.id,
            mealType: reservation.mealType,
            date: reservation.date
          }
        );
      }
    } catch (error) {
      console.error('Error sending meal reservation reminders:', error);
    }
  }

  // Backup database
  async backupDatabase() {
    return new Promise((resolve, reject) => {
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        console.error('DATABASE_URL not set, skipping backup');
        return resolve();
      }

      // Parse DATABASE_URL
      const url = new URL(dbUrl);
      const dbName = url.pathname.slice(1);
      const dbUser = url.username;
      const dbHost = url.hostname;
      const dbPort = url.port || 5432;

      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

      // Use pg_dump for PostgreSQL
      const command = `PGPASSWORD="${url.password}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -f ${backupFile}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Database backup error:', error);
          return reject(error);
        }
        console.log(`Database backed up to ${backupFile}`);
        resolve();
      });
    });
  }

  // Cleanup old logs
  async cleanupLogs() {
    try {
      const logDir = path.join(__dirname, '../../logs');
      if (!fs.existsSync(logDir)) {
        return;
      }

      const files = fs.readdirSync(logDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      files.forEach(file => {
        const filePath = path.join(logDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up logs:', error);
    }
  }

  // Aggregate analytics data (can be stored in a separate table for faster queries)
  async aggregateAnalyticsData() {
    try {
      // This is a placeholder for analytics aggregation
      // In production, you might want to store aggregated data in a separate table
      // for faster dashboard queries
      console.log('Analytics data aggregation completed');
    } catch (error) {
      console.error('Error aggregating analytics data:', error);
    }
  }
}

module.exports = new CronJobs();

