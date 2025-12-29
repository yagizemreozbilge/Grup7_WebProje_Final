const { PrismaClient } = require('@prisma/client');
const SchedulingService = require('./src/services/SchedulingService');
const prisma = new PrismaClient();

async function testGetUserSchedule() {
  try {
    // İlk öğrenciyi bul
    const student = await prisma.student.findFirst({
      include: {
        user: true
      }
    });

    if (!student) {
      console.log('No student found');
      return;
    }

    console.log(`Testing getUserSchedule for student: ${student.studentNumber}`);
    console.log(`User ID: ${student.userId}`);
    console.log(`User Role: ${student.user.role}`);

    const weeklySchedule = await SchedulingService.getUserSchedule(student.userId, student.user.role);

    console.log('\nWeekly Schedule Result:');
    console.log(JSON.stringify(weeklySchedule, null, 2));

    // Her gün için kontrol et
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      const classes = weeklySchedule[day];
      if (classes && classes.length > 0) {
        console.log(`\n${day.toUpperCase()}:`);
        classes.forEach(cls => {
          console.log(`  - ${cls.course_code}: ${cls.start_time} - ${cls.end_time} (${cls.classroom.building} ${cls.classroom.room_number})`);
        });
      } else {
        console.log(`\n${day.toUpperCase()}: No classes`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testGetUserSchedule();


