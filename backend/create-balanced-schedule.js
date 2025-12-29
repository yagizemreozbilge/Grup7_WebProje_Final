const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBalancedSchedule() {
  try {
    console.log('Creating balanced schedule for student enrollments...');

    // Önce mevcut schedule'ları sil
    console.log('Deleting existing schedules...');
    await prisma.schedule.deleteMany({});
    console.log('Existing schedules deleted.');

    // Öğrencilerin kayıtlı olduğu tüm aktif dersleri al
    const enrollments = await prisma.enrollments.findMany({
      where: {
        status: 'active'
      },
      include: {
        section: {
          include: {
            courses: true
          }
        },
        student: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`Found ${enrollments.length} active enrollments`);

    // Mevcut sınıfları al veya oluştur
    let classrooms = await prisma.classrooms.findMany();
    
    if (classrooms.length === 0) {
      console.log('Creating sample classrooms...');
      classrooms = await Promise.all([
        prisma.classrooms.create({
          data: {
            building: 'A Blok',
            room_number: '101',
            capacity: 50
          }
        }),
        prisma.classrooms.create({
          data: {
            building: 'A Blok',
            room_number: '102',
            capacity: 50
          }
        }),
        prisma.classrooms.create({
          data: {
            building: 'B Blok',
            room_number: '201',
            capacity: 60
          }
        }),
        prisma.classrooms.create({
          data: {
            building: 'B Blok',
            room_number: '202',
            capacity: 60
          }
        }),
        prisma.classrooms.create({
          data: {
            building: 'C Blok',
            room_number: '301',
            capacity: 40
          }
        }),
        prisma.classrooms.create({
          data: {
            building: 'C Blok',
            room_number: '302',
            capacity: 40
          }
        })
      ]);
      console.log(`Created ${classrooms.length} classrooms`);
    }

    // 4 güne eşit dağıtım için zaman çizelgesi
    const days = ['monday', 'tuesday', 'wednesday', 'thursday'];
    const timeSlots = [
      { start: '09:00', end: '10:30' },
      { start: '10:45', end: '12:15' },
      { start: '13:30', end: '15:00' }
    ];

    // Her ders için 2 gün ve 2 saat seç (toplam 10 schedule, 4 güne dağıtılacak)
    // Hedef: Her günde 2-3 ders, saatler çeşitli
    
    const schedulePlan = [
      // CENG101: Pazartesi ve Çarşamba
      { courseIndex: 0, day1: 'monday', slot1: 0, day2: 'wednesday', slot2: 1 },
      // MATH102: Salı ve Perşembe
      { courseIndex: 1, day1: 'tuesday', slot1: 0, day2: 'thursday', slot2: 1 },
      // MATH101: Çarşamba ve Perşembe
      { courseIndex: 2, day1: 'wednesday', slot1: 0, day2: 'thursday', slot2: 2 },
      // CENG201: Pazartesi ve Salı
      { courseIndex: 3, day1: 'monday', slot1: 1, day2: 'tuesday', slot2: 1 },
      // CENG301: Salı ve Perşembe (farklı saatler)
      { courseIndex: 4, day1: 'tuesday', slot1: 2, day2: 'thursday', slot2: 0 }
    ];

    let createdCount = 0;
    const schedules = [];

    schedulePlan.forEach((plan, index) => {
      if (index >= enrollments.length) return;
      
      const enrollment = enrollments[plan.courseIndex];
      const sectionId = enrollment.section_id;
      const courseCode = enrollment.section.courses.code;
      
      const slot1 = timeSlots[plan.slot1];
      const slot2 = timeSlots[plan.slot2];
      
      const classroom1 = classrooms[index % classrooms.length];
      const classroom2 = classrooms[(index + 1) % classrooms.length];

      schedules.push({
        section_id: sectionId,
        day_of_week: plan.day1,
        start_time: slot1.start,
        end_time: slot1.end,
        classroom_id: classroom1.id,
        courseCode
      });

      schedules.push({
        section_id: sectionId,
        day_of_week: plan.day2,
        start_time: slot2.start,
        end_time: slot2.end,
        classroom_id: classroom2.id,
        courseCode
      });
    });

    // Tüm schedule'ları veritabanına kaydet
    for (const schedule of schedules) {
      try {
        await prisma.schedule.create({
          data: {
            section_id: schedule.section_id,
            day_of_week: schedule.day_of_week,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            classroom_id: schedule.classroom_id
          }
        });
        createdCount++;
        const classroom = classrooms.find(c => c.id === schedule.classroom_id);
        console.log(`Created schedule for ${schedule.courseCode} - ${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time} in ${classroom.building} ${classroom.room_number}`);
      } catch (error) {
        console.error(`Error creating schedule for ${schedule.courseCode}:`, error.message);
      }
    }

    // Dağılımı kontrol et
    const dayCounts = { monday: 0, tuesday: 0, wednesday: 0, thursday: 0 };
    schedules.forEach(s => {
      dayCounts[s.day_of_week]++;
    });

    console.log(`\nSummary:`);
    console.log(`- Created: ${createdCount} schedules`);
    console.log(`- Total enrollments: ${enrollments.length}`);
    console.log(`- Distribution:`);
    Object.keys(dayCounts).forEach(day => {
      console.log(`  ${day}: ${dayCounts[day]} classes`);
    });

    // Oluşturulan schedule'ları göster
    const allSchedules = await prisma.schedule.findMany({
      include: {
        section: {
          include: {
            courses: true
          }
        },
        classroom: true
      },
      orderBy: [
        { day_of_week: 'asc' },
        { start_time: 'asc' }
      ]
    });

    console.log('\nCreated schedules by day:');
    const schedulesByDay = {};
    allSchedules.forEach(s => {
      const day = s.day_of_week;
      if (!schedulesByDay[day]) schedulesByDay[day] = [];
      schedulesByDay[day].push(s);
    });

    Object.keys(schedulesByDay).sort().forEach(day => {
      console.log(`\n${day.toUpperCase()} (${schedulesByDay[day].length} classes):`);
      schedulesByDay[day].forEach(s => {
        console.log(`  - ${s.section.courses.code}: ${s.start_time}-${s.end_time} (${s.classroom.building} ${s.classroom.room_number})`);
      });
    });

  } catch (error) {
    console.error('Error creating schedules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createBalancedSchedule()
  .then(() => {
    console.log('\nBalanced schedule creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Balanced schedule creation failed:', error);
    process.exit(1);
  });
