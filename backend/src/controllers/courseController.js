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
    });
    if (!course || course.deleted_at) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    res.status(200).json({ success: true, data: course });
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
