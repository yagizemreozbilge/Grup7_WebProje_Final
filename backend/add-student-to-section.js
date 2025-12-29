/**
 * Script to add Ahmet Yılmaz student to a section
 * Usage: node add-student-to-section.js [sectionId]
 */

require('dotenv').config();
const prisma = require('./src/prisma');

async function addStudentToSection(sectionId) {
  try {
    // Default section ID from the URL
    const targetSectionId = sectionId || '11111111-aaaa-bbbb-cccc-111111111111';
    
    console.log(`📚 Adding Ahmet Yılmaz to section: ${targetSectionId}\n`);

    // Find Ahmet Yılmaz student
    const user = await prisma.user.findUnique({
      where: { email: 'ahmet.yilmaz@campus.edu' },
      include: { student: true }
    });

    if (!user || !user.student) {
      console.error('❌ Ahmet Yılmaz student not found in system.');
      console.log('   Please run: node add-student.js first');
      process.exit(1);
    }

    console.log(`✅ Found student: ${user.fullName} (${user.student.studentNumber})\n`);

    // Check if section exists
    const section = await prisma.course_sections.findUnique({
      where: { id: targetSectionId },
      include: {
        courses: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    if (!section) {
      console.error(`❌ Section not found: ${targetSectionId}`);
      console.log('\nAvailable sections:');
      const allSections = await prisma.course_sections.findMany({
        take: 10,
        include: {
          courses: {
            select: {
              code: true,
              name: true
            }
          }
        }
      });
      allSections.forEach(s => {
        console.log(`   - ${s.id} | ${s.courses.code} - ${s.courses.name} (Section ${s.section_number})`);
      });
      process.exit(1);
    }

    console.log(`✅ Found section: ${section.courses.code} - ${section.courses.name} (Section ${section.section_number})\n`);

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollments.findFirst({
      where: {
        student_id: user.student.id,
        section_id: targetSectionId
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'active') {
        console.log('⚠️  Student is already enrolled in this section (active)');
        console.log(`   Enrollment ID: ${existingEnrollment.id}`);
        process.exit(0);
      } else {
        // Reactivate enrollment
        await prisma.enrollments.update({
          where: { id: existingEnrollment.id },
          data: { status: 'active' }
        });
        console.log('✅ Enrollment reactivated!');
        process.exit(0);
      }
    }

    // Create enrollment
    const enrollment = await prisma.enrollments.create({
      data: {
        student_id: user.student.id,
        section_id: targetSectionId,
        status: 'active',
        enrollment_date: new Date()
      }
    });

    console.log('✅ Student added to section successfully!\n');
    console.log('📋 Enrollment Details:');
    console.log('   Enrollment ID:', enrollment.id);
    console.log('   Student:', user.fullName);
    console.log('   Student Number:', user.student.studentNumber);
    console.log('   Course:', `${section.courses.code} - ${section.courses.name}`);
    console.log('   Section:', section.section_number);
    console.log('   Status: Active\n');
    console.log('✅ Student will now appear in attendance report!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'P2002') {
      console.error('   Duplicate enrollment detected');
    }
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get section ID from command line argument
const sectionId = process.argv[2];
addStudentToSection(sectionId);





