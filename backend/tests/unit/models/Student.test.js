// test/models/Student.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Student Model', () => {
  let sequelize;
  let Student;
  let User;
  let Department;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    User = require('../../../src/models/User')(sequelize, DataTypes);
    Department = require('../../../src/models/Department')(sequelize, DataTypes);
    Student = require('../../../src/models/Student')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Student.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await Department.destroy({ where: {}, truncate: true });
  });

  describe('Student model definition', () => {
    it('should create Student model', () => {
      // Assert
      expect(Student).toBeDefined();
      expect(Student.name).toBe('Student');
    });

    it('should have required fields', () => {
      // Assert
      expect(Student.rawAttributes).toHaveProperty('id');
      expect(Student.rawAttributes).toHaveProperty('user_id');
      expect(Student.rawAttributes).toHaveProperty('student_number');
      expect(Student.rawAttributes).toHaveProperty('department_id');
    });

    it('should have optional fields with defaults', () => {
      // Assert
      expect(Student.rawAttributes).toHaveProperty('admission_year');
      expect(Student.rawAttributes).toHaveProperty('current_semester');
      expect(Student.rawAttributes).toHaveProperty('gpa');
      expect(Student.rawAttributes).toHaveProperty('cgpa');
      expect(Student.rawAttributes).toHaveProperty('total_credits');
      expect(Student.rawAttributes).toHaveProperty('enrollment_status');
    });

    it('should have UUID primary key', () => {
      // Assert
      const idField = Student.rawAttributes.id;
      expect(idField.type).toBe(DataTypes.UUID);
      expect(idField.primaryKey).toBe(true);
    });

    it('should have unique student_number', () => {
      // Assert
      const studentNumberField = Student.rawAttributes.student_number;
      expect(studentNumberField.unique).toBe(true);
      expect(studentNumberField.allowNull).toBe(false);
    });

    it('should have unique user_id', () => {
      // Assert
      const userIdField = Student.rawAttributes.user_id;
      expect(userIdField.unique).toBe(true);
      expect(userIdField.allowNull).toBe(false);
    });
  });

  describe('Student creation', () => {
    it('should create student with required fields', async () => {
      // Arrange
      const user = await User.create({
        email: 'student@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123456',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(student).toBeDefined();
      expect(student.id).toBeDefined();
      expect(student.user_id).toBe(user.id);
      expect(student.student_number).toBe('123456');
      expect(student.department_id).toBe(department.id);
    });

    it('should set default admission_year to current year', async () => {
      // Arrange
      const user = await User.create({
        email: 'student2@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123457',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(student.admission_year).toBe(new Date().getFullYear());
    });

    it('should set default current_semester to 1', async () => {
      // Arrange
      const user = await User.create({
        email: 'student3@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123458',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(student.current_semester).toBe(1);
    });

    it('should set default gpa to 0.00', async () => {
      // Arrange
      const user = await User.create({
        email: 'student4@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123459',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(parseFloat(student.gpa)).toBe(0.00);
    });

    it('should set default cgpa to 0.00', async () => {
      // Arrange
      const user = await User.create({
        email: 'student5@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123460',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(parseFloat(student.cgpa)).toBe(0.00);
    });

    it('should set default total_credits to 0', async () => {
      // Arrange
      const user = await User.create({
        email: 'student6@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123461',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(student.total_credits).toBe(0);
    });

    it('should set default enrollment_status to active', async () => {
      // Arrange
      const user = await User.create({
        email: 'student7@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const studentData = {
        user_id: user.id,
        student_number: '123462',
        department_id: department.id
      };

      // Act
      const student = await Student.create(studentData);

      // Assert
      expect(student.enrollment_status).toBe('active');
    });
  });

  describe('Student associations', () => {
    it('should have associate method', () => {
      // Assert
      expect(typeof Student.associate).toBe('function');
    });

    it('should associate with User if model exists', () => {
      // Arrange
      const models = {
        User: {
          belongsTo: jest.fn()
        }
      };

      // Act
      Student.associate(models);

      // Assert
      expect(models.User.belongsTo).toHaveBeenCalled();
    });

    it('should associate with Department if model exists', () => {
      // Arrange
      const models = {
        Department: {
          belongsTo: jest.fn()
        }
      };

      // Act
      Student.associate(models);

      // Assert
      expect(models.Department.belongsTo).toHaveBeenCalled();
    });

    it('should not throw if User model does not exist', () => {
      // Arrange
      const models = {};

      // Act & Assert
      expect(() => Student.associate(models)).not.toThrow();
    });

    it('should not throw if Department model does not exist', () => {
      // Arrange
      const models = {};

      // Act & Assert
      expect(() => Student.associate(models)).not.toThrow();
    });
  });
});

