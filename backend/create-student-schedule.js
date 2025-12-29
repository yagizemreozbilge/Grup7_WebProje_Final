const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createStudentSchedule() {
  try {
    console.log('Creating schedules for student enrollments...');

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
        })
      ]);
      console.log(`Created ${classrooms.length} classrooms`);
    }

    // Her enrollment için schedule oluştur
    const timeSlots = [
      { day: 'monday', start: '09:00', end: '10:30' },
      { day: 'monday', start: '10:45', end: '12:15' },
      { day: 'monday', start: '13:30', end: '15:00' },
      { day: 'tuesday', start: '09:00', end: '10:30' },
      { day: 'tuesday', start: '10:45', end: '12:15' },
      { day: 'tuesday', start: '13:30', end: '15:00' },
      { day: 'wednesday', start: '09:00', end: '10:30' },
      { day: 'wednesday', start: '10:45', end: '12:15' },
      { day: 'wednesday', start: '13:30', end: '15:00' },
      { day: 'thursday', start: '09:00', end: '10:30' },
      { day: 'thursday', start: '10:45', end: '12:15' },
      { day: 'thursday', start: '13:30', end: '15:00' },
      { day: 'friday', start: '09:00', end: '10:30' },
      { day: 'friday', start: '10:45', end: '12:15' },
      { day: 'friday', start: '13:30', end: '15:00' }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const enrollment of enrollments) {
      const sectionId = enrollment.section_id;
      
      // Bu section için zaten schedule var mı kontrol et
      const existingSchedule = await prisma.schedule.findFirst({
        where: { section_id: sectionId }
      });

      if (existingSchedule) {
        console.log(`Schedule already exists for section ${sectionId} (${enrollment.section.courses.code})`);
        skippedCount++;
        continue;
      }

      // Her ders için 2-3 saatlik schedule oluştur
      const courseCode = enrollment.section.courses.code;
      const courseName = enrollment.section.courses.name;
      
      // Ders koduna göre farklı günler ve saatler seç
      const courseIndex = enrollments.indexOf(enrollment);
      const slotsToUse = timeSlots.slice(courseIndex % timeSlots.length, (courseIndex % timeSlots.length) + 2);
      
      // Eğer yeterli slot yoksa, baştan başla
      const actualSlots = slotsToUse.length === 2 ? slotsToUse : [
        timeSlots[courseIndex % timeSlots.length],
        timeSlots[(courseIndex + 1) % timeSlots.length]
      ];

      for (const slot of actualSlots) {
        const classroom = classrooms[courseIndex % classrooms.length];
        
        try {
          await prisma.schedule.create({
            data: {
              section_id: sectionId,
              day_of_week: slot.day,
              start_time: slot.start,
              end_time: slot.end,
              classroom_id: classroom.id
            }
          });
          createdCount++;
          console.log(`Created schedule for ${courseCode} - ${slot.day} ${slot.start}-${slot.end} in ${classroom.building} ${classroom.room_number}`);
        } catch (error) {
          console.error(`Error creating schedule for ${courseCode}:`, error.message);
        }
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Created: ${createdCount} schedules`);
    console.log(`- Skipped: ${skippedCount} sections (already have schedules)`);
    console.log(`- Total enrollments: ${enrollments.length}`);

  } catch (error) {
    console.error('Error creating schedules:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createStudentSchedule()
  .then(() => {
    console.log('Schedule creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schedule creation failed:', error);
    process.exit(1);
  });


