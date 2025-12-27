// test/models/User.test.js
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

describe('User Model', () => {
  let sequelize;
  let User;

  beforeAll(async () => {
    // Create in-memory SQLite database for testing
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    User = require('../../../src/models/User')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('User model definition', () => {
    it('should create User model', () => {
      // Assert
      expect(User).toBeDefined();
      expect(User.name).toBe('User');
    });

    it('should have required fields', () => {
      // Assert
      expect(User.rawAttributes).toHaveProperty('id');
      expect(User.rawAttributes).toHaveProperty('email');
      expect(User.rawAttributes).toHaveProperty('password_hash');
      expect(User.rawAttributes).toHaveProperty('role');
    });

    it('should have optional fields', () => {
      // Assert
      expect(User.rawAttributes).toHaveProperty('full_name');
      expect(User.rawAttributes).toHaveProperty('phone');
      expect(User.rawAttributes).toHaveProperty('profile_picture_url');
      expect(User.rawAttributes).toHaveProperty('is_verified');
    });

    it('should have UUID primary key', () => {
      // Assert
      const idField = User.rawAttributes.id;
      expect(idField.type).toBe(DataTypes.UUID);
      expect(idField.primaryKey).toBe(true);
    });

    it('should have email validation', () => {
      // Assert
      const emailField = User.rawAttributes.email;
      expect(emailField.allowNull).toBe(false);
      expect(emailField.unique).toBe(true);
      expect(emailField.validate).toBeDefined();
    });

    it('should have role enum', () => {
      // Assert
      const roleField = User.rawAttributes.role;
      expect(roleField.type).toBe(DataTypes.ENUM('student', 'faculty', 'admin'));
      expect(roleField.defaultValue).toBe('student');
    });
  });

  describe('User creation', () => {
    it('should create user with required fields', async () => {
      // Arrange
      const userData = {
        email: 'test@university.edu',
        password_hash: 'Password123',
        role: 'student'
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@university.edu');
      expect(user.role).toBe('student');
      expect(user.is_verified).toBe(false);
    });

    it('should hash password before create', async () => {
      // Arrange
      const userData = {
        email: 'test2@university.edu',
        password_hash: 'Password123',
        role: 'student'
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.password_hash).not.toBe('Password123');
      expect(user.password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should not hash already hashed password', async () => {
      // Arrange
      const hashedPassword = await bcrypt.hash('Password123', 10);
      const userData = {
        email: 'test3@university.edu',
        password_hash: hashedPassword,
        role: 'student'
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.password_hash).toBe(hashedPassword);
    });

    it('should set default role to student', async () => {
      // Arrange
      const userData = {
        email: 'test4@university.edu',
        password_hash: 'Password123'
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.role).toBe('student');
    });

    it('should set default is_verified to false', async () => {
      // Arrange
      const userData = {
        email: 'test5@university.edu',
        password_hash: 'Password123',
        role: 'student'
      };

      // Act
      const user = await User.create(userData);

      // Assert
      expect(user.is_verified).toBe(false);
    });
  });

  describe('comparePassword method', () => {
    it('should compare password correctly', async () => {
      // Arrange
      const userData = {
        email: 'test6@university.edu',
        password_hash: 'Password123',
        role: 'student'
      };
      const user = await User.create(userData);

      // Act
      const isValid = await user.comparePassword('Password123');
      const isInvalid = await user.comparePassword('WrongPassword');

      // Assert
      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });
  });

  describe('User associations', () => {
    it('should have associate method', () => {
      // Assert
      expect(typeof User.associate).toBe('function');
    });

    it('should associate with Student if model exists', () => {
      // Arrange
      const models = {
        Student: {
          belongsTo: jest.fn()
        }
      };

      // Act
      User.associate(models);

      // Assert
      expect(models.Student.belongsTo).toHaveBeenCalled();
    });

    it('should associate with Faculty if model exists', () => {
      // Arrange
      const models = {
        Faculty: {
          belongsTo: jest.fn()
        }
      };

      // Act
      User.associate(models);

      // Assert
      expect(models.Faculty.belongsTo).toHaveBeenCalled();
    });

    it('should not throw if Student model does not exist', () => {
      // Arrange
      const models = {};

      // Act & Assert
      expect(() => User.associate(models)).not.toThrow();
    });

    it('should not throw if Faculty model does not exist', () => {
      // Arrange
      const models = {};

      // Act & Assert
      expect(() => User.associate(models)).not.toThrow();
    });
  });

  describe('password hashing hooks', () => {
    it('should hash password on update if changed', async () => {
      // Arrange
      const user = await User.create({
        email: 'test7@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const oldHash = user.password_hash;

      // Act
      user.password_hash = 'NewPassword123';
      await user.save();

      // Assert
      expect(user.password_hash).not.toBe(oldHash);
      expect(user.password_hash).not.toBe('NewPassword123');
      expect(user.password_hash).toMatch(/^\$2[aby]\$/);
    });

    it('should not hash password on update if not changed', async () => {
      // Arrange
      const user = await User.create({
        email: 'test8@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const oldHash = user.password_hash;

      // Act
      user.full_name = 'Test User';
      await user.save();

      // Assert
      expect(user.password_hash).toBe(oldHash);
    });
  });
});

