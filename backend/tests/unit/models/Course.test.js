// test/models/Course.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Course Model', () => {
  let sequelize;
  let Course;
  let Department;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    Department = require('../../../src/models/Department')(sequelize, DataTypes);
    Course = require('../../../src/models/Course')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Course.destroy({ where: {}, truncate: true });
    await Department.destroy({ where: {}, truncate: true });
  });

  describe('Course model definition', () => {
    it('should create Course model', () => {
      expect(Course).toBeDefined();
      expect(Course.name).toBe('Course');
    });

    it('should have required fields', () => {
      expect(Course.rawAttributes).toHaveProperty('id');
      expect(Course.rawAttributes).toHaveProperty('code');
      expect(Course.rawAttributes).toHaveProperty('name');
      expect(Course.rawAttributes).toHaveProperty('credits');
      expect(Course.rawAttributes).toHaveProperty('department_id');
      expect(Course.rawAttributes).toHaveProperty('semester');
      expect(Course.rawAttributes).toHaveProperty('year');
    });

    it('should have unique code', () => {
      const codeField = Course.rawAttributes.code;
      expect(codeField.unique).toBe(true);
      expect(codeField.allowNull).toBe(false);
    });

    it('should have credits validation', () => {
      const creditsField = Course.rawAttributes.credits;
      expect(creditsField.validate).toBeDefined();
      expect(creditsField.validate.min).toBe(1);
      expect(creditsField.validate.max).toBe(10);
    });

    it('should have semester enum', () => {
      const semesterField = Course.rawAttributes.semester;
      expect(semesterField.type).toBe(DataTypes.ENUM('fall', 'spring', 'summer'));
    });

    it('should have default is_active to true', () => {
      const isActiveField = Course.rawAttributes.is_active;
      expect(isActiveField.defaultValue).toBe(true);
    });

    it('should have metadata field with default empty object', () => {
      const metadataField = Course.rawAttributes.metadata;
      expect(metadataField.type).toBe(DataTypes.JSONB);
      expect(metadataField.defaultValue).toEqual({});
    });
  });

  describe('Course creation', () => {
    it('should create course with required fields', async () => {
      const department = await Department.create({
        name: 'Computer Science',
        code: 'CS',
        faculty: 'Engineering'
      });

      const courseData = {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        credits: 3,
        department_id: department.id,
        semester: 'fall',
        year: 2024
      };

      const course = await Course.create(courseData);

      expect(course).toBeDefined();
      expect(course.id).toBeDefined();
      expect(course.code).toBe('CS101');
      expect(course.name).toBe('Introduction to Computer Science');
      expect(course.credits).toBe(3);
      expect(course.is_active).toBe(true);
      expect(course.metadata).toEqual({});
    });
  });

  describe('Course associations', () => {
    it('should have associate method', () => {
      expect(typeof Course.associate).toBe('function');
    });

    it('should associate with Department if model exists', () => {
      const models = { Department: { belongsTo: jest.fn() } };
      Course.associate(models);
      expect(models.Department.belongsTo).toHaveBeenCalled();
    });

    it('should associate with CourseSection if model exists', () => {
      const models = { CourseSection: { hasMany: jest.fn() } };
      Course.associate(models);
      expect(models.CourseSection.hasMany).toHaveBeenCalled();
    });
  });
});

