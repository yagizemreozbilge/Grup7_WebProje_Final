const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123', 10);

  // Departments
  const now = new Date();
  const deptCE = '11111111-1111-1111-1111-111111111111';
  const deptEE = '22222222-2222-2222-2222-222222222222';
  const deptME = '33333333-3333-3333-3333-333333333333';
  
  await prisma.department.upsert({
    where: { id: deptCE },
    update: {},
    create: { id: deptCE, name: 'Computer Engineering', code: 'CE', facultyName: 'Engineering', createdAt: now, updated_at: now }
  });
  await prisma.department.upsert({
    where: { id: deptEE },
    update: {},
    create: { id: deptEE, name: 'Electrical Engineering', code: 'EE', facultyName: 'Engineering', createdAt: now, updated_at: now }
  });
  await prisma.department.upsert({
    where: { id: deptME },
    update: {},
    create: { id: deptME, name: 'Mechanical Engineering', code: 'ME', facultyName: 'Engineering', createdAt: now, updated_at: now }
  });

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@campus.edu.tr' },
    update: {},
    create: {
      email: 'admin@campus.edu.tr',
      passwordHash: password,
      role: 'admin',
      fullName: 'Admin User',
      isVerified: true,
      createdAt: now,
      updatedAt: now
    }
  });

  const facultyUsers = await Promise.all([
    prisma.user.upsert({
      where: { email: 'faculty1@campus.edu.tr' },
      update: {},
      create: {
        email: 'faculty1@campus.edu.tr',
        passwordHash: password,
        role: 'faculty',
        fullName: 'Faculty One',
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        faculty: {
          create: {
            employeeNumber: 'EMP001',
            title: 'Professor',
            departmentId: deptCE,
            created_at: now,
            updated_at: now
          }
        }
      }
    }),
    prisma.user.upsert({
      where: { email: 'faculty2@campus.edu.tr' },
      update: {},
      create: {
        email: 'faculty2@campus.edu.tr',
        passwordHash: password,
        role: 'faculty',
        fullName: 'Faculty Two',
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        faculty: {
          create: {
            employeeNumber: 'EMP002',
            title: 'Associate Professor',
            departmentId: deptEE,
            created_at: now,
            updated_at: now
          }
        }
      }
    })
  ]);

  const students = [
    { email: 'student1@campus.edu.tr', number: '20210001', dept: deptCE },
    { email: 'student2@campus.edu.tr', number: '20210002', dept: deptCE },
    { email: 'student3@campus.edu.tr', number: '20210003', dept: deptEE },
    { email: 'student4@campus.edu.tr', number: '20210004', dept: deptEE },
    { email: 'student5@campus.edu.tr', number: '20210005', dept: deptME }
  ];

  for (const student of students) {
    await prisma.user.upsert({
      where: { email: student.email },
      update: {},
      create: {
        email: student.email,
        passwordHash: password,
        role: 'student',
        fullName: student.email.split('@')[0],
        isVerified: true,
        createdAt: now,
        updatedAt: now,
        student: {
          create: {
            studentNumber: student.number,
            departmentId: student.dept,
            gpa: 0,
            cgpa: 0,
            created_at: now,
            updated_at: now
          }
        }
      }
    });
  }

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

