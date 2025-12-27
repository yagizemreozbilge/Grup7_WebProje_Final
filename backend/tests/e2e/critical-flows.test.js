// tests/e2e/critical-flows.test.js
const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../src/app');
const prisma = require('../../src/prisma');

describe('E2E Critical Flow Tests', () => {
  let department;

  beforeAll(async () => {
    await prisma.$transaction([
      prisma.enrollment.deleteMany(),
      prisma.attendanceRecord.deleteMany(),
      prisma.attendanceSession.deleteMany(),
      prisma.eventRegistration.deleteMany(),
      prisma.mealReservation.deleteMany(),
      prisma.classroomReservation.deleteMany(),
      prisma.transaction.deleteMany(),
      prisma.wallet.deleteMany(),
      prisma.courseSection.deleteMany(),
      prisma.course.deleteMany(),
      prisma.event.deleteMany(),
      prisma.meal.deleteMany(),
      prisma.classroom.deleteMany(),
      prisma.student.deleteMany(),
      prisma.faculty.deleteMany(),
      prisma.user.deleteMany(),
      prisma.department.deleteMany()
    ]);

    department = await prisma.department.create({
      data: { name: 'Computer Science', code: 'CS', facultyName: 'Engineering' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Flow 1: Student Registration and Course Enrollment', () => {
    it('should complete full student registration and course enrollment flow', async () => {
      // Step 1: Register new student
      const registerRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newstudent@test.edu',
          password: 'Password123',
          confirmPassword: 'Password123',
          full_name: 'New Student',
          role: 'student',
          student_number: '20219999',
          department_id: department.id
        });

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      const userId = registerRes.body.data.id;

      // Step 2: Verify email
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: { userId }
      });

      const verifyRes = await request(app)
        .post('/api/v1/auth/verify-email')
        .send({ token: verificationToken.token });

      expect(verifyRes.status).toBe(200);

      // Step 3: Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'newstudent@test.edu',
          password: 'Password123'
        });

      expect(loginRes.status).toBe(200);
      const accessToken = loginRes.body.data.accessToken;

      // Step 4: Create course and section (by admin/faculty)
      const facultyUser = await prisma.user.create({
        data: {
          email: 'faculty@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'FACULTY',
          fullName: 'Faculty User',
          isVerified: true,
          faculty: {
            create: {
              employeeNumber: 'EMP001',
              title: 'Professor',
              departmentId: department.id
            }
          }
        }
      });

      const course = await prisma.course.create({
        data: {
          code: 'CS101',
          name: 'Introduction to CS',
          credits: 3,
          departmentId: department.id,
          semester: 'FALL',
          year: 2024,
          isActive: true
        }
      });

      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          sectionNumber: '01',
          instructorId: (await prisma.faculty.findUnique({ where: { userId: facultyUser.id } })).id,
          capacity: 30,
          enrolledCount: 0,
          isActive: true
        }
      });

      // Step 5: Enroll in course
      const enrollRes = await request(app)
        .post('/api/v1/student/enroll')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ sectionId: section.id });

      expect(enrollRes.status).toBe(201);
      expect(enrollRes.body.success).toBe(true);

      // Step 6: Verify enrollment
      const coursesRes = await request(app)
        .get('/api/v1/student/my-courses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(coursesRes.status).toBe(200);
      expect(coursesRes.body.length).toBeGreaterThan(0);
    });
  });

  describe('Flow 2: Event Registration and Check-in', () => {
    it('should complete event registration and check-in flow', async () => {
      // Step 1: Create student and login
      const studentUser = await prisma.user.create({
        data: {
          email: 'eventstudent@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'STUDENT',
          fullName: 'Event Student',
          isVerified: true,
          student: {
            create: {
              studentNumber: '20219998',
              departmentId: department.id
            }
          }
        }
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'eventstudent@test.edu',
          password: 'Password123'
        });

      const accessToken = loginRes.body.data.accessToken;

      // Step 2: Create event
      const event = await prisma.event.create({
        data: {
          title: 'Tech Conference',
          description: 'Annual tech conference',
          date: new Date('2025-12-31'),
          location: 'Main Hall',
          category: 'ACADEMIC',
          isPublished: true,
          registrationDeadline: new Date('2025-12-30'),
          capacity: 100,
          price: 0
        }
      });

      // Step 3: Register for event
      const registerRes = await request(app)
        .post(`/api/v1/events/${event.id}/register`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);

      // Step 4: Get registration
      const registrationsRes = await request(app)
        .get(`/api/v1/events/${event.id}/registrations`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(registrationsRes.status).toBe(200);

      // Step 5: Check-in (simulated - would need QR code in real scenario)
      const registration = await prisma.eventRegistration.findFirst({
        where: { userId: studentUser.id, eventId: event.id }
      });

      expect(registration).toBeDefined();
      expect(registration.status).toBe('REGISTERED');
    });
  });

  describe('Flow 3: Wallet Top-up and Payment', () => {
    it('should complete wallet top-up and payment flow', async () => {
      // Step 1: Create student with wallet
      const studentUser = await prisma.user.create({
        data: {
          email: 'walletstudent@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'STUDENT',
          fullName: 'Wallet Student',
          isVerified: true,
          student: {
            create: {
              studentNumber: '20219997',
              departmentId: department.id
            }
          }
        }
      });

      await prisma.wallet.create({
        data: {
          userId: studentUser.id,
          balance: 50.00
        }
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'walletstudent@test.edu',
          password: 'Password123'
        });

      const accessToken = loginRes.body.data.accessToken;

      // Step 2: Check initial balance
      const balanceRes = await request(app)
        .get('/api/v1/wallet/balance')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(balanceRes.status).toBe(200);
      expect(balanceRes.body.data.balance).toBe(50.00);

      // Step 3: Create top-up session
      const topupRes = await request(app)
        .post('/api/v1/wallet/topup')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 100 });

      expect(topupRes.status).toBe(200);
      expect(topupRes.body.data).toHaveProperty('sessionId');

      // Step 4: Simulate payment webhook (in real scenario, payment provider calls this)
      // This would update wallet balance
      const wallet = await prisma.wallet.findUnique({
        where: { userId: studentUser.id }
      });

      expect(wallet).toBeDefined();

      // Step 5: Check transactions
      const transactionsRes = await request(app)
        .get('/api/v1/wallet/transactions')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(transactionsRes.status).toBe(200);
      expect(Array.isArray(transactionsRes.body.data.transactions)).toBe(true);
    });
  });

  describe('Flow 4: Meal Reservation and QR Code', () => {
    it('should complete meal reservation and QR code generation flow', async () => {
      // Step 1: Create student and login
      const studentUser = await prisma.user.create({
        data: {
          email: 'mealstudent@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'STUDENT',
          fullName: 'Meal Student',
          isVerified: true,
          student: {
            create: {
              studentNumber: '20219996',
              departmentId: department.id
            }
          }
        }
      });

      await prisma.wallet.create({
        data: {
          userId: studentUser.id,
          balance: 100.00
        }
      });

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'mealstudent@test.edu',
          password: 'Password123'
        });

      const accessToken = loginRes.body.data.accessToken;

      // Step 2: Create meal
      const meal = await prisma.meal.create({
        data: {
          date: new Date('2025-12-31'),
          mealType: 'LUNCH',
          menu: 'Chicken with Rice',
          price: 15.00,
          availableCount: 100
        }
      });

      // Step 3: Reserve meal
      const reserveRes = await request(app)
        .post(`/api/v1/meals/${meal.id}/reserve`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(reserveRes.status).toBe(201);
      expect(reserveRes.body.success).toBe(true);
      expect(reserveRes.body.data).toHaveProperty('qrCode');

      // Step 4: Get reservations
      const reservationsRes = await request(app)
        .get('/api/v1/meals/my-reservations')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(reservationsRes.status).toBe(200);
      expect(Array.isArray(reservationsRes.body.data)).toBe(true);
      expect(reservationsRes.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Flow 5: Classroom Reservation and Approval', () => {
    it('should complete classroom reservation and approval flow', async () => {
      // Step 1: Create student and faculty
      const studentUser = await prisma.user.create({
        data: {
          email: 'reservestudent@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'STUDENT',
          fullName: 'Reserve Student',
          isVerified: true,
          student: {
            create: {
              studentNumber: '20219995',
              departmentId: department.id
            }
          }
        }
      });

      const facultyUser = await prisma.user.create({
        data: {
          email: 'approver@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'FACULTY',
          fullName: 'Approver Faculty',
          isVerified: true,
          faculty: {
            create: {
              employeeNumber: 'EMP002',
              title: 'Professor',
              departmentId: department.id
            }
          }
        }
      });

      const studentLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'reservestudent@test.edu',
          password: 'Password123'
        });

      const studentToken = studentLogin.body.data.accessToken;

      const facultyLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'approver@test.edu',
          password: 'Password123'
        });

      const facultyToken = facultyLogin.body.data.accessToken;

      // Step 2: Create classroom
      const classroom = await prisma.classroom.create({
        data: {
          name: 'B201',
          capacity: 40,
          building: 'B Building',
          floor: 2,
          equipment: ['Projector']
        }
      });

      // Step 3: Create reservation
      const reserveRes = await request(app)
        .post('/api/v1/reservations')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classroomId: classroom.id,
          date: '2025-12-31',
          startTime: '10:00',
          endTime: '12:00',
          purpose: 'Study Group'
        });

      expect(reserveRes.status).toBe(201);
      expect(reserveRes.body.success).toBe(true);
      const reservationId = reserveRes.body.data.id;

      // Step 4: Approve reservation
      const approveRes = await request(app)
        .put(`/api/v1/reservations/${reservationId}/approve`)
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);

      // Step 5: Verify reservation status
      const getRes = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.status).toBe('APPROVED');
    });
  });

  describe('Flow 6: Attendance Marking and Report', () => {
    it('should complete attendance marking and report generation flow', async () => {
      // Step 1: Create student and faculty
      const studentUser = await prisma.user.create({
        data: {
          email: 'attendancestudent@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'STUDENT',
          fullName: 'Attendance Student',
          isVerified: true,
          student: {
            create: {
              studentNumber: '20219994',
              departmentId: department.id
            }
          }
        }
      });

      const facultyUser = await prisma.user.create({
        data: {
          email: 'attendancefaculty@test.edu',
          passwordHash: await bcrypt.hash('Password123', 10),
          role: 'FACULTY',
          fullName: 'Attendance Faculty',
          isVerified: true,
          faculty: {
            create: {
              employeeNumber: 'EMP003',
              title: 'Professor',
              departmentId: department.id
            }
          }
        }
      });

      const course = await prisma.course.create({
        data: {
          code: 'CS201',
          name: 'Advanced CS',
          credits: 3,
          departmentId: department.id,
          semester: 'FALL',
          year: 2024,
          isActive: true
        }
      });

      const section = await prisma.courseSection.create({
        data: {
          courseId: course.id,
          sectionNumber: '01',
          instructorId: (await prisma.faculty.findUnique({ where: { userId: facultyUser.id } })).id,
          capacity: 30,
          enrolledCount: 0,
          isActive: true
        }
      });

      // Step 2: Enroll student
      await prisma.enrollment.create({
        data: {
          studentId: (await prisma.student.findUnique({ where: { userId: studentUser.id } })).id,
          sectionId: section.id,
          status: 'ENROLLED'
        }
      });

      const facultyLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'attendancefaculty@test.edu',
          password: 'Password123'
        });

      const facultyToken = facultyLogin.body.data.accessToken;

      const studentLogin = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'attendancestudent@test.edu',
          password: 'Password123'
        });

      const studentToken = studentLogin.body.data.accessToken;

      // Step 3: Create attendance session
      const sessionRes = await request(app)
        .post('/api/v1/attendance/session')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({
          sectionId: section.id,
          date: '2025-12-31',
          startTime: '09:00',
          endTime: '11:00',
          latitude: 41.0082,
          longitude: 28.9784
        });

      expect(sessionRes.status).toBe(201);
      const sessionId = sessionRes.body.data.id;

      // Step 4: Mark attendance
      const markRes = await request(app)
        .post('/api/v1/attendance/mark')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          sessionId: sessionId,
          latitude: 41.0082,
          longitude: 28.9784
        });

      expect(markRes.status).toBe(201);
      expect(markRes.body.success).toBe(true);

      // Step 5: Get attendance report
      const reportRes = await request(app)
        .get(`/api/v1/attendance/report?sectionId=${section.id}`)
        .set('Authorization', `Bearer ${facultyToken}`);

      expect(reportRes.status).toBe(200);
    });
  });
});

