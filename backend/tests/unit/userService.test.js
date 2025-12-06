const userService = require('../../src/services/userService');
const { User, Student, Faculty, Department, sequelize } = require('../../models');
const bcrypt = require('bcrypt');

describe('User Service - Unit Tests', () => {
  let testDepartment;
  let testUser;

  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
    
    testDepartment = await Department.create({
      name: 'Test Department',
      code: 'TEST',
      faculty: 'Engineering'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean tables
    await User.destroy({ where: {}, force: true });
    await Student.destroy({ where: {}, force: true });
    await Faculty.destroy({ where: {}, force: true });
    const passwordHash = await bcrypt.hash('Password123', 10);
    testUser = await User.create({
      email: 'testuser@test.com',
      password_hash: passwordHash,
      role: 'student',
      full_name: 'Test User',
      phone: '+905551234567',
      is_verified: true
    });

    await Student.create({
      user_id: testUser.id,
      student_number: 'STU999',
      department_id: testDepartment.id
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user with student info', async () => {
      const user = await userService.getCurrentUser(testUser.id);

      expect(user).toBeDefined();
      expect(user.id).toBe(testUser.id);
      expect(user.email).toBe('testuser@test.com');
      expect(user.password_hash).toBeUndefined();
      expect(user.student).toBeDefined();
      expect(user.student.student_number).toBe('STU999');
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.getCurrentUser('00000000-0000-0000-0000-000000000000')).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateData = {
        full_name: 'Updated Name',
        phone: '+905559876543'
      };

      const updatedUser = await userService.updateProfile(testUser.id, updateData);

      expect(updatedUser.full_name).toBe('Updated Name');
      expect(updatedUser.phone).toBe('+905559876543');
    });

    it('should update only provided fields', async () => {
      const updateData = {
        full_name: 'Only Name Updated'
      };

      const updatedUser = await userService.updateProfile(testUser.id, updateData);

      expect(updatedUser.full_name).toBe('Only Name Updated');
      expect(updatedUser.phone).toBe('+905551234567'); // Unchanged
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.updateProfile('00000000-0000-0000-0000-000000000000', { full_name: 'Test' })).rejects.toThrow('User not found');
    });
  });

  describe('updateProfilePicture', () => {
    it('should update profile picture URL', async () => {
      const filePath = '/uploads/profile-123.jpg';
      const url = await userService.updateProfilePicture(testUser.id, filePath);

      expect(url).toBe(filePath);
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.profile_picture_url).toBe(filePath);
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.updateProfilePicture('00000000-0000-0000-0000-000000000000', '/uploads/test.jpg')).rejects.toThrow('User not found');
    });
  });

  describe('getAllUsers', () => {
    beforeEach(async () => {
      // Create additional test users
      for (let i = 1; i <= 5; i++) {
        const passwordHash = await bcrypt.hash('Password123', 10);
        await User.create({
          email: `user${i}@test.com`,
          password_hash: passwordHash,
          role: i % 2 === 0 ? 'student' : 'faculty',
          full_name: `User ${i}`,
          is_verified: true
        });
      }
    });

    it('should get all users with pagination', async () => {
      const result = await userService.getAllUsers({ page: 1, limit: 2 });

      expect(result.users).toBeDefined();
      expect(result.users.length).toBe(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(2);
      expect(result.pagination.total).toBeGreaterThan(0);
    });

    it('should filter users by role', async () => {
      const result = await userService.getAllUsers({ role: 'student' });

      expect(result.users.every(u => u.role === 'student')).toBe(true);
    });

    it('should search users by email or name', async () => {
      const result = await userService.getAllUsers({ search: 'testuser' });

      expect(result.users.length).toBeGreaterThan(0);
      expect(result.users.some(u => u.email.includes('testuser') || u.full_name?.includes('testuser'))).toBe(true);
    });
  });
});

