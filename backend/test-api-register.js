async function testAPIRegister() {
  try {
    console.log('🧪 Testing Register API endpoint...\n');

    // Get departments first
    console.log('📋 Fetching departments...');
    const deptResponse = await fetch('http://localhost:5000/api/v1/departments');
    const deptData = await deptResponse.json();
    const departments = deptData.data || deptData;
    
    if (!departments || departments.length === 0) {
      console.log('❌ No departments found');
      return;
    }

    const department = departments[0];
    console.log('✅ Found department:', department.name, `(${department.code})`);
    console.log('');

    // Test registration data
    const timestamp = Date.now();
    const testData = {
      email: `test${timestamp}@campus.edu.tr`,
      password: 'Test1234',
      confirmPassword: 'Test1234',
      full_name: 'Test User',
      role: 'student',
      student_number: `2021${timestamp.toString().slice(-4)}`,
      department_id: department.id
    };

    console.log('📝 Register request data:');
    console.log('   Email:', testData.email);
    console.log('   Role:', testData.role);
    console.log('   Student Number:', testData.student_number);
    console.log('   Department ID:', testData.department_id);
    console.log('');

    console.log('📤 Sending register request...');
    const response = await fetch('http://localhost:5000/api/v1/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Register successful!');
      console.log('   Status:', response.status);
      console.log('   Response:', JSON.stringify(responseData, null, 2));
    } else {
      throw new Error(`Register failed: ${JSON.stringify(responseData)}`);
    }
    console.log('');

    // Check if user was created
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({
      where: { email: testData.email },
      include: {
        student: true,
        emailVerificationToken: true
      }
    });

    if (user) {
      console.log('✅ User found in database:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Verified:', user.isVerified);
      console.log('   Student Number:', user.student?.studentNumber);
      if (user.emailVerificationToken) {
        console.log('   Verification Token:', user.emailVerificationToken.token.substring(0, 20) + '...');
        console.log('   Verification URL:', `http://localhost:3000/verify-email/${user.emailVerificationToken.token}`);
      }
    } else {
      console.log('⚠️  User not found in database');
    }

    await prisma.$disconnect();

  } catch (error) {
    console.error('❌ Register failed!');
    console.error('   Error:', error.message);
  }
}

testAPIRegister();

