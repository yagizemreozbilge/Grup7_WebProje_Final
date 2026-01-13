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
    const userId = req.user.id;
    const { sectionId } = req.body;

    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    // Check if section exists and has instructor
    const section = await prisma.course_sections.findUnique({
      where: { id: sectionId },
      include: { courses: true }
    });

    if (!section) {
      return res.status(404).json({ error: 'Ders şubesi bulunamadı' });
    }

    if (!section.instructor_id) {
      return res.status(400).json({ error: 'Bu derse henüz akademisyen atanmamış' });
    }

    // Check if student already has an enrollment (active or pending) for this section
    const existingEnrollment = await prisma.enrollments.findFirst({
      where: {
        student_id: student.id,
        section_id: sectionId,
        status: { in: ['active', 'pending'] }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'pending') {
        return res.status(400).json({ error: 'Bu ders için zaten bekleyen bir kayıt isteğiniz var' });
      } else {
        return res.status(400).json({ error: 'Bu derse zaten kayıtlısınız' });
      }
    }

    // Create enrollment request with pending status
    const enrollment = await prisma.enrollments.create({
      data: {
        student_id: student.id,
        section_id: sectionId,
        status: 'pending' // Kayıt isteği - akademisyen onaylayacak
      }
    });

    res.status(201).json({ 
      success: true, 
      message: 'Kayıt isteği başarıyla gönderildi. Akademisyen onayı bekleniyor.', 
      data: enrollment 
    });
  } catch (err) {
    console.error('enrollCourse error:', err);
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

    // Get only sections that have an instructor assigned (instructor_id is not null)
    const sections = await prisma.course_sections.findMany({
      where: {
        deleted_at: null,
        instructor_id: { not: null }, // Sadece akademisyene atanan dersler
        courses: {
          is_active: true,
          deleted_at: null
        }
      },
      include: {
        courses: true,
        // Get instructor info
        enrollments: {
          where: {
            student_id: student.id,
            status: { in: ['active', 'pending'] }
          },
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    // Get instructor names
    const sectionsWithInstructors = await Promise.all(sections.map(async (section) => {
      let instructorName = null;
      if (section.instructor_id) {
        const faculty = await prisma.faculty.findUnique({
          where: { id: section.instructor_id },
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        });
        if (faculty && faculty.user) {
          instructorName = faculty.user.fullName;
        }
      }
      return {
        ...section,
        instructorName
      };
    }));

    // Filter out sections student is already enrolled in or has pending request
    const availableSections = sectionsWithInstructors
      .filter(section => {
        // Eğer zaten active veya pending enrollment varsa gösterme
        return section.enrollments.length === 0;
      })
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
        instructorName: section.instructorName || 'Belirtilmemiş'
      }));

    res.json(availableSections);
  } catch (err) {
    console.error('getAvailableCourses error:', err);
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
      status: record.is_flagged ? 'flagged' : 'present', // Fixed for frontend compatibility
      distance: record.distance_from_center,
      flagReason: record.flag_reason
    }));

    res.json(formattedRecords);
  } catch (err) {
    console.error('getMyAttendance error:', err);
    res.status(500).json({ error: 'Yoklama geçmişi yüklenemedi', details: err.message });
  }
};

exports.getTranscript = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        department: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });
    }

    const enrollments = await prisma.enrollments.findMany({
      where: {
        student_id: student.id,
        status: 'active',
        letter_grade: { not: null }
      },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      },
      orderBy: [
        { section: { year: 'desc' } },
        { section: { semester: 'asc' } }
      ]
    });

    // Create Excel file
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transkript');

    // Header styling
    worksheet.columns = [
      { header: 'Ders Kodu', key: 'courseCode', width: 15 },
      { header: 'Ders Adı', key: 'courseName', width: 40 },
      { header: 'Kredi', key: 'credits', width: 10 },
      { header: 'Harf Notu', key: 'letterGrade', width: 12 },
      { header: 'Puan', key: 'score', width: 10 },
      { header: 'Dönem', key: 'semester', width: 15 }
    ];

    // Style header
    worksheet.getRow(1).font = { bold: true, size: 12 };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add student info
    worksheet.insertRow(1, ['Öğrenci Adı:', student.user.fullName || '']);
    worksheet.insertRow(2, ['Öğrenci Numarası:', student.studentNumber || '']);
    worksheet.insertRow(3, ['Bölüm:', student.department?.name || '']);
    worksheet.insertRow(4, ['GNO:', student.gpa ? parseFloat(student.gpa).toFixed(2) : '-']);
    worksheet.insertRow(5, ['AGNO:', student.cgpa ? parseFloat(student.cgpa).toFixed(2) : '-']);
    worksheet.insertRow(6, []); // Empty row

    // Add grades
    enrollments.forEach((enrollment) => {
      worksheet.addRow({
        courseCode: enrollment.section.courses.code,
        courseName: enrollment.section.courses.name,
        credits: enrollment.section.courses.credits,
        letterGrade: enrollment.letter_grade,
        score: enrollment.final_grade || '-',
        semester: `${enrollment.section.semester} ${enrollment.section.year}`
      });
    });

    // Style data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 6) {
        row.alignment = { vertical: 'middle' };
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' }
          };
        }
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="transkript_${student.studentNumber}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('getTranscript error:', err);
    res.status(500).json({ error: 'Transkript oluşturulamadı', details: err.message });
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

      // Find sessions attended by student
      const attendedCount = await prisma.attendance_records.count({
        where: {
          student_id: student.id,
          session: { section_id: enrollment.section_id }
        }
      });

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
