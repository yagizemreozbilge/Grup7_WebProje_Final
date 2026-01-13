require('dotenv').config();
const prisma = require('./src/prisma');

async function updateStudentGPA() {
  try {
    const email = 'student1@campus.edu.tr';
    
    console.log(`🔍 Searching for student: ${email}...\n`);
    
    // Öğrenciyi bul
    const user = await prisma.user.findUnique({
      where: { email: email },
      include: {
        student: true
      }
    });
    
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      process.exit(1);
    }
    
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Full Name: ${user.fullName}`);
    
    if (!user.student) {
      console.log(`❌ Student profile not found for user: ${email}`);
      process.exit(1);
    }
    
    console.log(`\n📊 Current GPA:`);
    console.log(`   GPA: ${user.student.gpa}`);
    console.log(`   CGPA: ${user.student.cgpa}`);
    
    // GPA'yı güncelle
    const newGPA = 3.20;
    const updatedStudent = await prisma.student.update({
      where: { id: user.student.id },
      data: {
        gpa: newGPA,
        cgpa: newGPA // CGPA'yı da aynı yapıyoruz
      }
    });
    
    console.log(`\n✅ GPA updated successfully!`);
    console.log(`   New GPA: ${updatedStudent.gpa}`);
    console.log(`   New CGPA: ${updatedStudent.cgpa}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateStudentGPA();











