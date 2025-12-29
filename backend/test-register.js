const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function testRegister() {
  try {
    console.log('🧪 Testing register flow...\n');

    // Test data
    const testEmail = `test${Date.now()}@campus.edu.tr`;
    const testPassword = 'Test1234';
    const testData = {
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      full_name: 'Test User',
      role: 'student',
      student_number: `2021${Date.now().toString().slice(-4)}`,
      department_id: null // Will be set below
    };

    // Get first department
    const department = await prisma.department.findFirst();
    if (!department) {
      console.log('❌ No departments found. Please run seed first.');
      await prisma.$disconnect();
      return;
    }

    testData.department_id = department.id;
    console.log('📋 Test data:');
    console.log('   Email:', testData.email);
    console.log('   Role:', testData.role);
    console.log('   Student Number:', testData.student_number);
    console.log('   Department:', department.name, `(${department.code})`);
    console.log('');

    // Check if email exists
    const existing = await prisma.user.findUnique({ where: { email: testData.email } });
    if (existing) {
      console.log('⚠️  User already exists, skipping...');
      await prisma.$disconnect();
      return;
    }

    // Create user
    console.log('💾 Creating user...');
    const passwordHash = await bcrypt.hash(testData.password, 10);
    const verificationToken = require('crypto').randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        email: testData.email,
        passwordHash: passwordHash,
        role: 'student',
        fullName: testData.full_name,
        isVerified: false,
        student: {
          create: {
            studentNumber: testData.student_number,
            departmentId: testData.department_id,
            gpa: 0,
            cgpa: 0
          }
        },
        emailVerificationToken: {
          create: {
            token: verificationToken,
            expiresAt: verificationExpires
          }
        }
      },
      include: {
        student: true,
        emailVerificationToken: true
      }
    });

    console.log('✅ User created successfully!');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Verified:', user.isVerified);
    console.log('   Student Number:', user.student?.studentNumber);
    console.log('   Verification Token:', verificationToken.substring(0, 20) + '...');
    console.log('');
    console.log('🔗 Verification URL:');
    console.log(`   http://localhost:3000/verify-email/${verificationToken}`);
    console.log('');

    // Clean up - delete test user
    console.log('🧹 Cleaning up test user...');
    await prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } });
    await prisma.student.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    console.log('✅ Test user deleted');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    if (error.meta) {
      console.error('   Meta:', JSON.stringify(error.meta, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

testRegister();







































