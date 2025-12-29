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
    console.log('=== GET MY SECTIONS START ===');
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('User info:', { userId, userRole });

    // Role kontrolü: Sadece admin ve faculty erişebilir
    if (userRole !== 'admin' && userRole !== 'faculty') {
      console.log('❌ Unauthorized role:', userRole);
      return res.status(403).json({ error: 'Bu işlem için öğretim görevlisi veya admin yetkisi gereklidir' });
    }

    let sections;

    // Admin tüm dersleri görebilir
    if (userRole === 'admin') {
      console.log('Admin access - fetching all sections');
      sections = await prisma.course_sections.findMany({
        include: { courses: true }
      });
    } else {
      // Find faculty profile
      console.log('Faculty access - looking for faculty profile');
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });
      
      console.log('Faculty profile:', faculty ? { id: faculty.id, userId: faculty.userId } : 'NOT FOUND');
      
      if (!faculty) {
        console.error('❌ Faculty profile not found for userId:', userId);
        return res.status(404).json({ error: 'Öğretim görevlisi profili bulunamadı' });
      }

      console.log('Fetching sections for faculty:', faculty.id);
      sections = await prisma.course_sections.findMany({
        where: { instructor_id: faculty.id, deleted_at: null },
        include: { courses: true }
      });
      console.log('Found sections:', sections.length);
    }

    // Instructor bilgilerini ekle
    const sectionsWithInstructor = await Promise.all(sections.map(async (s) => {
      let instructor = null;
      if (s.instructor_id) {
        try {
          instructor = await prisma.faculty.findUnique({
            where: { id: s.instructor_id },
            include: {
              user: {
                select: {
                  fullName: true
                }
              }
            }
          });
        } catch (err) {
          console.error('Error fetching instructor:', err);
        }
      }

      return {
        id: s.id,
        courseCode: s.courses.code,
        courseName: s.courses.name,
        section_number: s.section_number,
        sectionNumber: s.section_number,
        semester: s.semester,
        year: s.year,
        enrolled_count: s.enrolled_count,
        enrolledCount: s.enrolled_count,
        capacity: s.capacity,
        instructor: instructor ? {
          id: instructor.id,
          fullName: instructor.user?.fullName || 'Bilinmiyor'
        } : null,
        courses: {
          code: s.courses.code,
          name: s.courses.name
        }
      };
    }));

    res.json({
      success: true,
      data: sectionsWithInstructor
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get gradebook for a section (students with their grades)
 * GET /faculty/gradebook/:sectionId
 */
exports.getGradebook = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!sectionId) {
      return res.status(400).json({ error: 'sectionId is required' });
    }

    // Check if user has access to this section
    const section = await prisma.course_sections.findUnique({
      where: { id: sectionId },
      include: { courses: true }
    });

    if (!section || section.deleted_at) {
      return res.status(404).json({ error: 'Ders şubesi bulunamadı' });
    }

    // If not admin, verify faculty owns this section
    if (userRole !== 'admin') {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });
      if (!faculty || section.instructor_id !== faculty.id) {
        return res.status(403).json({ error: 'Bu ders şubesine erişim yetkiniz yok' });
      }
    }

    // Get enrollments with student info
    const enrollments = await prisma.enrollments.findMany({
      where: { section_id: sectionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        }
      },
      orderBy: {
        student: {
          studentNumber: 'asc'
        }
      }
    });

    const students = enrollments.map(e => ({
      studentId: e.student_id,
      studentNumber: e.student.studentNumber,
      fullName: e.student.user?.fullName || 'Bilinmiyor',
      enrollmentId: e.id,
      midtermGrade: e.midterm_grade,
      finalGrade: e.final_grade,
      letterGrade: e.letter_grade,
      gradePoint: e.grade_point,
      status: e.status,
      grade: e.letter_grade || (e.midterm_grade !== null && e.final_grade !== null 
        ? `${e.midterm_grade || 0}-${e.final_grade || 0}` 
        : '')
    }));

    res.json({
      success: true,
      students: students
    });
  } catch (err) {
    console.error('Get gradebook error:', err);
    res.status(500).json({
      error: 'Öğrenciler yüklenemedi',
      details: err.message
    });
  }
};

/**
 * Save grades for multiple students in a section
 * POST /faculty/gradebook/:sectionId
 * Body: { grades: { studentId: { midtermGrade, finalGrade } } }
 */
exports.saveGradebook = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { grades } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!sectionId || !grades) {
      return res.status(400).json({ error: 'sectionId and grades are required' });
    }

    // Check if user has access to this section
    const section = await prisma.course_sections.findUnique({
      where: { id: sectionId }
    });

    if (!section || section.deleted_at) {
      return res.status(404).json({ error: 'Ders şubesi bulunamadı' });
    }

    // If not admin, verify faculty owns this section
    if (userRole !== 'admin') {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });
      if (!faculty || section.instructor_id !== faculty.id) {
        return res.status(403).json({ error: 'Bu ders şubesine erişim yetkiniz yok' });
      }
    }

    // Save grades for each student
    const results = [];
    for (const [studentId, gradeData] of Object.entries(grades)) {
      if (!gradeData) continue;

      let midtermGrade, finalGrade;

      // Parse grade data
      if (typeof gradeData === 'object') {
        midtermGrade = gradeData.midtermGrade;
        finalGrade = gradeData.finalGrade;
      } else if (typeof gradeData === 'string') {
        // Try to parse as "midterm-final" format
        const parts = gradeData.split('-').map(p => p.trim());
        if (parts.length === 2) {
          midtermGrade = parseFloat(parts[0]);
          finalGrade = parseFloat(parts[1]);
        } else {
          // If it's a single number, use as final grade
          const num = parseFloat(gradeData);
          if (!isNaN(num)) {
            midtermGrade = 0;
            finalGrade = num;
          } else {
            continue; // Skip if can't parse
          }
        }
      } else {
        continue;
      }

      // Validate grades
      if (midtermGrade === undefined || finalGrade === undefined || 
          isNaN(midtermGrade) || isNaN(finalGrade)) {
        continue;
      }

      // Ensure grades are within valid range
      midtermGrade = Math.max(0, Math.min(100, parseFloat(midtermGrade)));
      finalGrade = Math.max(0, Math.min(100, parseFloat(finalGrade)));

      try {
        const result = await gradeService.enterGrade({
          sectionId,
          studentId,
          midtermGrade,
          finalGrade
        });
        results.push(result);
      } catch (err) {
        console.error(`Error saving grade for student ${studentId}:`, err);
      }
    }

    res.json({
      success: true,
      message: 'Notlar başarıyla kaydedildi',
      saved: results.length
    });
  } catch (err) {
    console.error('Save gradebook error:', err);
    res.status(500).json({
      error: 'Notlar kaydedilemedi',
      details: err.message
    });
  }
};
