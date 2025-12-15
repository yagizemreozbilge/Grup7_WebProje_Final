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
      sectionNumber: s.section_number
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
