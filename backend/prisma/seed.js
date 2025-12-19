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