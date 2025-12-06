const { User, Student, Faculty, Department } = require('../../models');
const bcrypt = require('bcrypt');

/**
 * Create a test department
 */
const createTestDepartment = async () => {
  return await Department.create({
    name: 'Test Department',
    code: 'TEST',
    faculty: 'Engineering'
  });
};

/**
 * Create a test user
 */
const createTestUser = async (overrides = {}) => {
  const defaults = {
    email: `test${Date.now()}@test.com`,
    password_hash: await bcrypt.hash('Password123', 10),
    role: 'student',
    full_name: 'Test User',
    is_verified: true
  };

  return await User.create({ ...defaults, ...overrides });
};

/**
 * Create a test student
 */
const createTestStudent = async (user, department) => {
  return await Student.create({
    user_id: user.id,
    student_number: `STU${Date.now()}`,
    department_id: department.id
  });
};

/**
 * Create a test faculty
 */
const createTestFaculty = async (user, department) => {
  return await Faculty.create({
    user_id: user.id,
    employee_number: `EMP${Date.now()}`,
    title: 'Professor',
    department_id: department.id
  });
};

/**
 * Get access token for a user
 */
const getAccessToken = async (app, email, password) => {
  const response = await require('supertest')(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return response.body.accessToken;
};

module.exports = {
  createTestDepartment,
  createTestUser,
  createTestStudent,
  createTestFaculty,
  getAccessToken
};

