const prisma = require('../prisma');

class SchedulingService {
  /**
   * Generate schedule using Constraint Satisfaction Problem (CSP) approach
   * with backtracking and heuristics
   */
  static async generateSchedule(sections, classrooms, timeSlots, instructorPreferences = {}) {
    // Hard constraints
    const hardConstraints = {
      noInstructorDoubleBooking: true,
      noClassroomDoubleBooking: true,
      noStudentScheduleConflict: true,
      classroomCapacity: true,
      classroomFeatures: true
    };

    // Soft constraints (for optimization)
    const softConstraints = {
      respectInstructorPreferences: true,
      minimizeGaps: true,
      distributeEvenly: true,
      preferMorningForRequired: true
    };

    // Initialize schedule
    const schedule = [];
    const assignments = new Map(); // section_id -> schedule entry

    // Get all enrollments for student conflict checking
    const allEnrollments = await prisma.enrollments.findMany({
      where: {
        section_id: { in: sections.map(s => s.id) },
        status: 'active'
      },
      include: {
        student: true
      }
    });

    // Group enrollments by student
    const studentSections = new Map();
    allEnrollments.forEach(enrollment => {
      const studentId = enrollment.student_id;
      if (!studentSections.has(studentId)) {
        studentSections.set(studentId, []);
      }
      studentSections.get(studentId).push(enrollment.section_id);
    });

    // Backtracking algorithm
    const backtrack = async (sectionIndex) => {
      if (sectionIndex >= sections.length) {
        return true; // All sections scheduled
      }

      const section = sections[sectionIndex];
      
      // Try each time slot
      for (const timeSlot of timeSlots) {
        // Try each classroom
        for (const classroom of classrooms) {
          // Check hard constraints
          if (!this.checkHardConstraints(
            section,
            classroom,
            timeSlot,
            assignments,
            studentSections,
            hardConstraints
          )) {
            continue;
          }

          // Create assignment
          const assignment = {
            section_id: section.id,
            day_of_week: timeSlot.day,
            start_time: timeSlot.start,
            end_time: timeSlot.end,
            classroom_id: classroom.id
          };

          // Add to assignments
          assignments.set(section.id, assignment);

          // Recursively try next section
          if (await backtrack(sectionIndex + 1)) {
            return true;
          }

          // Backtrack
          assignments.delete(section.id);
        }
      }

      return false; // No valid assignment found
    };

    // Start backtracking
    const success = await backtrack(0);

    if (!success) {
      throw new Error('Could not generate valid schedule with given constraints');
    }

    // Convert assignments to schedule entries
    assignments.forEach((assignment, sectionId) => {
      schedule.push(assignment);
    });

    // Optimize with soft constraints
    const optimizedSchedule = this.optimizeSchedule(
      schedule,
      sections,
      classrooms,
      timeSlots,
      instructorPreferences,
      softConstraints
    );

    return optimizedSchedule;
  }

  /**
   * Check hard constraints
   */
  static checkHardConstraints(section, classroom, timeSlot, assignments, studentSections, constraints) {
    // 1. No instructor double-booking
    if (constraints.noInstructorDoubleBooking) {
      for (const [existingSectionId, existingAssignment] of assignments) {
        if (existingAssignment.day_of_week === timeSlot.day &&
            existingAssignment.start_time === timeSlot.start &&
            existingAssignment.end_time === timeSlot.end) {
          // Check if same instructor
          const existingSection = sections.find(s => s.id === existingSectionId);
          if (existingSection && existingSection.instructor_id === section.instructor_id) {
            return false;
          }
        }
      }
    }

    // 2. No classroom double-booking
    if (constraints.noClassroomDoubleBooking) {
      for (const [existingSectionId, existingAssignment] of assignments) {
        if (existingAssignment.classroom_id === classroom.id &&
            existingAssignment.day_of_week === timeSlot.day &&
            this.timeOverlaps(
              existingAssignment.start_time,
              existingAssignment.end_time,
              timeSlot.start,
              timeSlot.end
            )) {
          return false;
        }
      }
    }

    // 3. No student schedule conflict
    if (constraints.noStudentScheduleConflict) {
      for (const [studentId, sectionIds] of studentSections) {
        if (sectionIds.includes(section.id)) {
          // Check if student has another section at same time
          for (const otherSectionId of sectionIds) {
            if (otherSectionId !== section.id && assignments.has(otherSectionId)) {
              const otherAssignment = assignments.get(otherSectionId);
              if (otherAssignment.day_of_week === timeSlot.day &&
                  this.timeOverlaps(
                    otherAssignment.start_time,
                    otherAssignment.end_time,
                    timeSlot.start,
                    timeSlot.end
                  )) {
                return false;
              }
            }
          }
        }
      }
    }

    // 4. Classroom capacity >= section capacity
    if (constraints.classroomCapacity) {
      if (classroom.capacity < section.capacity) {
        return false;
      }
    }

    // 5. Classroom features match course requirements
    if (constraints.classroomFeatures) {
      const course = sections.find(s => s.id === section.id)?.course;
      if (course && course.requirements) {
        const requiredFeatures = course.requirements.features || [];
        const classroomFeatures = classroom.features_json || {};
        for (const feature of requiredFeatures) {
          if (!classroomFeatures[feature]) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Check if two time ranges overlap
   */
  static timeOverlaps(start1, end1, start2, end2) {
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    return (start1Min < end2Min && end1Min > start2Min);
  }

  /**
   * Optimize schedule with soft constraints
   */
  static optimizeSchedule(schedule, sections, classrooms, timeSlots, instructorPreferences, constraints) {
    // For now, return schedule as-is
    // In production, implement optimization algorithms (genetic algorithm, simulated annealing, etc.)
    return schedule;
  }

  /**
   * Save schedule to database
   */
  static async saveSchedule(scheduleId, scheduleEntries) {
    // Delete existing schedules for these sections
    const sectionIds = scheduleEntries.map(e => e.section_id);
    await prisma.schedule.deleteMany({
      where: {
        section_id: { in: sectionIds }
      }
    });

    // Create new schedules
    const schedules = await prisma.schedule.createMany({
      data: scheduleEntries.map(entry => ({
        section_id: entry.section_id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        classroom_id: entry.classroom_id
      }))
    });

    return schedules;
  }

  /**
   * Get user's weekly schedule
   */
  static async getUserSchedule(userId, userRole) {
    let sections = [];

    if (userRole === 'student') {
      const student = await prisma.student.findUnique({
        where: { userId },
        include: {
          enrollments: {
            where: { status: 'active' },
            include: {
              section: {
                include: {
                  courses: true,
                  schedules: {
                    include: {
                      classroom: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (student) {
        sections = student.enrollments.map(e => e.section);
      }
    } else if (userRole === 'faculty') {
      const faculty = await prisma.faculty.findUnique({
        where: { userId },
        include: {
          user: true
        }
      });

      if (faculty) {
        sections = await prisma.course_sections.findMany({
          where: {
            instructor_id: faculty.id,
            deleted_at: null
          },
          include: {
            courses: true,
            schedules: {
              include: {
                classroom: true
              }
            }
          }
        });
      }
    }

    // Format as weekly schedule
    const weeklySchedule = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    };

    sections.forEach(section => {
      section.schedules.forEach(schedule => {
        const day = schedule.day_of_week.toLowerCase();
        if (weeklySchedule[day]) {
          weeklySchedule[day].push({
            section_id: section.id,
            course_code: section.courses.code,
            course_name: section.courses.name,
            section_number: section.section_number,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            classroom: {
              building: schedule.classroom.building,
              room_number: schedule.classroom.room_number
            }
          });
        }
      });
    });

    // Sort by start time for each day
    Object.keys(weeklySchedule).forEach(day => {
      weeklySchedule[day].sort((a, b) => {
        const timeA = a.start_time.split(':').map(Number);
        const timeB = b.start_time.split(':').map(Number);
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    });

    return weeklySchedule;
  }

  /**
   * Generate iCal format
   */
  static generateICal(weeklySchedule, startDate, endDate) {
    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Campus Management System//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ];

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNumbers = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

    days.forEach(day => {
      weeklySchedule[day].forEach(event => {
        // Find next occurrence of this day
        const dayNum = dayNumbers[day];
        let currentDate = new Date(startDate);
        
        // Find first occurrence
        while (currentDate.getDay() !== dayNum && currentDate <= endDate) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        while (currentDate <= endDate) {
          const startDateTime = new Date(currentDate);
          const [startHours, startMinutes] = event.start_time.split(':').map(Number);
          startDateTime.setHours(startHours, startMinutes, 0);

          const endDateTime = new Date(currentDate);
          const [endHours, endMinutes] = event.end_time.split(':').map(Number);
          endDateTime.setHours(endHours, endMinutes, 0);

          const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
          };

          ical.push('BEGIN:VEVENT');
          ical.push(`UID:${event.section_id}-${currentDate.getTime()}@campus.edu.tr`);
          ical.push(`DTSTART:${formatDate(startDateTime)}`);
          ical.push(`DTEND:${formatDate(endDateTime)}`);
          ical.push(`SUMMARY:${event.course_code} - ${event.course_name}`);
          ical.push(`LOCATION:${event.classroom.building} ${event.classroom.room_number}`);
          ical.push(`DESCRIPTION:Section ${event.section_number}`);
          ical.push('END:VEVENT');

          // Next week
          currentDate.setDate(currentDate.getDate() + 7);
        }
      });
    });

    ical.push('END:VCALENDAR');
    return ical.join('\r\n');
  }
}

module.exports = SchedulingService;






