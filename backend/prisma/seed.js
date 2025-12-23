require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

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
      where: { user_id: user.id },
      update: {},
      create: {
        user_id: user.id,
        balance: user.role === 'student' ? 100.0 : 0.0,
        currency: 'TRY',
        is_active: true
      }
    });
  }

  // Meal Menus
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.mealMenu.create({
    data: {
      cafeteria_id: cafeteria.id,
      date: today,
      meal_type: 'lunch',
      items_json: { main: 'Tavuk Izgara', side: 'Pilav', dessert: 'Sütlaç' },
      nutrition_json: { calories: 650, protein: 45 },
      is_published: true
    }
  }).catch(() => console.log("Today's menu already exists."));

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
        start_time: '10:00',
        end_time: '17:00',
        location: 'Konferans Salonu A',
        capacity: 200,
        registered_count: 0,
        registration_deadline: new Date(eventDates[0].getTime() - 24 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Web Geliştirme Workshop',
        description: 'React ve Node.js kullanarak modern web uygulamaları geliştirme workshop\'u. Hands-on coding deneyimi.',
        category: 'workshop',
        date: eventDates[1],
        start_time: '14:00',
        end_time: '18:00',
        location: 'Bilgisayar Laboratuvarı B201',
        capacity: 30,
        registered_count: 0,
        registration_deadline: new Date(eventDates[1].getTime() - 12 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Kampüs Spor Turnuvası',
        description: 'Futbol, basketbol ve voleybol turnuvaları. Tüm öğrenciler ve personel katılabilir.',
        category: 'sports',
        date: eventDates[2],
        start_time: '09:00',
        end_time: '18:00',
        location: 'Spor Kompleksi',
        capacity: 500,
        registered_count: 0,
        registration_deadline: new Date(eventDates[2].getTime() - 48 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Akademik Kariyer Günleri',
        description: 'Akademik kariyer yapmak isteyen öğrenciler için seminer ve networking etkinliği.',
        category: 'academic',
        date: eventDates[3],
        start_time: '13:00',
        end_time: '16:00',
        location: 'Konferans Salonu B',
        capacity: 150,
        registered_count: 0,
        registration_deadline: new Date(eventDates[3].getTime() - 24 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Kültür ve Sanat Festivali',
        description: 'Müzik, tiyatro ve görsel sanatlar festivali. Öğrenci kulüpleri ve misafir sanatçılar.',
        category: 'cultural',
        date: eventDates[4],
        start_time: '11:00',
        end_time: '20:00',
        location: 'Açık Hava Amfisi',
        capacity: 1000,
        registered_count: 0,
        registration_deadline: new Date(eventDates[4].getTime() - 72 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      },
      {
        title: 'Öğrenci Sosyal Etkinliği',
        description: 'Yeni öğrenciler için tanışma ve kaynaşma etkinliği. Müzik, yemek ve eğlence.',
        category: 'social',
        date: eventDates[0],
        start_time: '18:00',
        end_time: '22:00',
        location: 'Öğrenci Merkezi',
        capacity: 300,
        registered_count: 0,
        registration_deadline: new Date(eventDates[0].getTime() - 6 * 60 * 60 * 1000),
        is_paid: false,
        price: null,
        status: 'published'
      }
    ];

    for (const eventData of events) {
      const eventId = uuidv4();
      
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