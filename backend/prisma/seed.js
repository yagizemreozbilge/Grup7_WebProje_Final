const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Password123', 10);

  // Departments
  const now = new Date();
  const deptCE = '11111111-1111-1111-1111-111111111111'; // Computer Engineering
  const deptEE = '22222222-2222-2222-2222-222222222222'; // Electrical Engineering
  const deptME = '33333333-3333-3333-3333-333333333333'; // Mechanical Engineering
  const deptMATH = '44444444-4444-4444-4444-444444444444'; // Mathematics
  const deptCIVIL = '55555555-5555-5555-5555-555555555555'; // Civil Engineering
  const deptIE = '66666666-6666-6666-6666-666666666666'; // Industrial Engineering
  const deptARCH = '77777777-7777-7777-7777-777777777777'; // Architecture
  const deptMED = '88888888-8888-8888-8888-888888888888'; // Medicine
  const deptLAW = '99999999-9999-9999-9999-999999999999'; // Law
  const deptPSY = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; // Psychology
  const deptBUS = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'; // Business

  const departments = [
    { id: deptCE, name: 'Bilgisayar Mühendisliği', code: 'CENG', facultyName: 'Mühendislik Fakültesi' },
    { id: deptEE, name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE', facultyName: 'Mühendislik Fakültesi' },
    { id: deptME, name: 'Makine Mühendisliği', code: 'ME', facultyName: 'Mühendislik Fakültesi' },
    { id: deptMATH, name: 'Matematik', code: 'MATH', facultyName: 'Fen Edebiyat Fakültesi' },
    { id: deptCIVIL, name: 'İnşaat Mühendisliği', code: 'CE', facultyName: 'Mühendislik Fakültesi' },
    { id: deptIE, name: 'Endüstri Mühendisliği', code: 'IE', facultyName: 'Mühendislik Fakültesi' },
    { id: deptARCH, name: 'Mimarlık', code: 'ARCH', facultyName: 'Mimarlık Fakültesi' },
    { id: deptMED, name: 'Tıp', code: 'MED', facultyName: 'Tıp Fakültesi' },
    { id: deptLAW, name: 'Hukuk', code: 'LAW', facultyName: 'Hukuk Fakültesi' },
    { id: deptPSY, name: 'Psikoloji', code: 'PSY', facultyName: 'Fen Edebiyat Fakültesi' },
    { id: deptBUS, name: 'İşletme', code: 'BUS', facultyName: 'İktisadi ve İdari Bilimler Fakültesi' }
  ];

  for (const dept of departments) {
    try {
      await prisma.department.upsert({
        where: { id: dept.id },
        update: {},
        create: {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          facultyName: dept.facultyName, // şemada facultyName var, map("faculty")
          createdAt: now, // şemada createdAt var, map("created_at")
          updated_at: now // şemada updated_at var
        }
      });
    } catch (e) {
      if (e.code === 'P2002') {
        console.warn(`Department with code ${dept.code} already exists, skipping.`);
      } else {
        throw e;
      }
    }
  }

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
      createdAt: now, // şemada createdAt var, map("created_at")
      updatedAt: now // şemada updatedAt var, map("updated_at")
    }
  });

  const facultyData = [
    {
      email: 'faculty1@campus.edu.tr',
      passwordHash: password,
      role: 'faculty',
      fullName: 'Faculty One',
      isVerified: true,
      createdAt: now,
      updatedAt: now,
      faculty: {
        create: {
          employeeNumber: 'EMP001', // şemada employeeNumber var, map("employee_number")
          title: 'Professor',
          departmentId: deptCE, // şemada departmentId var, map("department_id")
          created_at: now, // şemada created_at var
          updated_at: now // şemada updated_at var
        }
      }
    },
    {
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
  ];
  for (const faculty of facultyData) {
    try {
      await prisma.user.upsert({
        where: { email: faculty.email },
        update: {},
        create: faculty
      });
    } catch (e) {
      if (e.code === 'P2002') {
        console.warn(`Faculty with employee number ${faculty.faculty.create.employeeNumber} already exists, skipping.`);
      } else {
        throw e;
      }
    }
  }

  const students = [
    { email: 'student1@campus.edu.tr', number: '20210001', dept: deptCE, fullName: 'Ahmet Yılmaz' },
    { email: 'student2@campus.edu.tr', number: '20210002', dept: deptCE, fullName: 'Ayşe Demir' },
    { email: 'student3@campus.edu.tr', number: '20210003', dept: deptEE, fullName: 'Mehmet Kaya' },
    { email: 'student4@campus.edu.tr', number: '20210004', dept: deptEE, fullName: 'Fatma Şahin' },
    { email: 'student5@campus.edu.tr', number: '20210005', dept: deptME, fullName: 'Ali Çelik' }
  ];

  for (const student of students) {
    try {
      await prisma.user.upsert({
        where: { email: student.email },
        update: {},
        create: {
          email: student.email,
          passwordHash: password,
          role: 'student',
          fullName: student.fullName,
          isVerified: true,
          createdAt: now,
          updatedAt: now,
          student: {
            create: {
              studentNumber: student.number, // şemada studentNumber var, map("student_number")
              departmentId: student.dept, // şemada departmentId var, map("department_id")
              gpa: 0,
              cgpa: 0,
              created_at: now, // şemada created_at var
              updated_at: now // şemada updated_at var
            }
          }
        }
      });
    } catch (e) {
      if (e.code === 'P2002') {
        console.warn(`Student with number ${student.number} already exists, skipping.`);
      } else {
        throw e;
      }
    }
  }

  // --- Seed a course and a section for Computer Engineering ---
  // Bu blok isteğe bağlı örnek veriler içindir; hata alındığında tüm seed'in çökmesini engellemek için try/catch ile sarıldı.
  try {
    // Find faculty1 user and faculty
    const faculty1User = await prisma.user.findUnique({
      where: { email: 'faculty1@campus.edu.tr' }
    });

    if (!faculty1User) {
      console.warn('faculty1@campus.edu.tr kullanıcısı bulunamadı, örnek ders/section seed atlanıyor.');
    } else {
      const faculty1 = await prisma.faculty.findUnique({
        where: { userId: faculty1User.id }
      });

      if (!faculty1) {
        console.warn('Faculty kaydı bulunamadı, örnek ders/section seed atlanıyor.');
      } else {
        // Create a course for Computer Engineering (CENG)
        const courseCENG101 = await prisma.courses.upsert({
          where: { code: 'CENG101' },
          update: {},
          create: {
            id: '11111111-cccc-dddd-eeee-111111111111',
            code: 'CENG101',
            name: 'Introduction to Computer Engineering',
            description: 'Basic concepts of computer engineering.',
            credits: 4,
            department_id: deptCE,
            semester: 'fall',
            year: 2025,
            is_active: true,
            created_at: now,
            updated_at: now
          }
        });

        // Create a section for this course, assigned to faculty1
        await prisma.course_sections.upsert({
          where: {
            id: '11111111-aaaa-bbbb-cccc-111111111111'
          },
          update: {},
          create: {
            id: '11111111-aaaa-bbbb-cccc-111111111111',
            course_id: courseCENG101.id,
            section_number: 1,
            semester: 'fall',
            year: 2025,
            instructor_id: faculty1.id,
            capacity: 30,
            enrolled_count: 0,
            updated_at: now
          }
        });

        // Enroll student1 in the section as an example
        const student1User = await prisma.user.findUnique({
          where: { email: 'student1@campus.edu.tr' }
        });

        if (student1User) {
          const student1 = await prisma.student.findUnique({
            where: { userId: student1User.id }
          });

          if (student1) {
            // Create enrollment with grades
            await prisma.enrollments.upsert({
              where: {
                id: '22222222-aaaa-bbbb-cccc-222222222222'
              },
              update: {
                midterm_grade: 85,
                final_grade: 90,
                letter_grade: 'BA',
                grade_point: 3.5,
                status: 'completed'
              },
              create: {
                id: '22222222-aaaa-bbbb-cccc-222222222222',
                student_id: student1.id,
                section_id: '11111111-aaaa-bbbb-cccc-111111111111',
                status: 'completed',
                midterm_grade: 85,
                final_grade: 90,
                letter_grade: 'BA',
                grade_point: 3.5,
                enrollment_date: now,
                created_at: now,
                updated_at: now
              }
            });

            // Update student GPA/CGPA
            // CENG101 has 4 credits, grade point 3.5
            // GPA = (3.5 * 4) / 4 = 3.5
            await prisma.student.update({
              where: { id: student1.id },
              data: {
                gpa: 3.5,
                cgpa: 3.5
              }
            });
          }
        }
      }
    }
  } catch (e) {
    // Bu kısım tamamen demo amaçlı olduğu için, hata alındığında loglayıp devam ediyoruz.
    console.error('Optional course/section/enrollment seed sırasında hata alındı, atlanıyor:', e.message);
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

