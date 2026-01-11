require('dotenv').config();
const prisma = require('./src/prisma');
const jwt = require('jsonwebtoken');

async function testFacultySections() {
  try {
    // Faculty user'ı bul
    const facultyUser = await prisma.user.findFirst({
      where: { email: 'faculty1@campus.edu.tr' },
      include: { faculty: true }
    });
    
    if (!facultyUser) {
      console.log('Faculty user not found');
      process.exit(1);
    }
    
    console.log('Faculty user:', facultyUser.email);
    console.log('Faculty profile:', facultyUser.faculty?.id);
    
    // Sections'ı getir
    const sections = await prisma.course_sections.findMany({
      where: { 
        instructor_id: facultyUser.faculty.id,
        deleted_at: null 
      },
      include: { courses: true }
    });
    
    console.log('\nFound sections:', sections.length);
    
    // Instructor bilgilerini ekle
    const sectionsWithInstructor = await Promise.all(sections.map(async (s) => {
      let instructor = null;
      if (s.instructor_id) {
        instructor = await prisma.faculty.findUnique({
          where: { id: s.instructor_id },
          include: {
            user: {
              select: {
                fullName: true
              }
            }
          }
        });
      }

      return {
        id: s.id,
        courseCode: s.courses.code,
        courseName: s.courses.name,
        section_number: s.section_number,
        sectionNumber: s.section_number,
        semester: s.semester,
        year: s.year,
        enrolled_count: s.enrolled_count,
        enrolledCount: s.enrolled_count,
        capacity: s.capacity,
        instructor: instructor ? {
          id: instructor.id,
          fullName: instructor.user?.fullName || 'Bilinmiyor'
        } : null,
        courses: {
          code: s.courses.code,
          name: s.courses.name
        }
      };
    }));

    const response = {
      success: true,
      data: sectionsWithInstructor
    };
    
    console.log('\nResponse format:');
    console.log(JSON.stringify(response, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFacultySections();









