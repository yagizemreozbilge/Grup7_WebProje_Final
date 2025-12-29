const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSchedule() {
  try {
    // Öğrenciyi bul
    const student = await prisma.student.findFirst({
      include: {
        enrollments: {
          where: { status: 'active' },
          include: {
            section: {
              include: {
                courses: true,
                schedules: {
                  include: {
                    classroom: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!student) {
      console.log('No student found');
      return;
    }

    console.log(`Student: ${student.studentNumber}`);
    console.log(`Enrollments: ${student.enrollments.length}`);

    student.enrollments.forEach(enrollment => {
      const section = enrollment.section;
      console.log(`\nSection: ${section.courses.code} - ${section.courses.name}`);
      console.log(`Schedules: ${section.schedules.length}`);
      
      section.schedules.forEach(schedule => {
        console.log(`  - ${schedule.day_of_week}: ${schedule.start_time} - ${schedule.end_time}`);
        console.log(`    Classroom: ${schedule.classroom.building} ${schedule.classroom.room_number}`);
      });
    });

    // Schedule verilerini kontrol et
    const allSchedules = await prisma.schedule.findMany({
      include: {
        section: {
          include: {
            courses: true
          }
        },
        classroom: true
      }
    });

    console.log(`\nTotal schedules in database: ${allSchedules.length}`);
    allSchedules.forEach(s => {
      console.log(`  - ${s.section.courses.code}: ${s.day_of_week} ${s.start_time}-${s.end_time}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSchedule();


