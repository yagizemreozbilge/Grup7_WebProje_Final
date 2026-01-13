// src/services/attendanceService.js
// Burada iş mantığı ve veri işlemleri olacak. Şimdilik stub fonksiyonlar.

const prisma = require('../prisma');
const haversine = require('../utils/haversine');

/**
 * Checks if student is within geofence and not spoofing
 */
async function checkAttendance({ sessionId, studentId, latitude, longitude, accuracy }) {
  const session = await prisma.attendance_sessions.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');
  const distance = haversine(session.latitude, session.longitude, latitude, longitude);
  const allowed = session.geofence_radius + (accuracy || 5);
  const isFlagged = distance > allowed;
  // Save attendance record
  await prisma.attendance_records.create({
    data: {
      session_id: sessionId,
      student_id: studentId,
      check_in_time: new Date(),
      latitude,
      longitude,
      distance_from_center: distance,
      is_flagged: isFlagged,
      flag_reason: isFlagged ? 'Out of geofence' : null
    }
  });
  return { success: !isFlagged, distance, allowed };
}


module.exports = {
  checkAttendance,
  createSession: async ({ section_id, instructor_id, date, start_time, end_time, latitude, longitude }) => {
    // DB'ye yeni yoklama oturumu ekle
    // instructor_id artık Faculty ID olmalı, User ID değil
    return await prisma.attendance_sessions.create({
      data: {
        section_id,
        instructor_id: instructor_id || null, // Faculty ID
        date: new Date(date),
        start_time: new Date(start_time),
        end_time: new Date(end_time),
        latitude: latitude || 0,
        longitude: longitude || 0,
        geofence_radius: 50, // 50 metre (GPS için daha uygun)
        qr_code: '', // opsiyonel, burada üretilebilir
        status: 'active'
      }
    });
  },
  markAttendance: async (data) => {
    // ...yoklama verme mantığı
  },
  getStatus: async (userId, sessionId) => {
    // ...yoklama durumu sorgulama mantığı
  },

  getReport: async (sectionId) => {
    // 1. Dersi alan tüm öğrencileri bul
    const enrollments = await prisma.enrollments.findMany({
      where: { section_id: sectionId, status: 'active' },
      include: {
        student: {
          include: {
            user: true
          }
        }
      }
    });

    // 2. Bu section için toplam oturum sayısını bul
    const totalSessions = await prisma.attendance_sessions.count({
      where: { section_id: sectionId }
    });

    // 3. Her öğrenci için rapor oluştur
    const report = [];

    for (const enrollment of enrollments) {
      const student = enrollment.student;
      if (!student) continue;

      // Öğrencinin katıldığı oturumları say
      const presentCount = await prisma.attendance_records.count({
        where: {
          student_id: student.id,
          session: { section_id: sectionId },
          is_flagged: false // Sadece geçerli katılımlar
        }
      });

      const absenceCount = totalSessions - presentCount;
      const absencePercent = totalSessions > 0 ? (absenceCount / totalSessions) * 100 : 0;

      report.push({
        studentId: student.id,
        studentNumber: student.studentNumber || 'N/A',
        fullName: student.user ? student.user.fullName : 'Bilinmiyor',
        presentCount,
        totalCount: totalSessions,
        absencePercent: parseFloat(absencePercent.toFixed(1))
      });
    }

    return report;
  },
  submitExcuse: async ({ studentId, sessionId, reason }) => {
    if (!studentId || !sessionId || !reason) throw new Error('Eksik parametre');
    // Aynı öğrenci aynı oturum için tekrar mazeret talebi göndermesin
    const existing = await prisma.excuse_requests.findFirst({
      where: { student_id: studentId, session_id: sessionId }
    });
    if (existing) throw new Error('Bu oturum için zaten mazeret talebiniz var.');
    const excuse = await prisma.excuse_requests.create({
      data: {
        student_id: studentId,
        session_id: sessionId,
        reason,
        status: 'pending',
      }
    });
    return excuse;
  },
  markAttendanceQR: async (data) => {
    // ...QR kod ile yoklama mantığı
  }
};
