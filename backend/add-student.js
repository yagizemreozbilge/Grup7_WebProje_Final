/**
 * Script to add a student to the system
 * Usage: node add-student.js
 */

require('dotenv').config();
const prisma = require('./src/prisma');
const bcrypt = require('bcrypt');

async function addStudent() {
  try {
    console.log('📚 Adding student: Ahmet Yılmaz...\n');

    // First, get a department (use the first available department)
    const department = await prisma.department.findFirst();
    
    if (!department) {
      console.error('❌ No department found. Please create a department first.');
      process.exit(1);
    }

    console.log(`✅ Using department: ${department.name} (ID: ${department.id})\n`);

    // Check if student already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'ahmet.yilmaz@campus.edu' }
    });

    if (existingUser) {
      console.log('⚠️  Student already exists with email: ahmet.yilmaz@campus.edu');
      console.log('   Student Number:', existingUser.student?.studentNumber || 'N/A');
      console.log('   Full Name:', existingUser.fullName || 'N/A');
      process.exit(0);
    }

    // Generate a unique student number (you can change this)
    const studentNumber = `221401${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Hash password (default: Password123)
    const passwordHash = await bcrypt.hash('Password123', 10);

    // Create user and student
    const user = await prisma.user.create({
      data: {
        email: 'ahmet.yilmaz@campus.edu',
        passwordHash: passwordHash,
        role: 'student',
        fullName: 'Ahmet Yılmaz',
        isVerified: true, // Set to true so student can login immediately
        student: {
          create: {
            studentNumber: studentNumber,
            departmentId: department.id,
            gpa: 0,
            cgpa: 0
          }
        }
      },
      include: {
        student: true
      }
    });

    console.log('✅ Student added successfully!\n');
    console.log('📋 Student Details:');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Full Name:', user.fullName);
    console.log('   Student Number:', user.student.studentNumber);
    console.log('   Department:', department.name);
    console.log('   Password: Password123');
    console.log('   Status: Verified (can login immediately)\n');
    console.log('🔐 Login Credentials:');
    console.log('   Email: ahmet.yilmaz@campus.edu');
    console.log('   Password: Password123\n');

  } catch (error) {
    console.error('❌ Error adding student:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addStudent();





