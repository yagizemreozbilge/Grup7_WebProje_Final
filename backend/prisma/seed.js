require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123', 10);
  const now = new Date();

  // Departments
  const deptCE = '11111111-1111-1111-1111-111111111111';
  const departments = [
    { id: deptCE, name: 'Bilgisayar Mühendisliği', code: 'CENG', facultyName: 'Mühendislik Fakültesi' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', facultyName: 'Mühendislik Fakültesi' }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: {
        id: dept.id,
        name: dept.name,
        code: dept.code,
        facultyName: dept.facultyName,
        createdAt: now,
        updated_at: now
      }
    });
  }

  // Users
  const adminEmail = 'admin@campus.edu.tr';
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: password,
      role: 'admin',
      fullName: 'Admin User',
      isVerified: true,
      createdAt: now,
      updatedAt: now
    }
  });

  // Faculty & Student Seeding
  const facultyEmail = 'faculty1@campus.edu.tr';
  const facultyUser = await prisma.user.upsert({
    where: { email: facultyEmail },
    update: {},
    create: {
      email: facultyEmail,
      passwordHash: password,
      role: 'faculty',
      fullName: 'Faculty One',
      isVerified: true,
      faculty: {
        create: {
          employeeNumber: 'EMP001',
          title: 'Professor',
          departmentId: deptCE,
          created_at: now,
          updated_at: now
        }
      }
    },
    include: { faculty: true }
  });

  const studentEmail = 'student1@campus.edu.tr';
  const studentUser = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      email: studentEmail,
      passwordHash: password,
      role: 'student',
      fullName: 'Ahmet Yılmaz',
      isVerified: true,
      student: {
        create: {
          studentNumber: '20210001',
          departmentId: deptCE,
          gpa: 0,
          cgpa: 0,
          created_at: now,
          updated_at: now
        }
      }
    },
    include: { student: true }
  });

  // Part 3: Meal Service, Events, Scheduling
  const cafeId = 'cafe1111-1111-1111-1111-111111111111';
  const cafeteria = await prisma.cafeteria.upsert({
    where: { id: cafeId },
    update: {},
    create: {
      id: cafeId,
      name: 'Ana Kafeterya',
      location: 'Merkez Bina, Zemin Kat',
      capacity: 500
    }
  });

  // Wallets
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        balance: user.role === 'student' ? 100.0 : 0.0,
        currency: 'TRY',
        isActive: true
      }
    });
  }

  // Meal Menus - Create menus for next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const mealTypes = ['breakfast', 'lunch', 'dinner'];
  const mealMenus = [
    { main: 'Omlet', side: 'Peynir, Zeytin, Domates', dessert: 'Reçel', calories: 450, protein: 20 },
    { main: 'Tavuk Izgara', side: 'Pilav, Salata', dessert: 'Sütlaç', calories: 650, protein: 45 },
    { main: 'Köfte', side: 'Makarna, Salata', dessert: 'Baklava', calories: 700, protein: 50 }
  ];

  let createdMenus = 0;
  for (let day = 0; day < 7; day++) {
    const menuDate = new Date(today);
    menuDate.setDate(today.getDate() + day);
    
    for (let i = 0; i < mealTypes.length; i++) {
      const mealType = mealTypes[i];
      const mealMenu = mealMenus[i];
      
      try {
        await prisma.mealMenu.create({
          data: {
            cafeteriaId: cafeteria.id,
            date: menuDate,
            mealType: mealType,
            itemsJson: { 
              main: mealMenu.main, 
              side: mealMenu.side, 
              dessert: mealMenu.dessert 
            },
            nutritionJson: { 
              calories: mealMenu.calories, 
              protein: mealMenu.protein,
              carbs: Math.round(mealMenu.calories * 0.5),
              fat: Math.round(mealMenu.calories * 0.3)
            },
            isPublished: true
          }
        });
        createdMenus++;
      } catch (err) {
        // Menu already exists, skip
      }
    }
  }
  console.log(`Created ${createdMenus} meal menus.`);

  // Events
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (adminUser) {
    // Gelecek tarihlerde etkinlikler oluştur
    const eventDates = [
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 gün sonra
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 hafta sonra
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 gün sonra
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 hafta sonra
      new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 hafta sonra
    ];

    const events = [
      {
        title: 'Yapay Zeka ve Makine Öğrenmesi Konferansı',
        description: 'Yapay zeka teknolojilerinin güncel durumu ve geleceği hakkında kapsamlı bir konferans. Alanında uzman konuşmacılar ve pratik uygulamalar.',
        category: 'conference',
        date: eventDates[0],
        startTime: '10:00',
        endTime: '17:00',
        location: 'Konferans Salonu A',
        capacity: 200,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[0].getTime() - 24 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Web Geliştirme Workshop',
        description: 'React ve Node.js kullanarak modern web uygulamaları geliştirme workshop\'u. Hands-on coding deneyimi.',
        category: 'workshop',
        date: eventDates[1],
        startTime: '14:00',
        endTime: '18:00',
        location: 'Bilgisayar Laboratuvarı B201',
        capacity: 30,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[1].getTime() - 12 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Kampüs Spor Turnuvası',
        description: 'Futbol, basketbol ve voleybol turnuvaları. Tüm öğrenciler ve personel katılabilir.',
        category: 'sports',
        date: eventDates[2],
        startTime: '09:00',
        endTime: '18:00',
        location: 'Spor Kompleksi',
        capacity: 500,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[2].getTime() - 48 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Akademik Kariyer Günleri',
        description: 'Akademik kariyer yapmak isteyen öğrenciler için seminer ve networking etkinliği.',
        category: 'academic',
        date: eventDates[3],
        startTime: '13:00',
        endTime: '16:00',
        location: 'Konferans Salonu B',
        capacity: 150,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[3].getTime() - 24 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Kültür ve Sanat Festivali',
        description: 'Müzik, tiyatro ve görsel sanatlar festivali. Öğrenci kulüpleri ve misafir sanatçılar.',
        category: 'cultural',
        date: eventDates[4],
        startTime: '11:00',
        endTime: '20:00',
        location: 'Açık Hava Amfisi',
        capacity: 1000,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[4].getTime() - 72 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Öğrenci Sosyal Etkinliği',
        description: 'Yeni öğrenciler için tanışma ve kaynaşma etkinliği. Müzik, yemek ve eğlence.',
        category: 'social',
        date: eventDates[0],
        startTime: '18:00',
        endTime: '22:00',
        location: 'Öğrenci Merkezi',
        capacity: 300,
        registeredCount: 0,
        registrationDeadline: new Date(eventDates[0].getTime() - 6 * 60 * 60 * 1000),
        isPaid: false,
        price: null,
        status: 'published'
      }
    ];

    const eventIds = [
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222',
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666'
    ];

    for (let i = 0; i < events.length; i++) {
      const eventData = events[i];
      const eventId = eventIds[i];
      
      await prisma.event.upsert({
        where: { id: eventId },
        update: {},
        create: {
          id: eventId,
          ...eventData
        }
      }).catch((err) => {
        console.log(`Event "${eventData.title}" could not be created:`, err.message);
      });
    }

    console.log(`Created ${events.length} events.`);
  }

  // Classrooms
  const classroomIds = [
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444',
    '55555555-5555-5555-5555-555555555555',
    '66666666-6666-6666-6666-666666666666',
    '77777777-7777-7777-7777-777777777777',
    '88888888-8888-8888-8888-888888888888',
    '99999999-9999-9999-9999-999999999999',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd'
  ];

  const classrooms = [
    { id: classroomIds[0], building: 'A Blok', room_number: '101', capacity: 50 },
    { id: classroomIds[1], building: 'A Blok', room_number: '102', capacity: 50 },
    { id: classroomIds[2], building: 'A Blok', room_number: '201', capacity: 80 },
    { id: classroomIds[3], building: 'A Blok', room_number: '202', capacity: 80 },
    { id: classroomIds[4], building: 'A Blok', room_number: '301', capacity: 100 },
    { id: classroomIds[5], building: 'B Blok', room_number: '101', capacity: 60 },
    { id: classroomIds[6], building: 'B Blok', room_number: '102', capacity: 60 },
    { id: classroomIds[7], building: 'B Blok', room_number: '201', capacity: 40 },
    { id: classroomIds[8], building: 'B Blok', room_number: '202', capacity: 40 },
    { id: classroomIds[9], building: 'C Blok', room_number: '101', capacity: 120 },
    { id: classroomIds[10], building: 'C Blok', room_number: '102', capacity: 120 },
    { id: classroomIds[11], building: 'C Blok', room_number: '201', capacity: 30 },
    { id: classroomIds[12], building: 'C Blok', room_number: '202', capacity: 30 }
  ];

  for (const classroomData of classrooms) {
    await prisma.classrooms.upsert({
      where: { id: classroomData.id },
      update: {},
      create: classroomData
    }).catch((err) => {
      console.log(`Classroom ${classroomData.building} ${classroomData.room_number} could not be created:`, err.message);
    });
  }

  console.log(`Created ${classrooms.length} classrooms.`);

  // Courses & Course Sections
  console.log('🔍 Checking facultyUser for courses...');
  console.log('facultyUser exists:', !!facultyUser);
  console.log('facultyUser.faculty exists:', !!(facultyUser && facultyUser.faculty));
  
  if (facultyUser && facultyUser.faculty) {
    console.log('📚 Dersler ve şubeler ekleniyor...');
    
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

    console.log(`Created ${courses.length} courses and ${sections.length} sections.`);
  } else {
    console.log('⚠️  Faculty user veya faculty profile bulunamadı, courses eklenemedi.');
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
    const sensorNow = new Date();
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(sensorNow.getTime() - i * 60 * 60 * 1000);
      let value;
      
      if (sensor.type === 'temperature') {
        value = (20 + Math.random() * 5).toFixed(2); // 20-25°C
      } else if (sensor.type === 'humidity') {
        value = (40 + Math.random() * 20).toFixed(2); // 40-60%
      } else if (sensor.type === 'light') {
        value = (300 + Math.random() * 200).toFixed(2); // 300-500 lux
      } else {
        value = '0';
      }

      await prisma.sensorData.create({
        data: {
          sensorId: createdSensor.id,
          value: value,
          unit: sensor.unit,
          timestamp: timestamp,
          metadata: {}
        }
      }).catch(() => {
        // Data already exists, skip
      });
    }
  }

  console.log(`Created ${sensors.length} sensors with 24 hours of data each.`);
  console.log('Seed completed successfully for Part 3.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });