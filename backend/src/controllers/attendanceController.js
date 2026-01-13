// src/controllers/attendanceController.js
const attendanceService = require('../services/attendanceService');
const ExcelJS = require('exceljs');
const prisma = require('../prisma');

exports.createSession = async (req, res) => {
  try {
    // Gerekli parametreleri assignment'a uygun al
    const { section_id, date, start_time, end_time, latitude, longitude } = req.body;
    if (!section_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'section_id, date, start_time ve end_time gereklidir.' });
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    // Section'ı kontrol et ve akademisyenin bu derse atanmış olduğunu doğrula
    const section = await prisma.course_sections.findUnique({
      where: { id: section_id },
      include: { courses: true }
    });

    if (!section) {
      return res.status(404).json({ error: 'Ders şubesi bulunamadı' });
    }

    // Admin tüm derslerde yoklama başlatabilir, akademisyen sadece kendi derslerinde
    if (userRole !== 'admin') {
      if (userRole !== 'faculty') {
        return res.status(403).json({ error: 'Bu işlem için akademisyen yetkisi gereklidir' });
      }

      // Akademisyenin bu derse atanmış olduğunu kontrol et
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });

      if (!faculty) {
        return res.status(404).json({ error: 'Öğretim görevlisi profili bulunamadı' });
      }

      if (section.instructor_id !== faculty.id) {
        return res.status(403).json({ error: 'Bu derse atanmış değilsiniz. Sadece size atanan derslerde yoklama başlatabilirsiniz.' });
      }
    }

    // Yoklama oturumu oluştur
    const session = await attendanceService.createSession({
      section_id,
      instructor_id: userRole === 'admin' ? null : (await prisma.faculty.findFirst({ where: { userId: userId } }))?.id,
      date,
      start_time,
      end_time,
      latitude: latitude || 0,
      longitude: longitude || 0
    });
    res.status(201).json(session);
  } catch (err) {
    console.error('Yoklama oturumu başlatılamadı HATASI:', err);
    res.status(500).json({ error: 'Yoklama oturumu başlatılamadı', details: err.message });
  }
};


exports.markAttendance = async (req, res) => {
  try {
    const studentId = req.user.id;
    // Student tablosundan asil ID'yi bul
    const student = await prisma.student.findUnique({ where: { userId: studentId } });
    if (!student) return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });

    const { sessionId, latitude, longitude, accuracy } = req.body;
    if (!sessionId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Eksik parametreler (sessionId, lat, long)' });
    }

    const result = await attendanceService.checkAttendance({
      sessionId,
      studentId: student.id,
      latitude,
      longitude,
      accuracy
    });

    if (result.success) {
      res.status(201).json({ success: true, message: 'Yoklama başarılı', data: result });
    } else {
      // Flagged but recorded
      res.status(200).json({ success: true, message: 'Yoklama alındı (Şüpheli)', warning: 'Konum sınırı dışında', data: result });
    }

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
    // Implementasyon: Öğrencinin bir dersteki devamsızlık durumu
    // Şimdilik basitçe stub kalabilir veya geliştirilebilir.
    res.json({ message: 'Yoklama durumu endpointi (stub)' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const report = await attendanceService.getReport(sectionId);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Rapor alınamadı', details: err.message });
  }
};

exports.submitExcuse = async (req, res) => {
  try {
    const studentId = req.user?.id;
    const { sessionId, reason } = req.body;
    if (!studentId) return res.status(401).json({ error: 'Kimlik doğrulama gerekli' });
    if (!sessionId || !reason) return res.status(400).json({ error: 'Eksik parametre' });
    const result = await attendanceService.submitExcuse({ studentId, sessionId, reason });
    res.status(201).json({ success: true, excuse: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.markAttendanceQR = async (req, res) => {
  // ...QR kod ile yoklama
  res.json({ message: 'QR kod ile yoklama endpointi (stub)' });
};

/**
 * Student gives attendance via QR code URL
 * POST /student/attendance/give/:sessionId
 * Body: { location: { lat, lng } }
 */
exports.giveAttendance = async (req, res) => {
  try {
    console.log('=== GIVE ATTENDANCE START ===');
    const { sessionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    console.log('Request params:', { sessionId, userId, userRole });
    
    // Sadece öğrenciler yoklama verebilir
    if (userRole !== 'student') {
      return res.status(403).json({ error: 'Bu işlem için öğrenci yetkisi gereklidir' });
    }
    
    // Find student record
    const student = await prisma.student.findUnique({ 
      where: { userId: userId } 
    });
    console.log('Student found:', student ? { id: student.id, userId: student.userId } : 'NOT FOUND');
    
    if (!student) {
      return res.status(404).json({ error: 'Öğrenci kaydı bulunamadı' });
    }

    // Get location from request body
    const { location } = req.body;
    if (!location || location.lat === undefined || location.lng === undefined) {
      return res.status(400).json({ error: 'Konum bilgisi gereklidir' });
    }

    // Check if session exists and is active
    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Yoklama oturumu bulunamadı' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Bu yoklama oturumu aktif değil' });
    }

    // Check if current time is within session time window
    const now = new Date();
    if (now < new Date(session.start_time) || now > new Date(session.end_time)) {
      return res.status(400).json({ error: 'Yoklama oturumu süresi dolmuş' });
    }

    // Check if student is enrolled in this section
    console.log('Checking enrollment:', {
      studentId: student.id,
      sectionId: session.section_id
    });
    
    // Önce herhangi bir enrollment kaydı var mı kontrol et
    const enrollmentCheck = await prisma.enrollments.findFirst({
      where: {
        student_id: student.id,
        section_id: session.section_id
      },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });

    console.log('Enrollment check result:', enrollmentCheck ? {
      id: enrollmentCheck.id,
      status: enrollmentCheck.status,
      studentId: enrollmentCheck.student_id,
      sectionId: enrollmentCheck.section_id
    } : 'NOT FOUND');

    if (!enrollmentCheck) {
      console.error('❌ Enrollment not found:', {
        studentId: student.id,
        studentUserId: userId,
        sectionId: session.section_id,
        sessionId: sessionId,
        sectionName: session.section?.courses?.name || 'Unknown'
      });
      
      // Tüm enrollment'ları kontrol et (debug için)
      const allEnrollments = await prisma.enrollments.findMany({
        where: { student_id: student.id },
        include: { section: { include: { courses: true } } }
      });
      console.log('All student enrollments:', allEnrollments.map(e => ({
        id: e.id,
        sectionId: e.section_id,
        sectionName: e.section?.courses?.name,
        status: e.status
      })));
      
      // Daha açıklayıcı hata mesajı
      const sectionInfo = await prisma.course_sections.findUnique({
        where: { id: session.section_id },
        include: { courses: true }
      });
      
      // Daha açıklayıcı hata mesajı ve çözüm önerisi
      const errorMessage = sectionInfo 
        ? `Bu derse kayıtlı değilsiniz. Ders: ${sectionInfo.courses.name} (${sectionInfo.courses.code}) - Şube: ${sectionInfo.section_number || 'N/A'}. Lütfen önce "Ders Seçimi" sayfasından derse kayıt olun.`
        : 'Bu derse kayıtlı değilsiniz. Lütfen önce "Ders Seçimi" sayfasından derse kayıt olun.';
      
      return res.status(403).json({ 
        error: errorMessage,
        code: 'NOT_ENROLLED',
        sectionId: session.section_id,
        courseName: sectionInfo?.courses?.name,
        courseCode: sectionInfo?.courses?.code
      });
    }

    // Status kontrolü: Sadece aktif kayıtlar yoklama verebilir
    // 'active' ve 'enrolled' geçerli status'lerdir
    const validStatuses = ['active', 'enrolled'];
    const enrollmentStatus = enrollmentCheck.status?.toLowerCase() || '';
    
    if (!validStatuses.includes(enrollmentStatus)) {
      console.log('Enrollment status issue:', {
        enrollmentId: enrollmentCheck.id,
        status: enrollmentCheck.status,
        studentId: student.id,
        sectionId: session.section_id,
        validStatuses: validStatuses
      });
      
      const statusMessages = {
        'dropped': 'Bu dersten kaydınız silinmiş',
        'completed': 'Bu ders tamamlanmış',
        'failed': 'Bu ders başarısız',
        'withdrawn': 'Bu dersten çekilmişsiniz'
      };
      
      const message = statusMessages[enrollmentStatus] || 'Bu ders için kayıt durumunuz aktif değil';
      return res.status(403).json({ error: message });
    }

    // Enrollment var ve aktif, devam et
    const enrollment = enrollmentCheck;

    // Check if student already gave attendance for this session
    const existingRecord = await prisma.attendance_records.findFirst({
      where: {
        student_id: student.id,
        session_id: sessionId
      }
    });

    if (existingRecord) {
      return res.status(400).json({ error: 'Bu oturum için zaten yoklama verdiniz' });
    }

    // Use attendanceService to check attendance
    const result = await attendanceService.checkAttendance({
      sessionId,
      studentId: student.id,
      latitude: location.lat,
      longitude: location.lng,
      accuracy: location.accuracy || 10
    });

    if (result.success) {
      res.status(201).json({ 
        success: true, 
        message: 'Yoklama başarıyla kaydedildi',
        data: result 
      });
    } else {
      // Flagged but recorded
      res.status(200).json({ 
        success: true, 
        message: 'Yoklama kaydedildi (Konum uyarısı)',
        warning: 'Konum sınırı dışında',
        data: result 
      });
    }

  } catch (err) {
    console.error('Give attendance error:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Yoklama verilemedi' 
    });
  }
};

exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Session'ı bul
    const session = await prisma.attendance_sessions.findUnique({
      where: { id: sessionId },
      include: {
        section: {
          include: {
            courses: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Yoklama oturumu bulunamadı' });
    }

    // Akademisyen kontrolü: Sadece bu dersin hocası veya admin görebilir
    if (userRole !== 'admin') {
      if (userRole !== 'faculty') {
        return res.status(403).json({ error: 'Bu işlem için akademisyen yetkisi gereklidir' });
      }
      
      const faculty = await prisma.faculty.findFirst({
        where: { userId: userId }
      });
      
      if (!faculty || session.section.instructor_id !== faculty.id) {
        return res.status(403).json({ error: 'Bu yoklama oturumuna erişim yetkiniz yok' });
      }
      
      // Instructor kontrolü için faculty bilgisini al
      const instructorFaculty = await prisma.faculty.findUnique({
        where: { id: session.section.instructor_id },
        include: {
          user: {
            select: {
              id: true
            }
          }
        }
      }).catch(() => null);
    }

    // Yoklama kayıtlarını al
    const attendanceRecords = await prisma.attendance_records.findMany({
      where: { session_id: sessionId },
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
        check_in_time: 'asc'
      }
    });

    // Section'daki tüm öğrencileri al
    const enrollments = await prisma.enrollments.findMany({
      where: {
        section_id: session.section_id,
        status: 'active'
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
        }
      }
    });

    // Öğrenci listesini oluştur (yoklama verenler ve vermeyenler)
    const studentsList = enrollments.map(enrollment => {
      const record = attendanceRecords.find(r => r.student_id === enrollment.student_id);
      return {
        studentId: enrollment.student.id,
        studentNumber: enrollment.student.studentNumber,
        fullName: enrollment.student.user.fullName,
        present: !!record,
        checkInTime: record ? record.check_in_time : null,
        isFlagged: record ? record.is_flagged : false,
        flagReason: record ? record.flag_reason : null
      };
    });

    res.json({
      success: true,
      data: {
        session: {
          id: session.id,
          date: session.date,
          startTime: session.start_time,
          endTime: session.end_time,
          status: session.status,
          courseCode: session.section.courses.code,
          courseName: session.section.courses.name,
          sectionNumber: session.section.section_number
        },
        students: studentsList,
        stats: {
          total: studentsList.length,
          present: studentsList.filter(s => s.present).length,
          absent: studentsList.filter(s => !s.present).length
        }
      }
    });
  } catch (err) {
    console.error('getSessionAttendance error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Yoklama kayıtları yüklenemedi', 
      details: err.message 
    });
  }
};

exports.exportReportExcel = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const report = await attendanceService.getReport(sectionId);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Campus Information System';
    workbook.created = new Date();
    
    const sheet = workbook.addWorksheet('Yoklama Raporu');

    // Add title row
    const titleRow = sheet.addRow(['Yoklama Raporu']);
    titleRow.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F4C81' }
    };
    titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
    titleRow.height = 30;
    sheet.mergeCells(1, 1, 1, 5);

    // Add date row
    const dateRow = sheet.addRow([`Oluşturulma Tarihi: ${new Date().toLocaleString('tr-TR')}`]);
    dateRow.font = { size: 10, italic: true };
    dateRow.alignment = { horizontal: 'right' };
    sheet.mergeCells(2, 1, 2, 5);

    // Add empty row
    sheet.addRow([]);

    // Add header row
    const headers = ['Öğrenci No', 'Ad Soyad', 'Toplam Devam', 'Toplam Yoklama', 'Devamsızlık (%)'];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });

    // Add data rows
    report.forEach((row, index) => {
      const dataRow = sheet.addRow([
        row.studentNumber,
        row.fullName,
        row.presentCount,
        row.totalCount,
        row.absencePercent
      ]);
      dataRow.alignment = { vertical: 'middle', horizontal: 'left' };
      dataRow.height = 20;
      
      // Alternate row colors
      if (index % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }
      
      dataRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    // Set column widths
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 25;
    sheet.getColumn(3).width = 15;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 18;

    // Freeze header row
    sheet.views = [
      { state: 'frozen', ySplit: 4 }
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="yoklama_raporu.xlsx"');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: 'Excel export başarısız', details: err.message });
  }
};
