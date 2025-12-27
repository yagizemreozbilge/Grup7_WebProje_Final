// test/models/Faculty.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Faculty Model', () => {
  let sequelize;
  let Faculty;
  let User;
  let Department;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    User = require('../../../src/models/User')(sequelize, DataTypes);
    Department = require('../../../src/models/Department')(sequelize, DataTypes);
    Faculty = require('../../../src/models/Faculty')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Faculty.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
    await Department.destroy({ where: {}, truncate: true });
  });

  describe('Faculty model definition', () => {
    it('should create Faculty model', () => {
      expect(Faculty).toBeDefined();
      expect(Faculty.name).toBe('Faculty');
    });

    it('should have required fields', () => {
      expect(Faculty.rawAttributes).toHaveProperty('id');
      expect(Faculty.rawAttributes).toHaveProperty('user_id');
      expect(Faculty.rawAttributes).toHaveProperty('employee_number');
      expect(Faculty.rawAttributes).toHaveProperty('title');
      expect(Faculty.rawAttributes).toHaveProperty('department_id');
    });

    it('should have unique user_id', () => {
      const userIdField = Faculty.rawAttributes.user_id;
      expect(userIdField.unique).toBe(true);
      expect(userIdField.allowNull).toBe(false);
    });

    it('should have unique employee_number', () => {
      const employeeNumberField = Faculty.rawAttributes.employee_number;
      expect(employeeNumberField.unique).toBe(true);
      expect(employeeNumberField.allowNull).toBe(false);
    });
  });

  describe('Faculty creation', () => {
    it('should create faculty with required fields', async () => {
      const user = await User.create({
        email: 'faculty@university.edu',
        password_hash: 'Password123',
        role: 'faculty'
      });
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const facultyData = {
        user_id: user.id,
        employee_number: 'EMP001',
        title: 'Professor',
        department_id: department.id
      };

      const faculty = await Faculty.create(facultyData);

      expect(faculty).toBeDefined();
      expect(faculty.id).toBeDefined();
      expect(faculty.user_id).toBe(user.id);
      expect(faculty.employee_number).toBe('EMP001');
      expect(faculty.title).toBe('Professor');
      expect(faculty.department_id).toBe(department.id);
    });
  });

  describe('Faculty associations', () => {
    it('should have associate method', () => {
      expect(typeof Faculty.associate).toBe('function');
    });

    it('should associate with User if model exists', () => {
      const models = { User: { belongsTo: jest.fn() } };
      Faculty.associate(models);
      expect(models.User.belongsTo).toHaveBeenCalled();
    });

    it('should associate with Department if model exists', () => {
      const models = { Department: { belongsTo: jest.fn() } };
      Faculty.associate(models);
      expect(models.Department.belongsTo).toHaveBeenCalled();
    });
  });
});

