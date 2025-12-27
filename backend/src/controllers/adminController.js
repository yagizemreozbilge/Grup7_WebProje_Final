const prisma = require('../prisma');
const userService = require('../services/userService');

// Tüm akademisyenleri getir
exports.getAllFaculty = async (req, res, next) => {
  try {
    const result = await userService.getAllUsers({
      role: 'faculty',
      limit: 1000
    });
    
    const facultyList = result.users
      .filter(user => user.faculty)
      .map(user => ({
        id: user.faculty.id,
        userId: user.id,
        fullName: user.full_name || user.fullName || '',
        email: user.email || '',
        employeeNumber: user.faculty.employee_number || user.faculty.employeeNumber || '',
        title: user.faculty.title || '',
        department: user.faculty.department || null
      }));
    
    res.status(200).json({ success: true, data: facultyList });
  } catch (error) {
    next(error);
  }
};

// Tüm ders şubelerini getir (instructor bilgisi ile)
exports.getAllSections = async (req, res, next) => {
  try {
    const sections = await prisma.course_sections.findMany({
      where: { deleted_at: null },
      include: {
        courses: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { section_number: 'asc' }
      ]
    });

    const sectionsWithInstructor = await Promise.all(sections.map(async (section) => {
      const instructor = await prisma.faculty.findUnique({
        where: { id: section.instructor_id },
        include: {
          user: {
            select: {
              fullName: true
            }
          }
        }
      });

      return {
        id: section.id,
        courseId: section.course_id,
        courseCode: section.courses.code,
        courseName: section.courses.name,
        sectionNumber: section.section_number,
        semester: section.semester,
        year: section.year,
        capacity: section.capacity,
        enrolledCount: section.enrolled_count,
        instructor: instructor ? {
          id: instructor.id,
          fullName: instructor.user.fullName
        } : null
      };
    }));

    res.status(200).json({ success: true, data: sectionsWithInstructor });
  } catch (error) {
    next(error);
  }
};

// Ders şubesine akademisyen ata
exports.assignInstructorToSection = async (req, res, next) => {
  try {
    const { sectionId, instructorId } = req.body;

    if (!sectionId || !instructorId) {
      return res.status(400).json({ 
        success: false, 
        message: 'sectionId ve instructorId gereklidir' 
      });
    }

    // Şube var mı kontrol et
    const section = await prisma.course_sections.findUnique({
      where: { id: sectionId }
    });

    if (!section || section.deleted_at) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ders şubesi bulunamadı' 
      });
    }

    // Akademisyen var mı kontrol et
    const instructor = await prisma.faculty.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Akademisyen bulunamadı' 
      });
    }

    // Şubeye akademisyen ata
    const updatedSection = await prisma.course_sections.update({
      where: { id: sectionId },
      data: { instructor_id: instructorId },
      include: {
        courses: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    const instructorInfo = await prisma.faculty.findUnique({
      where: { id: instructorId },
      include: {
        user: {
          select: {
            fullName: true
          }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      message: 'Akademisyen başarıyla atandı',
      data: {
        section: {
          id: updatedSection.id,
          courseCode: updatedSection.courses.code,
          courseName: updatedSection.courses.name,
          sectionNumber: updatedSection.section_number
        },
        instructor: {
          id: instructorInfo.id,
          fullName: instructorInfo.user.fullName
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

