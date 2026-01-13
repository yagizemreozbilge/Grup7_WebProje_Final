const prisma = require('../prisma');

/**
 * Get all course sections with course and instructor info
 * GET /admin/sections
 */
exports.getAllSections = async (req, res, next) => {
  try {
    const sections = await prisma.course_sections.findMany({
      where: {
        deleted_at: null
      },
      include: {
        courses: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            semester: true,
            year: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { semester: 'asc' },
        { section_number: 'asc' }
      ]
    });

    // Get instructor info for each section
    const sectionsWithInstructors = await Promise.all(sections.map(async (section) => {
      let instructor = null;
      if (section.instructor_id) {
        const faculty = await prisma.faculty.findUnique({
          where: { id: section.instructor_id },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        });
        if (faculty) {
          instructor = {
            id: faculty.id,
            name: faculty.user.fullName || 'Unknown',
            email: faculty.user.email
          };
        }
      }

      return {
        id: section.id,
        courseCode: section.courses?.code || 'N/A',
        courseName: section.courses?.name || 'N/A',
        sectionNumber: section.section_number,
        semester: section.courses?.semester || section.semester,
        year: section.courses?.year || section.year,
        capacity: section.capacity,
        enrolledCount: section.enrolled_count,
        instructorId: section.instructor_id,
        instructor: instructor
      };
    }));

    res.status(200).json({ success: true, data: sectionsWithInstructors });
  } catch (error) {
    console.error('Error fetching sections:', error);
    next(error);
  }
};

/**
 * Get all faculty members
 * GET /admin/faculty
 */
exports.getAllFaculty = async (req, res, next) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: {
        user: {
          fullName: 'asc'
        }
      }
    });

    const facultyList = faculty.map(f => ({
      id: f.id,
      name: f.user.fullName || 'Unknown',
      email: f.user.email
    }));

    res.status(200).json({ success: true, data: facultyList });
  } catch (error) {
    console.error('Error fetching faculty:', error);
    next(error);
  }
};

/**
 * Assign instructor to a course section
 * POST /admin/assign-instructor
 */
exports.assignInstructorToSection = async (req, res, next) => {
  try {
    const { sectionId, instructorId } = req.body;

    if (!sectionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Section ID is required' 
      });
    }

    // Verify section exists
    const section = await prisma.course_sections.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return res.status(404).json({ 
        success: false, 
        error: 'Section not found' 
      });
    }

    // If instructorId is provided, verify it exists
    if (instructorId) {
      const instructor = await prisma.faculty.findUnique({
        where: { id: instructorId }
      });

      if (!instructor) {
        return res.status(404).json({ 
          success: false, 
          error: 'Instructor not found' 
        });
      }
    }

    // Update section with instructor
    const updatedSection = await prisma.course_sections.update({
      where: { id: sectionId },
      data: {
        instructor_id: instructorId || null
      },
      include: {
        courses: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    res.status(200).json({ 
      success: true, 
      message: instructorId 
        ? 'Instructor assigned successfully' 
        : 'Instructor removed successfully',
      data: updatedSection
    });
  } catch (error) {
    console.error('Error assigning instructor:', error);
    next(error);
  }
};
