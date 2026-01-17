require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('📦 Test verileri ekleniyor...');

    // Departments
    const deptCE = '11111111-1111-1111-1111-111111111111';
    
    // Get faculty user
    const facultyUser = await prisma.user.findUnique({
      where: { email: 'faculty1@campus.edu.tr' },
      include: { faculty: true }
    });

    if (!facultyUser || !facultyUser.faculty) {
      console.log('⚠️  Faculty user bulunamadı. Önce seed çalıştırın.');
      return;
    }

    // Courses
    console.log('📚 Dersler ekleniyor...');
    const courses = [
      {
        id: 'course1111-1111-1111-1111-111111111111',
        code: 'CENG101',
        name: 'Programlamaya Giriş',
        description: 'Temel programlama kavramları ve algoritma tasarımı',
        credits: 4,
        departmentId: deptCE,
        semester: 'fall',
        year: 2024,
        isActive: true
      },
      {
        id: 'course2222-2222-2222-2222-222222222222',
        code: 'CENG201',
        name: 'Veri Yapıları',
        description: 'Temel veri yapıları ve algoritmalar',
        credits: 4,
        departmentId: deptCE,
        semester: 'fall',
        year: 2024,
        isActive: true
      },
      {
        id: 'course3333-3333-3333-3333-333333333333',
        code: 'CENG301',
        name: 'Yazılım Mühendisliği',
        description: 'Yazılım geliştirme süreçleri ve metodolojileri',
        credits: 3,
        departmentId: deptCE,
        semester: 'spring',
        year: 2024,
        isActive: true
      }
    ];

    for (const course of courses) {
      await prisma.course.upsert({
        where: { id: course.id },
        update: {},
        create: course
      });
    }

    // Course Sections
    console.log('📖 Ders şubeleri ekleniyor...');
    const sections = [
      {
        id: 'section1111-1111-1111-1111-111111111111',
        courseId: 'course1111-1111-1111-1111-111111111111',
        sectionNumber: 1,
        semester: 'fall',
        year: 2024,
        instructorId: facultyUser.faculty.id,
        capacity: 50,
        enrolledCount: 0,
        scheduleJson: {
          days: ['Monday', 'Wednesday'],
          startTime: '09:00',
          endTime: '10:30',
          room: 'A101'
        }
      },
      {
        id: 'section2222-2222-2222-2222-222222222222',
        courseId: 'course2222-2222-2222-2222-222222222222',
        sectionNumber: 1,
        semester: 'fall',
        year: 2024,
        instructorId: facultyUser.faculty.id,
        capacity: 40,
        enrolledCount: 0,
        scheduleJson: {
          days: ['Tuesday', 'Thursday'],
          startTime: '14:00',
          endTime: '15:30',
          room: 'A201'
        }
      }
    ];

    for (const section of sections) {
      await prisma.courseSection.upsert({
        where: { id: section.id },
        update: {},
        create: section
      });
    }

    // Sensors
    console.log('🔌 Sensörler ekleniyor...');
    const sensors = [
      {
        sensorId: 'TEMP-A101-01',
        name: 'Sıcaklık Sensörü - A101',
        type: 'temperature',
        location: 'A Blok, 101 Numaralı Derslik',
        unit: '°C',
        isActive: true,
        metadata: { building: 'A Blok', floor: 1, room: '101' }
      },
      {
        sensorId: 'HUM-A101-01',
        name: 'Nem Sensörü - A101',
        type: 'humidity',
        location: 'A Blok, 101 Numaralı Derslik',
        unit: '%',
        isActive: true,
        metadata: { building: 'A Blok', floor: 1, room: '101' }
      },
      {
        sensorId: 'LIGHT-A101-01',
        name: 'Işık Sensörü - A101',
        type: 'light',
        location: 'A Blok, 101 Numaralı Derslik',
        unit: 'lux',
        isActive: true,
        metadata: { building: 'A Blok', floor: 1, room: '101' }
      },
      {
        sensorId: 'TEMP-A201-01',
        name: 'Sıcaklık Sensörü - A201',
        type: 'temperature',
        location: 'A Blok, 201 Numaralı Derslik',
        unit: '°C',
        isActive: true,
        metadata: { building: 'A Blok', floor: 2, room: '201' }
      },
      {
        sensorId: 'HUM-A201-01',
        name: 'Nem Sensörü - A201',
        type: 'humidity',
        location: 'A Blok, 201 Numaralı Derslik',
        unit: '%',
        isActive: true,
        metadata: { building: 'A Blok', floor: 2, room: '201' }
      }
    ];

    for (const sensor of sensors) {
      const createdSensor = await prisma.sensor.upsert({
        where: { sensorId: sensor.sensorId },
        update: {},
        create: sensor
      });

      // Her sensör için son 24 saatlik veri ekle
      const now = new Date();
      for (let i = 0; i < 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        let value;
        
        if (sensor.type === 'temperature') {
          value = 20 + Math.random() * 5; // 20-25°C
        } else if (sensor.type === 'humidity') {
          value = 40 + Math.random() * 20; // 40-60%
        } else if (sensor.type === 'light') {
          value = 300 + Math.random() * 200; // 300-500 lux
        }

        await prisma.sensorData.create({
          data: {
            sensorId: createdSensor.id,
            value: value.toString(),
            unit: sensor.unit,
            timestamp: timestamp,
            metadata: {}
          }
        });
      }
    }

    console.log('✅ Test verileri başarıyla eklendi!');
    console.log(`   - ${courses.length} ders eklendi`);
    console.log(`   - ${sections.length} ders şubesi eklendi`);
    console.log(`   - ${sensors.length} sensör eklendi`);
    console.log(`   - Her sensör için 24 saatlik veri eklendi`);

  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTestData();

