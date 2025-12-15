const prisma = require('../prisma');

exports.getGrades = async (req, res) => {
  console.log('GET /student/grades called');
  console.log('Headers:', req.headers);
  try {
    const userId = req.user.id;
    const student = await prisma.student.findUnique({ where: { userId: userId } });
    if (!student) return res.json([]);
    const enrollments = await prisma.enrollments.findMany({
      where: { studentId: student.id },
      include: {
        section: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });
    if (!Array.isArray(enrollments) || enrollments.length === 0) return res.json([]);
    const grades = enrollments.map(e => ({
      courseId: e.section.course.id,
      courseCode: e.section.course.code,
      courseName: e.section.course.name,
      instructorName: e.section.instructor?.fullName,
      sectionName: e.section.sectionNumber,
      grade: e.grade ?? null
    }));
    res.json(grades);
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
      where: { studentId: student.id },
      include: {
        section: {
          include: {
            course: true,
            instructor: true
          }
        }
      }
    });
    if (!Array.isArray(enrollments) || enrollments.length === 0) return res.json([]);
    const courses = enrollments.map(e => ({
      id: e.section.course.id,
      code: e.section.course.code,
      name: e.section.course.name,
      instructorName: e.section.instructor?.fullName,
      sectionName: e.section.sectionNumber,
      status: e.status,
      statusText: e.status === 'active' ? 'Kayıtlı' : 'Bırakıldı'
    }));

    res.json(courses);
  } catch (err) {
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
