const prisma = require('../prisma');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await prisma.courses.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await prisma.courses.findUnique({
      where: { id: req.params.id },
      include: {
        departments: {
          select: {
            id: true,
            name: true
          }
        },
        sections: {
          where: {
            deleted_at: null
          },
          orderBy: [
            { year: 'desc' },
            { semester: 'asc' },
            { section_number: 'asc' }
          ]
        },
        isPrerequisiteOf: {
          include: {
            prerequisite: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!course || course.deleted_at) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Transform sections to include instructor info
    const sections = await Promise.all(course.sections.map(async (section) => {
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

      // Get classroom info from schedule if available
      const schedule = await prisma.schedule.findFirst({
        where: { section_id: section.id },
        include: {
          classroom: true
        }
      });

      return {
        id: section.id,
        sectionNumber: section.section_number,
        semester: section.semester,
        year: section.year,
        instructor: instructor ? {
          id: instructor.id,
          fullName: instructor.user.fullName || 'TBD'
        } : null,
        capacity: section.capacity,
        enrolledCount: section.enrolled_count,
        classroom: schedule?.classroom ? {
          building: schedule.classroom.building,
          roomNumber: schedule.classroom.room_number
        } : null
      };
    }));

    // Transform prerequisites
    const prerequisites = course.isPrerequisiteOf.map(pr => ({
      id: pr.prerequisite.id,
      code: pr.prerequisite.code,
      name: pr.prerequisite.name
    }));

    const courseData = {
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description,
      credits: course.credits,
      ects: course.credits * 1.5, // Approximate ECTS conversion
      department: course.departments,
      sections: sections,
      prerequisites: prerequisites
    };

    res.status(200).json({ success: true, data: courseData });
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { code, name, description, credits, department_id, semester, year } = req.body;
    const course = await prisma.courses.create({
      data: { code, name, description, credits, department_id, semester, year },
    });
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, description, credits, department_id, semester, year } = req.body;
    const course = await prisma.courses.update({
      where: { id },
      data: { code, name, description, credits, department_id, semester, year },
    });
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.courses.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    res.status(200).json({ success: true, message: 'Course soft deleted' });
  } catch (error) {
    next(error);
  }
};
