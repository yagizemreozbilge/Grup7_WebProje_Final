// test/models/Department.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Department Model', () => {
  let sequelize;
  let Department;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    Department = require('../../../src/models/Department')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Department.destroy({ where: {}, truncate: true });
  });

  describe('Department model definition', () => {
    it('should create Department model', () => {
      expect(Department).toBeDefined();
      expect(Department.name).toBe('Department');
    });

    it('should have required fields', () => {
      expect(Department.rawAttributes).toHaveProperty('id');
      expect(Department.rawAttributes).toHaveProperty('name');
      expect(Department.rawAttributes).toHaveProperty('code');
      expect(Department.rawAttributes).toHaveProperty('faculty');
    });

    it('should have unique code', () => {
      const codeField = Department.rawAttributes.code;
      expect(codeField.unique).toBe(true);
      expect(codeField.allowNull).toBe(false);
    });
  });

  describe('Department creation', () => {
    it('should create department with required fields', async () => {
      const departmentData = {
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      };

      const department = await Department.create(departmentData);

      expect(department).toBeDefined();
      expect(department.id).toBeDefined();
      expect(department.name).toBe('Computer Science');
      expect(department.code).toBe('CS');
      expect(department.faculty).toBe('Engineering');
    });
  });

  describe('Department associations', () => {
    it('should have associate method', () => {
      expect(typeof Department.associate).toBe('function');
    });

    it('should associate with Student if model exists', () => {
      const models = { Student: { hasMany: jest.fn() } };
      Department.associate(models);
      expect(models.Student.hasMany).toHaveBeenCalled();
    });

    it('should associate with Faculty if model exists', () => {
      const models = { Faculty: { hasMany: jest.fn() } };
      Department.associate(models);
      expect(models.Faculty.hasMany).toHaveBeenCalled();
    });
  });
});

