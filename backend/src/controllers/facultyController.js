const prisma = require('../prisma');
const gradeService = require('../services/gradeService');

// Yoklama başlat
exports.startAttendance = async (req, res) => {
  console.log('BODY:', req.body);
  try {
    // Gerekli parametreleri alın (sectionId, date, startTime, endTime, latitude, longitude)
    const { sectionId, date, startTime, endTime, latitude, longitude } = req.body;
    if (!sectionId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'sectionId, date, startTime ve endTime gereklidir.' });
    }
    // Yoklama oturumu oluştur
    const attendanceSession = await prisma.attendance_sessions.create({
      data: {
        section_id: sectionId,
        instructor_id: req.user.id,
        date: new Date(date),
        start_time: new Date(startTime),
        end_time: new Date(endTime),
        latitude: latitude || 0,
        longitude: longitude || 0
      }
    });
    res.status(201).json(attendanceSession);
  } catch (err) {
    console.error('Yoklama başlatılamadı HATA:', err);
    res.status(500).json({ error: 'Yoklama başlatılamadı', details: err.message });
  }
};

/**
 * Enter grade for a student in a section
 * POST /faculty/grades
 * Body: { sectionId, studentId, midtermGrade, finalGrade }
 */
exports.enterGrade = async (req, res) => {
  try {
    const { sectionId, studentId, midtermGrade, finalGrade } = req.body;

    if (!sectionId || !studentId) {
      return res.status(400).json({ error: 'sectionId and studentId are required' });
    }

    if (midtermGrade === undefined || finalGrade === undefined) {
      return res.status(400).json({ error: 'Both midtermGrade and finalGrade are required' });
    }

    const result = await gradeService.enterGrade({
      sectionId,
      studentId,
      midtermGrade: parseFloat(midtermGrade),
      finalGrade: parseFloat(finalGrade)
    });

    res.status(200).json({
      success: true,
      message: 'Grade entered successfully',
      data: result
    });
  } catch (err) {
    console.error('Grade entry error:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
};

/**
 * Get all students and their grades for a section
 * GET /faculty/grades/:sectionId
 */
exports.getSectionGrades = async (req, res) => {
  try {
    const { sectionId } = req.params;

    if (!sectionId) {
      return res.status(400).json({ error: 'sectionId is required' });
    }

    const grades = await gradeService.getSectionGrades(sectionId);

    res.status(200).json(grades);
  } catch (err) {
    console.error('Get section grades error:', err);
    res.status(500).json({
      error: 'Failed to retrieve grades',
      details: err.message
    });
  }
};

exports.getMySections = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let sections;

    // Admin tüm dersleri görebilir
    if (userRole === 'admin') {
      sections = await prisma.course_sections.findMany({
        include: { courses: true }
      });
    } else {
      // Find faculty profile
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });
      if (!faculty) {
        return res.status(404).json({ error: 'Öğretim görevlisi profili bulunamadı' });
      }

      sections = await prisma.course_sections.findMany({
        where: { instructor_id: faculty.id },
        include: { courses: true }
      });
    }

    res.json(sections.map(s => ({
      id: s.id,
      courseCode: s.courses.code,
      courseName: s.courses.name,
      sectionNumber: s.section_number,
      semester: s.semester,
      year: s.year,
      capacity: s.capacity,
      enrolledCount: s.enrolled_count,
      credits: s.courses.credits
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get pending enrollment requests for faculty's sections
 * GET /faculty/enrollment-requests
 */
exports.getEnrollmentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find faculty profile
    const faculty = await prisma.faculty.findFirst({
      where: { userId: userId }
    });
    if (!faculty) {
      return res.status(404).json({ error: 'Öğretim görevlisi profili bulunamadı' });
    }

    // Get sections assigned to this faculty
    const sections = await prisma.course_sections.findMany({
      where: { instructor_id: faculty.id },
      select: { id: true }
    });
    const sectionIds = sections.map(s => s.id);

    // Get pending enrollments for these sections
    const enrollments = await prisma.enrollments.findMany({
      where: {
        section_id: { in: sectionIds },
        status: 'pending'
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        },
        section: {
          include: {
            courses: {
              select: {
                code: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        enrollment_date: 'desc'
      }
    });

    const requests = enrollments.map(e => ({
      id: e.id,
      studentNumber: e.student.studentNumber,
      studentName: e.student.user.fullName,
      courseCode: e.section.courses.code,
      courseName: e.section.courses.name,
      sectionNumber: e.section.section_number,
      enrollmentDate: e.enrollment_date
    }));

    res.json(requests);
  } catch (err) {
    console.error('Get enrollment requests error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Handle enrollment request (approve/reject)
 * POST /faculty/enrollment-requests/:enrollmentId/:action
 */
exports.handleEnrollmentRequest = async (req, res) => {
  try {
    const { enrollmentId, action } = req.params;
    const userId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "reject"' });
    }

    // Find faculty profile
    const faculty = await prisma.faculty.findFirst({
      where: { userId: userId }
    });
    if (!faculty) {
      return res.status(404).json({ error: 'Öğretim görevlisi profili bulunamadı' });
    }

    // Get enrollment and verify it belongs to faculty's section
    const enrollment = await prisma.enrollments.findUnique({
      where: { id: enrollmentId },
      include: {
        section: true
      }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Kayıt isteği bulunamadı' });
    }

    if (enrollment.section.instructor_id !== faculty.id) {
      return res.status(403).json({ error: 'Bu kayıt isteğini işleme yetkiniz yok' });
    }

    if (enrollment.status !== 'pending') {
      return res.status(400).json({ error: 'Bu kayıt isteği zaten işlenmiş' });
    }

    if (action === 'approve') {
      // Update enrollment status to active
      await prisma.enrollments.update({
        where: { id: enrollmentId },
        data: { status: 'active' }
      });

      // Increment enrolled count
      await prisma.course_sections.update({
        where: { id: enrollment.section_id },
        data: { enrolled_count: { increment: 1 } }
      });
    } else {
      // Reject: just update status
      await prisma.enrollments.update({
        where: { id: enrollmentId },
        data: { status: 'rejected' }
      });
    }

    res.json({ success: true, message: `Kayıt isteği ${action === 'approve' ? 'onaylandı' : 'reddedildi'}` });
  } catch (err) {
    console.error('Handle enrollment request error:', err);
    res.status(500).json({ error: err.message });
  }
};
