const prisma = require('../prisma');

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

  const { passwordHash, ...rest } = user;
  return rest;
};

const updateProfile = async (userId, updateData) => {
  const { full_name, phone } = updateData;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      fullName: full_name,
      phone
    }
  });

  const { passwordHash, ...rest } = user;
  return rest;
};

const updateProfilePicture = async (userId, filePath) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { profilePictureUrl: filePath }
  });
  return user.profilePictureUrl;
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

  const sanitized = users.map(({ passwordHash, ...u }) => u);

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

module.exports = {
  getCurrentUser,
  updateProfile,
  updateProfilePicture,
  getAllUsers
};