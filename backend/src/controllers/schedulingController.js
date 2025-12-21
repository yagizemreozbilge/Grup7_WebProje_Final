const prisma = require('../prisma');
const SchedulingService = require('../services/SchedulingService');

const schedulingController = {
  // Generate schedule (admin only)
  async generateSchedule(req, res, next) {
    try {
      const { sections, classrooms, timeSlots, instructorPreferences } = req.body;

      // Get sections from database if IDs provided
      let sectionData = sections;
      if (sections && Array.isArray(sections) && sections.length > 0 && typeof sections[0] === 'string') {
        sectionData = await prisma.course_sections.findMany({
          where: {
            id: { in: sections },
            deleted_at: null
          },
          include: {
            courses: true
          }
        });
      }

      // Get classrooms from database if IDs provided
      let classroomData = classrooms;
      if (classrooms && Array.isArray(classrooms) && classrooms.length > 0 && typeof classrooms[0] === 'string') {
        classroomData = await prisma.classrooms.findMany({
          where: {
            id: { in: classrooms }
          }
        });
      }

      // Default time slots if not provided
      const defaultTimeSlots = [
        { day: 'monday', start: '09:00', end: '10:30' },
        { day: 'monday', start: '10:45', end: '12:15' },
        { day: 'monday', start: '13:30', end: '15:00' },
        { day: 'monday', start: '15:15', end: '16:45' },
        { day: 'tuesday', start: '09:00', end: '10:30' },
        { day: 'tuesday', start: '10:45', end: '12:15' },
        { day: 'tuesday', start: '13:30', end: '15:00' },
        { day: 'tuesday', start: '15:15', end: '16:45' },
        { day: 'wednesday', start: '09:00', end: '10:30' },
        { day: 'wednesday', start: '10:45', end: '12:15' },
        { day: 'wednesday', start: '13:30', end: '15:00' },
        { day: 'wednesday', start: '15:15', end: '16:45' },
        { day: 'thursday', start: '09:00', end: '10:30' },
        { day: 'thursday', start: '10:45', end: '12:15' },
        { day: 'thursday', start: '13:30', end: '15:00' },
        { day: 'thursday', start: '15:15', end: '16:45' },
        { day: 'friday', start: '09:00', end: '10:30' },
        { day: 'friday', start: '10:45', end: '12:15' },
        { day: 'friday', start: '13:30', end: '15:00' },
        { day: 'friday', start: '15:15', end: '16:45' }
      ];

      const slots = timeSlots || defaultTimeSlots;

      // Generate schedule
      const schedule = await SchedulingService.generateSchedule(
        sectionData,
        classroomData,
        slots,
        instructorPreferences || {}
      );

      // Save to database
      await SchedulingService.saveSchedule(null, schedule);

      res.status(200).json({
        success: true,
        data: schedule,
        message: 'Schedule generated successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Get schedule by ID
  async getSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;

      // For now, return all schedules
      // In production, implement schedule versioning
      const schedules = await prisma.schedule.findMany({
        include: {
          section: {
            include: {
              courses: true
            }
          },
          classroom: true
        }
      });

      res.status(200).json({ success: true, data: schedules });
    } catch (error) {
      next(error);
    }
  },

  // Get my schedule
  async getMySchedule(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      const weeklySchedule = await SchedulingService.getUserSchedule(userId, userRole);

      res.status(200).json({ success: true, data: weeklySchedule });
    } catch (error) {
      next(error);
    }
  },

  // Get my schedule as iCal
  async getMyScheduleICal(req, res, next) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { startDate, endDate } = req.query;

      const weeklySchedule = await SchedulingService.getUserSchedule(userId, userRole);

      const start = startDate ? new Date(startDate) : new Date();
      const end = endDate ? new Date(endDate) : new Date(start.getTime() + 16 * 7 * 24 * 60 * 60 * 1000); // 16 weeks

      const ical = SchedulingService.generateICal(weeklySchedule, start, end);

      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="schedule.ics"');
      res.status(200).send(ical);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = schedulingController;



