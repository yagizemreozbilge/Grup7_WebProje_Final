const prisma = require('../prisma');

const getAllFaculty = async (req, res, next) => {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            role: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: faculty
    });
  } catch (error) {
    next(error);
  }
};

const getAllSections = async (req, res, next) => {
  try {
    const sections = await prisma.course_sections.findMany({
      include: {
        courses: {
          select: {
            id: true,
            code: true,
            name: true,
            credits: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: sections
    });
  } catch (error) {
    next(error);
  }
};

const assignInstructorToSection = async (req, res, next) => {
  try {
    const { sectionId, instructorId } = req.body;

    if (!sectionId || !instructorId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Section ID and Instructor ID are required'
        }
      });
    }

    const section = await prisma.course_sections.update({
      where: { id: sectionId },
      data: { instructor_id: instructorId },
      include: {
        courses: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Instructor assigned successfully',
      data: section
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFaculty,
  getAllSections,
  assignInstructorToSection
};
