const prisma = require('../prisma');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const analyticsController = {
  // GET /api/v1/analytics/dashboard - Admin dashboard statistics
  async getDashboard(req, res, next) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Total users
      const totalUsers = await prisma.user.count();

      // Active users today (users who logged in or performed any action)
      const activeUsersToday = await prisma.user.count({
        where: {
          updatedAt: {
            gte: today
          }
        }
      });

      // Total courses
      const totalCourses = await prisma.courses.count({
        where: {
          is_active: true
        }
      });

      // Total enrollments
      const totalEnrollments = await prisma.enrollments.count({
        where: {
          status: 'active'
        }
      });

      // Attendance rate calculation
      const totalAttendanceRecords = await prisma.attendance_records.count();
      const totalSessions = await prisma.attendance_sessions.count();
      const totalEnrollmentsForAttendance = await prisma.enrollments.count({
        where: {
          status: 'active'
        }
      });

      let attendanceRate = 0;
      if (totalSessions > 0 && totalEnrollmentsForAttendance > 0) {
        const expectedRecords = totalSessions * totalEnrollmentsForAttendance;
        attendanceRate = expectedRecords > 0 
          ? (totalAttendanceRecords / expectedRecords) * 100 
          : 0;
      }

      // Meal reservations today
      const mealReservationsToday = await prisma.mealReservation.count({
        where: {
          date: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      // Upcoming events
      const upcomingEvents = await prisma.event.count({
        where: {
          date: {
            gte: today
          },
          status: 'published'
        }
      });

      // System health (simple check)
      const systemHealth = 'healthy'; // Can be enhanced with actual health checks

      res.status(200).json({
        success: true,
        data: {
          totalUsers,
          activeUsersToday,
          totalCourses,
          totalEnrollments,
          attendanceRate: Math.round(attendanceRate * 10) / 10,
          mealReservationsToday,
          upcomingEvents,
          systemHealth
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/analytics/academic-performance
  async getAcademicPerformance(req, res, next) {
    try {
      // Average GPA by department
      const gpaByDepartment = await prisma.student.groupBy({
        by: ['departmentId'],
        _avg: {
          gpa: true
        },
        where: {
          gpa: {
            not: null
          }
        }
      });

      const departments = await prisma.department.findMany();
      const departmentMap = {};
      departments.forEach(dept => {
        departmentMap[dept.id] = dept.name;
      });

      const avgGpaByDepartment = gpaByDepartment.map(item => ({
        departmentId: item.departmentId,
        departmentName: departmentMap[item.departmentId] || 'Unknown',
        averageGPA: item._avg.gpa ? parseFloat(item._avg.gpa) : 0
      }));

      // Grade distribution
      const enrollments = await prisma.enrollments.findMany({
        where: {
          letter_grade: {
            not: null
          }
        },
        select: {
          letter_grade: true
        }
      });

      const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      enrollments.forEach(enrollment => {
        const grade = enrollment.letter_grade?.toUpperCase();
        if (grade && gradeCounts.hasOwnProperty(grade)) {
          gradeCounts[grade]++;
        }
      });

      const totalGrades = enrollments.length;
      const gradeDistribution = Object.keys(gradeCounts).map(grade => ({
        grade,
        count: gradeCounts[grade],
        percentage: totalGrades > 0 ? (gradeCounts[grade] / totalGrades) * 100 : 0
      }));

      // Pass/fail rates
      const passCount = enrollments.filter(e => {
        const grade = e.letter_grade?.toUpperCase();
        return grade && ['A', 'B', 'C', 'D'].includes(grade);
      }).length;
      const failCount = enrollments.filter(e => {
        const grade = e.letter_grade?.toUpperCase();
        return grade === 'F';
      }).length;

      const passRate = totalGrades > 0 ? (passCount / totalGrades) * 100 : 0;
      const failRate = totalGrades > 0 ? (failCount / totalGrades) * 100 : 0;

      // Top performing students
      const topStudents = await prisma.student.findMany({
        where: {
          gpa: {
            not: null
          }
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          },
          department: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          gpa: 'desc'
        },
        take: 10
      });

      const topPerformingStudents = topStudents.map(student => ({
        studentId: student.id,
        studentNumber: student.studentNumber,
        name: student.user.fullName,
        email: student.user.email,
        department: student.department.name,
        gpa: student.gpa ? parseFloat(student.gpa) : 0
      }));

      // At-risk students (GPA < 2.0)
      const atRiskStudents = await prisma.student.findMany({
        where: {
          gpa: {
            lt: 2.0
          }
        },
        include: {
          user: {
            select: {
              fullName: true,
              email: true
            }
          },
          department: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          gpa: 'asc'
        }
      });

      const atRisk = atRiskStudents.map(student => ({
        studentId: student.id,
        studentNumber: student.studentNumber,
        name: student.user.fullName,
        email: student.user.email,
        department: student.department.name,
        gpa: student.gpa ? parseFloat(student.gpa) : 0
      }));

      res.status(200).json({
        success: true,
        data: {
          averageGpaByDepartment: avgGpaByDepartment,
          gradeDistribution,
          passRate: Math.round(passRate * 10) / 10,
          failRate: Math.round(failRate * 10) / 10,
          topPerformingStudents,
          atRiskStudents: atRisk
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/analytics/attendance
  async getAttendanceAnalytics(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      // Attendance rate by course
      const courses = await prisma.courses.findMany({
        where: {
          is_active: true
        },
        include: {
          sections: {
            include: {
              attendanceSessions: {
                include: {
                  attendanceRecords: true
                }
              },
              enrollments: true
            }
          }
        }
      });

      const attendanceByCourse = courses.map(course => {
        let totalSessions = 0;
        let totalRecords = 0;
        let totalEnrollments = 0;

        course.sections.forEach(section => {
          totalSessions += section.attendanceSessions.length;
          section.attendanceSessions.forEach(session => {
            totalRecords += session.attendanceRecords.length;
          });
          totalEnrollments += section.enrollments.length;
        });

        const expectedRecords = totalSessions * totalEnrollments;
        const attendanceRate = expectedRecords > 0 
          ? (totalRecords / expectedRecords) * 100 
          : 0;

        return {
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          totalSessions,
          totalRecords,
          totalEnrollments,
          attendanceRate: Math.round(attendanceRate * 10) / 10
        };
      });

      // Attendance trends over time
      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      const sessions = await prisma.attendance_sessions.findMany({
        where: {
          date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        include: {
          attendanceRecords: true,
          section: {
            include: {
              enrollments: true
            }
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      const trends = {};
      sessions.forEach(session => {
        const dateKey = session.date.toISOString().split('T')[0];
        if (!trends[dateKey]) {
          trends[dateKey] = {
            date: dateKey,
            totalSessions: 0,
            totalRecords: 0,
            totalExpected: 0
          };
        }
        trends[dateKey].totalSessions++;
        trends[dateKey].totalRecords += session.attendanceRecords.length;
        trends[dateKey].totalExpected += session.section.enrollments.length;
      });

      const attendanceTrends = Object.values(trends).map(trend => ({
        date: trend.date,
        attendanceRate: trend.totalExpected > 0 
          ? Math.round((trend.totalRecords / trend.totalExpected) * 100 * 10) / 10 
          : 0
      }));

      // Students with critical absence rates
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
          enrollments: true,
          user: {
            select: {
              fullName: true,
              email: true
            }
          },
          department: {
            select: {
              name: true
            }
          }
        }
      });

      const criticalAbsenceStudents = students
        .map(student => {
          const studentEnrollments = student.enrollments.filter(e => e.status === 'active');
          let totalExpected = 0;
          let totalPresent = 0;

          studentEnrollments.forEach(enrollment => {
            const section = enrollment.section;
            if (section && section.attendanceSessions) {
              totalExpected += section.attendanceSessions.length;
            }
          });

          totalPresent = student.attendanceRecords.length;
          const attendanceRate = totalExpected > 0 
            ? (totalPresent / totalExpected) * 100 
            : 0;

          return {
            studentId: student.id,
            studentNumber: student.studentNumber,
            name: student.user.fullName,
            email: student.user.email,
            department: student.department.name,
            attendanceRate: Math.round(attendanceRate * 10) / 10,
            totalPresent,
            totalExpected
          };
        })
        .filter(s => s.attendanceRate < 70)
        .sort((a, b) => a.attendanceRate - b.attendanceRate);

      // Courses with low attendance
      const lowAttendanceCourses = attendanceByCourse
        .filter(c => c.attendanceRate < 70)
        .sort((a, b) => a.attendanceRate - b.attendanceRate);

      res.status(200).json({
        success: true,
        data: {
          attendanceByCourse,
          attendanceTrends,
          criticalAbsenceStudents,
          lowAttendanceCourses
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/analytics/meal-usage
  async getMealUsage(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);

      // Daily meal counts
      const reservations = await prisma.mealReservation.findMany({
        where: {
          date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        },
        orderBy: {
          date: 'asc'
        }
      });

      const dailyMealCounts = {};
      reservations.forEach(reservation => {
        const dateKey = reservation.date.toISOString().split('T')[0];
        if (!dailyMealCounts[dateKey]) {
          dailyMealCounts[dateKey] = {
            date: dateKey,
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            total: 0
          };
        }
        dailyMealCounts[dateKey][reservation.mealType]++;
        dailyMealCounts[dateKey].total++;
      });

      const dailyCounts = Object.values(dailyMealCounts);

      // Cafeteria utilization
      const cafeterias = await prisma.cafeteria.findMany({
        include: {
          reservations: {
            where: {
              date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
            }
          }
        }
      });

      const cafeteriaUtilization = cafeterias.map(cafeteria => ({
        cafeteriaId: cafeteria.id,
        name: cafeteria.name,
        capacity: cafeteria.capacity,
        totalReservations: cafeteria.reservations.length,
        utilizationRate: cafeteria.capacity > 0 
          ? Math.round((cafeteria.reservations.length / cafeteria.capacity) * 100 * 10) / 10 
          : 0
      }));

      // Peak hours (by meal type)
      const peakHours = {
        breakfast: {},
        lunch: {},
        dinner: {}
      };

      reservations.forEach(reservation => {
        const hour = new Date(reservation.createdAt).getHours();
        const mealType = reservation.mealType;
        if (!peakHours[mealType][hour]) {
          peakHours[mealType][hour] = 0;
        }
        peakHours[mealType][hour]++;
      });

      const peakHoursData = Object.keys(peakHours).map(mealType => {
        const hours = Object.keys(peakHours[mealType]).map(hour => ({
          hour: parseInt(hour),
          count: peakHours[mealType][hour]
        }));
        const maxCount = Math.max(...hours.map(h => h.count), 0);
        const peakHour = hours.find(h => h.count === maxCount);
        return {
          mealType,
          peakHour: peakHour ? peakHour.hour : null,
          peakCount: maxCount,
          hourlyDistribution: hours.sort((a, b) => a.hour - b.hour)
        };
      });

      // Revenue (for paid users)
      const transactions = await prisma.transaction.findMany({
        where: {
          referenceType: 'meal_reservation',
          type: 'debit',
          createdAt: Object.keys(dateFilter).length > 0 ? dateFilter : undefined
        }
      });

      const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

      res.status(200).json({
        success: true,
        data: {
          dailyMealCounts: dailyCounts,
          cafeteriaUtilization,
          peakHours: peakHoursData,
          totalRevenue: Math.round(totalRevenue * 100) / 100
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/analytics/events
  async getEventAnalytics(req, res, next) {
    try {
      // Most popular events
      const events = await prisma.event.findMany({
        include: {
          registrations: true
        },
        orderBy: {
          registeredCount: 'desc'
        }
      });

      const popularEvents = events
        .map(event => ({
          eventId: event.id,
          title: event.title,
          category: event.category,
          registeredCount: event.registeredCount,
          capacity: event.capacity,
          registrationRate: event.capacity > 0 
            ? Math.round((event.registeredCount / event.capacity) * 100 * 10) / 10 
            : 0
        }))
        .slice(0, 10);

      // Registration rates
      const totalEvents = events.length;
      const totalRegistrations = events.reduce((sum, e) => sum + e.registeredCount, 0);
      const averageRegistrationRate = totalEvents > 0 
        ? Math.round((totalRegistrations / totalEvents) * 10) / 10 
        : 0;

      // Check-in rates
      const eventsWithCheckIns = events.map(event => {
        const checkedIn = event.registrations.filter(r => r.checkedIn).length;
        const checkInRate = event.registrations.length > 0 
          ? Math.round((checkedIn / event.registrations.length) * 100 * 10) / 10 
          : 0;
        return {
          eventId: event.id,
          title: event.title,
          totalRegistrations: event.registrations.length,
          checkedIn,
          checkInRate
        };
      });

      const averageCheckInRate = eventsWithCheckIns.length > 0
        ? eventsWithCheckIns.reduce((sum, e) => sum + e.checkInRate, 0) / eventsWithCheckIns.length
        : 0;

      // Category breakdown
      const categoryBreakdown = {};
      events.forEach(event => {
        if (!categoryBreakdown[event.category]) {
          categoryBreakdown[event.category] = {
            category: event.category,
            totalEvents: 0,
            totalRegistrations: 0
          };
        }
        categoryBreakdown[event.category].totalEvents++;
        categoryBreakdown[event.category].totalRegistrations += event.registeredCount;
      });

      const categoryData = Object.values(categoryBreakdown).map(cat => ({
        ...cat,
        averageRegistrations: cat.totalEvents > 0 
          ? Math.round((cat.totalRegistrations / cat.totalEvents) * 10) / 10 
          : 0
      }));

      res.status(200).json({
        success: true,
        data: {
          popularEvents,
          averageRegistrationRate,
          averageCheckInRate: Math.round(averageCheckInRate * 10) / 10,
          eventsWithCheckIns,
          categoryBreakdown: categoryData
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/v1/analytics/export/:type
  async exportReport(req, res, next) {
    try {
      const { type } = req.params;
      const { format = 'excel' } = req.query;

      if (!['academic', 'attendance', 'meal', 'event'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
      }

      if (format === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`${type}_report`);

        let data = [];
        let headers = [];

        switch (type) {
          case 'academic':
            data = await this.getAcademicPerformanceData();
            headers = ['Department', 'Average GPA'];
            break;
          case 'attendance':
            data = await this.getAttendanceData();
            headers = ['Course Code', 'Course Name', 'Total Sessions', 'Total Records', 'Attendance Rate'];
            break;
          case 'meal':
            data = await this.getMealData();
            headers = ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Total'];
            break;
          case 'event':
            data = await this.getEventData();
            headers = ['Event', 'Category', 'Registrations', 'Capacity', 'Registration Rate'];
            break;
        }

        worksheet.addRow(headers);
        data.forEach(row => {
          worksheet.addRow(Array.isArray(row) ? row : Object.values(row));
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
      } else if (format === 'csv') {
        // CSV export
        let data = [];
        let headers = [];

        switch (type) {
          case 'academic':
            data = await this.getAcademicPerformanceData();
            headers = ['Department', 'Average GPA'];
            break;
          case 'attendance':
            data = await this.getAttendanceData();
            headers = ['Course Code', 'Course Name', 'Total Sessions', 'Total Records', 'Attendance Rate'];
            break;
          case 'meal':
            data = await this.getMealData();
            headers = ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Total'];
            break;
          case 'event':
            data = await this.getEventData();
            headers = ['Event', 'Category', 'Registrations', 'Capacity', 'Registration Rate'];
            break;
        }

        const csv = [
          headers.join(','),
          ...data.map(row => (Array.isArray(row) ? row : Object.values(row)).join(','))
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
        res.send(csv);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid format. Use excel or csv'
        });
      }
    } catch (error) {
      next(error);
    }
  },

  // Helper methods for export
  async getAcademicPerformanceData() {
    try {
      const gpaByDepartment = await prisma.student.groupBy({
        by: ['departmentId'],
        _avg: { gpa: true }
      });
      const departments = await prisma.department.findMany();
      const deptMap = {};
      departments.forEach(dept => { deptMap[dept.id] = dept.name; });
      
      return gpaByDepartment.map(item => [
        deptMap[item.departmentId] || 'Unknown',
        item._avg.gpa ? parseFloat(item._avg.gpa).toFixed(2) : '0.00'
      ]);
    } catch (error) {
      return [];
    }
  },

  async getAttendanceData() {
    try {
      const courses = await prisma.courses.findMany({
        where: { is_active: true },
        include: {
          sections: {
            include: {
              attendanceSessions: true,
              enrollments: true
            }
          }
        }
      });
      
      return courses.map(course => {
        let totalSessions = 0;
        let totalRecords = 0;
        course.sections.forEach(section => {
          totalSessions += section.attendanceSessions.length;
          totalRecords += section.attendanceSessions.reduce((sum, s) => sum + (s.attendanceRecords?.length || 0), 0);
        });
        const rate = totalSessions > 0 ? (totalRecords / totalSessions) * 100 : 0;
        return [course.code, course.name, totalSessions, totalRecords, rate.toFixed(2) + '%'];
      });
    } catch (error) {
      return [];
    }
  },

  async getMealData() {
    try {
      const reservations = await prisma.mealReservation.findMany({
        orderBy: { date: 'asc' }
      });
      
      const dailyData = {};
      reservations.forEach(r => {
        const dateKey = r.date.toISOString().split('T')[0];
        if (!dailyData[dateKey]) {
          dailyData[dateKey] = { date: dateKey, breakfast: 0, lunch: 0, dinner: 0, total: 0 };
        }
        dailyData[dateKey][r.mealType]++;
        dailyData[dateKey].total++;
      });
      
      return Object.values(dailyData).map(d => [d.date, d.breakfast, d.lunch, d.dinner, d.total]);
    } catch (error) {
      return [];
    }
  },

  async getEventData() {
    try {
      const events = await prisma.event.findMany({
        include: { registrations: true }
      });
      
      return events.map(event => [
        event.title,
        event.category,
        event.registeredCount,
        event.capacity,
        event.capacity > 0 ? ((event.registeredCount / event.capacity) * 100).toFixed(2) + '%' : '0%'
      ]);
    } catch (error) {
      return [];
    }
  }
};

module.exports = analyticsController;

