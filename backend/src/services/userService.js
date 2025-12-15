const prisma = require('../prisma');

const sanitizeUser = (user) => {
  const { passwordHash, fullName, isVerified, profilePictureUrl, createdAt, updatedAt, student, faculty, ...rest } = user;
  
  const sanitized = {
    ...rest,
    full_name: fullName,
    is_verified: isVerified,
    profile_picture_url: profilePictureUrl,
    created_at: createdAt,
    updated_at: updatedAt
  };

  if (student) {
    const { studentNumber, departmentId, userId, ...studentRest } = student;
    sanitized.student = {
      ...studentRest,
      student_number: studentNumber,
      department_id: departmentId,
      user_id: userId
    };
  }

  if (faculty) {
    const { employeeNumber, departmentId, userId, ...facultyRest } = faculty;
    sanitized.faculty = {
      ...facultyRest,
      employee_number: employeeNumber,
      department_id: departmentId,
      user_id: userId
    };
  }

  return sanitized;
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      student: { include: { department: true } },
      faculty: { include: { department: true } }
    }
  });

  if (!user) {
    const err = new Error('User not found');
    err.code = 'NOT_FOUND';
    err.statusCode = 404;
    throw err;
  }

  return sanitizeUser(user);
};

const updateProfile = async (userId, updateData) => {
  const { full_name, phone } = updateData;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: full_name,
      phone
    },
    include: {
      student: { include: { department: true } },
      faculty: { include: { department: true } }
    }
  });

  return sanitizeUser(user);
};

const updateProfilePicture = async (userId, filePath) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl: filePath }
  });
  return user.profilePictureUrl;
};

const deleteProfilePicture = async (userId) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl: null }
  });
  return user;
};

const getAllUsers = async (options = {}) => {
  const { page = 1, limit = 10, role, department_id, search } = options;
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  const where = {};
  if (role) where.role = role.toUpperCase();
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const include = {
    student: department_id
      ? { where: { departmentId: department_id }, include: { department: true } }
      : { include: { department: true } },
    faculty: department_id
      ? { where: { departmentId: department_id }, include: { department: true } }
      : { include: { department: true } }
  };

  const [count, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include,
      take,
      skip,
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const sanitized = users.map(user => sanitizeUser(user));

  return {
    users: sanitized,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: take,
      pages: Math.ceil(count / take)
    }
  };
};

const getTranscript = async (userId) => {
  // Gerçek uygulamada veritabanından alınmalı. Örnek veri:
  return [
    { courseCode: 'CSE101', courseName: 'Algoritmalar', credits: 6, letterGrade: 'AA', score: 95, semesterName: '2023 Güz' },
    { courseCode: 'MAT101', courseName: 'Matematik I', credits: 5, letterGrade: 'BA', score: 88, semesterName: '2023 Güz' },
    // ...
  ];
};

module.exports = {
  getCurrentUser,
  updateProfile,
  updateProfilePicture,
  deleteProfilePicture,
  getAllUsers,
  getTranscript
};