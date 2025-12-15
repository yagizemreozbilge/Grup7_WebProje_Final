const prisma = require('../prisma');

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
