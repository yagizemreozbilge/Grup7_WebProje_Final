const { User, Student, Faculty, Department } = require('../../models');
const { Op } = require('sequelize');

const getCurrentUser = async (userId) => {
  const user = await User.findByPk(userId, {
    include: [
      { model: Student, as: 'student', include: [{ model: Department, as: 'department' }] },
      { model: Faculty, as: 'faculty', include: [{ model: Department, as: 'department' }] }
    ]
  });

  if (!user) {
    throw new Error('User not found');
  }

  const userResponse = user.toJSON();
  delete userResponse.password_hash;
  delete userResponse.refresh_token;
  delete userResponse.verification_token;
  delete userResponse.reset_password_token;

  return userResponse;
};

const updateProfile = async (userId, updateData) => {
  const { full_name, phone } = updateData;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (full_name !== undefined) {
    user.full_name = full_name;
  }
  if (phone !== undefined) {
    user.phone = phone;
  }

  await user.save();

  const userResponse = user.toJSON();
  delete userResponse.password_hash;
  delete userResponse.refresh_token;
  delete userResponse.verification_token;
  delete userResponse.reset_password_token;

  return userResponse;
};

const updateProfilePicture = async (userId, filePath) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.profile_picture_url = filePath;
  await user.save();

  return user.profile_picture_url;
};

const getAllUsers = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    role,
    department_id,
    search
  } = options;

  const offset = (page - 1) * limit;
  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where[Op.or] = [
      { email: { [Op.iLike]: `%${search}%` } },
      { full_name: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const include = [];
  if (department_id) {
    include.push(
      {
        model: Student,
        as: 'student',
        where: { department_id },
        include: [{ model: Department, as: 'department' }],
        required: false
      },
      {
        model: Faculty,
        as: 'faculty',
        where: { department_id },
        include: [{ model: Department, as: 'department' }],
        required: false
      }
    );
  } else {
    include.push(
      { model: Student, as: 'student', include: [{ model: Department, as: 'department' }], required: false },
      { model: Faculty, as: 'faculty', include: [{ model: Department, as: 'department' }], required: false }
    );
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    include,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['created_at', 'DESC']]
  });

  const users = rows.map(user => {
    const userData = user.toJSON();
    delete userData.password_hash;
    delete userData.refresh_token;
    delete userData.verification_token;
    delete userData.reset_password_token;
    return userData;
  });

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  };
};

module.exports = {
  getCurrentUser,
  updateProfile,
  updateProfilePicture,
  getAllUsers
};

