const prisma = require('../prisma');

exports.getGrades = async (req, res) => {
  console.log('GET /student/grades called');
  console.log('Headers:', req.headers);
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({
      where: { userId: userId },
      select: { id: true, gpa: true, cgpa: true }
    });

    if (!student) {
      return res.json({ grades: [], gpa: null, cgpa: null });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: student.id },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });

    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return res.json({ grades: [], gpa: student.gpa, cgpa: student.cgpa });
    }

    const grades = enrollments.map(e => ({
      sectionId: e.section.id,
      courseId: e.section.courses.id,
      courseCode: e.section.courses.code,
      courseName: e.section.courses.name,
      credits: e.section.courses.credits,
      letterGrade: e.letter_grade,
      score: e.final_grade,
      semesterName: `${e.section.semester} ${e.section.year}`,
      midtermGrade: e.midterm_grade,
      finalGrade: e.final_grade
    }));

    res.json({
      grades,
      gpa: student.gpa ? parseFloat(student.gpa) : null,
      cgpa: student.cgpa ? parseFloat(student.cgpa) : null
    });
  } catch (err) {
    res.status(500).json({ error: 'Notlar yüklenemedi', details: err.message });
  }
};

exports.getMyCourses = async (req, res) => {
  console.log('GET /student/my-courses called');
  console.log('Headers:', req.headers);
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.json([]);
    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: student.id },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });
    if (!Array.isArray(enrollments) || enrollments.length === 0) return res.json([]);
    const courses = enrollments.map(e => ({
      id: e.section.courses.id,
      code: e.section.courses.code,
      name: e.section.courses.name,
      instructorName: 'TBD', // instructor relation not in schema
      sectionName: e.section.section_number,
      status: e.status,
      statusText: e.status === 'active' ? 'Kayıtlı' : 'Bırakıldı'
    }));

    res.json(courses);
  } catch (err) {
    console.error('getMyCourses error:', err);
    res.status(500).json({ error: 'Dersler yüklenemedi', details: err.message });
  }
};


const enrollmentService = require('../services/enrollmentService');

exports.enrollCourse = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { sectionId } = req.body;

    // Student ID'sini veritabanındaki student tablosundan bulmamız lazım
    // req.user.id Auth tablosundaki ID olabilir (User ID), Student tablosunda ayrı bir ID olabilir.
    // Mevcut kodda (yukarıda getGrades'te) şöyle yapılmış:
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    const result = await enrollmentService.enrollStudent({
      studentId: student.id,
      sectionId
    });

    res.status(201).json({ success: true, message: 'Derse kayıt başarılı', data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.dropCourse = async (req, res) => {
  // Bu kısım implementasyon planında vardı ama enrollmentService'de drop fonksiyonu yoktu
  // Basitçe prisma ile silebiliriz veya servise ekleyebiliriz.
  // Şimdilik servise eklemek daha temiz ama servis dosyasını henüz editlemedim.
  // Hızlı çözüm: Direkt burada yapalım, sonra refactor edilebilir.
  try {
    const userId = req.user.id;
    const { sectionId } = req.body;

    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    // Kaydı bul
    const enrollment = await prisma.enrollments.findFirst({
      where: { student_id: student.id, section_id: sectionId, status: 'active' }
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Kayıt bulunamadı veya zaten bırakılmış.' });
    }

    // Transaction ile silme/güncelleme ve kontenjan düşürme
    await prisma.$transaction(async (tx) => {
      // Enroll status update
      await tx.enrollments.update({
        where: { id: enrollment.id },
        data: { status: 'dropped', deleted_at: new Date() }
      });

      // Decrease capacity
      await tx.course_sections.update({
        where: { id: sectionId },
        data: { enrolled_count: { decrement: 1 } }
      });
    });

    res.json({ success: true, message: 'Ders başarıyla bırakıldı' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAvailableCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    // Get all active course sections
    const sections = await prisma.course_sections.findMany({
      where: {
        deleted_at: null,
        courses: {
          is_active: true,
          deleted_at: null
        }
      },
      include: {
        courses: true
      }
    });

    // Filter out sections student is already enrolled in
    const enrolledSections = await prisma.enrollments.findMany({
      where: { student_id: student.id, status: 'active' },
      select: { section_id: true }
    });

    const enrolledSectionIds = enrolledSections.map(e => e.section_id);

    const availableSections = sections
      .filter(section => !enrolledSectionIds.includes(section.id))
      .map(section => ({
        sectionId: section.id,
        courseId: section.course_id,
        courseCode: section.courses.code,
        courseName: section.courses.name,
        sectionNumber: section.section_number,
        semester: section.semester,
        year: section.year,
        credits: section.courses.credits,
        capacity: section.capacity,
        enrolledCount: section.enrolled_count,
        instructorName: null // We don't have instructor relation in schema
      }));

    res.json(availableSections);
  } catch (err) {
    res.status(500).json({ error: 'Dersler yüklenemedi', details: err.message });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.json([]);

    const attendanceRecords = await prisma.attendance_records.findMany({
      where: { student_id: student.id },
      include: {
        session: {
          include: {
            section: {
              include: {
                courses: true
              }
            }
          }
        }
      },
      orderBy: { check_in_time: 'desc' }
    });

    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      courseCode: record.session.section.courses.code,
      courseName: record.session.section.courses.name,
      date: record.session.date,
      checkInTime: record.check_in_time,
      status: 'present', // Şüpheli yoklamalar da "Katıldı" olarak gösterilir
      distance: record.distance_from_center,
      flagReason: record.flag_reason,
      isFlagged: record.is_flagged // Arka planda tutulur ama gösterilmez
    }));

    res.json(formattedRecords);
  } catch (err) {
    console.error('getMyAttendance error:', err);
    res.status(500).json({ error: 'Yoklama geçmişi yüklenemedi', details: err.message });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) return res.json([]);

    const enrollments = await prisma.enrollments.findMany({
      where: { student_id: student.id, status: 'active' },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });

    const summary = [];
    for (const enrollment of enrollments) {
      const course = enrollment.section.courses;
      const limit = course.attendance_limit || 4;

      // Find total sessions held for this section up to now
      const totalSessions = await prisma.attendance_sessions.count({
        where: {
          section_id: enrollment.section_id,
          date: { lte: new Date() }
        }
      });

      // Find sessions attended by student (including flagged/suspicious)
      // Şüpheli yoklamalar da katılım olarak sayılır çünkü öğrenci yoklama vermiştir
      const attendedCount = await prisma.attendance_records.count({
        where: {
          student_id: student.id,
          session: { section_id: enrollment.section_id }
          // is_flagged kontrolü yapmıyoruz çünkü şüpheli yoklamalar da katılım sayılır
        }
      });

      // Devamsızlık = Toplam Session - Katılım (şüpheli dahil)
      // Şüpheli yoklamalar devamsızlık değil, katılım olarak sayılır
      const absentCount = Math.max(0, totalSessions - attendedCount);
      const remaining = Math.max(0, limit - absentCount);

      summary.push({
        courseCode: course.code,
        courseName: course.name,
        limit,
        absent: absentCount,
        attended: attendedCount,
        totalSessions,
        remaining,
        status: remaining === 0 ? 'critical' : remaining <= 1 ? 'warning' : 'good'
      });
    }

    res.json(summary);
  } catch (err) {
    console.error('getAttendanceSummary error:', err);
    res.status(500).json({ error: 'Özet yüklenemedi', details: err.message });
  }
};
