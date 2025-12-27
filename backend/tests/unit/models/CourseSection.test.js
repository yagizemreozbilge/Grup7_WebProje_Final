// test/models/CourseSection.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('CourseSection Model', () => {
  let sequelize;
  let CourseSection;
  let Course;
  let Faculty;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    Course = require('../../../src/models/Course')(sequelize, DataTypes);
    Faculty = require('../../../src/models/Faculty')(sequelize, DataTypes);
    CourseSection = require('../../../src/models/CourseSection')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await CourseSection.destroy({ where: {}, truncate: true });
    await Course.destroy({ where: {}, truncate: true });
    await Faculty.destroy({ where: {}, truncate: true });
  });

  describe('CourseSection model definition', () => {
    it('should create CourseSection model', () => {
      expect(CourseSection).toBeDefined();
      expect(CourseSection.name).toBe('CourseSection');
    });

    it('should have required fields', () => {
      expect(CourseSection.rawAttributes).toHaveProperty('id');
      expect(CourseSection.rawAttributes).toHaveProperty('course_id');
      expect(CourseSection.rawAttributes).toHaveProperty('section_number');
      expect(CourseSection.rawAttributes).toHaveProperty('instructor_id');
      expect(CourseSection.rawAttributes).toHaveProperty('capacity');
    });

    it('should have capacity validation', () => {
      const capacityField = CourseSection.rawAttributes.capacity;
      expect(capacityField.validate).toBeDefined();
      expect(capacityField.validate.min).toBe(1);
    });

    it('should have default enrolled_count to 0', () => {
      const enrolledCountField = CourseSection.rawAttributes.enrolled_count;
      expect(enrolledCountField.defaultValue).toBe(0);
    });

    it('should have default is_active to true', () => {
      const isActiveField = CourseSection.rawAttributes.is_active;
      expect(isActiveField.defaultValue).toBe(true);
    });
  });

  describe('CourseSection creation', () => {
    it('should create course section with required fields', async () => {
      const department = await require('../../../src/models/Department')(sequelize, DataTypes).create({
        name: 'CS',
        code: 'CS',
        faculty: 'Engineering'
      });
      const course = await Course.create({
        code: 'CS101',
        name: 'Intro to CS',
        credits: 3,
        department_id: department.id,
        semester: 'fall',
        year: 2024
      });
      const user = await require('../../../src/models/User')(sequelize, DataTypes).create({
        email: 'faculty@university.edu',
        password_hash: 'Password123',
        role: 'faculty'
      });
      const faculty = await Faculty.create({
        user_id: user.id,
        employee_number: 'EMP001',
        title: 'Professor',
        department_id: department.id
      });

      const sectionData = {
        course_id: course.id,
        section_number: '01',
        instructor_id: faculty.id,
        capacity: 30
      };

      const section = await CourseSection.create(sectionData);

      expect(section).toBeDefined();
      expect(section.id).toBeDefined();
      expect(section.course_id).toBe(course.id);
      expect(section.section_number).toBe('01');
      expect(section.instructor_id).toBe(faculty.id);
      expect(section.capacity).toBe(30);
      expect(section.enrolled_count).toBe(0);
      expect(section.is_active).toBe(true);
    });
  });

  describe('CourseSection associations', () => {
    it('should have associate method', () => {
      expect(typeof CourseSection.associate).toBe('function');
    });
  });
});

