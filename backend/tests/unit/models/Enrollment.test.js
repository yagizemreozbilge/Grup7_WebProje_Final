// test/models/Enrollment.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Enrollment Model', () => {
  let sequelize;
  let Enrollment;
  let Student;
  let CourseSection;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    Student = require('../../../src/models/Student')(sequelize, DataTypes);
    CourseSection = require('../../../src/models/CourseSection')(sequelize, DataTypes);
    Enrollment = require('../../../src/models/Enrollment')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Enrollment.destroy({ where: {}, truncate: true });
    await Student.destroy({ where: {}, truncate: true });
    await CourseSection.destroy({ where: {}, truncate: true });
  });

  describe('Enrollment model definition', () => {
    it('should create Enrollment model', () => {
      expect(Enrollment).toBeDefined();
      expect(Enrollment.name).toBe('Enrollment');
    });

    it('should have required fields', () => {
      expect(Enrollment.rawAttributes).toHaveProperty('id');
      expect(Enrollment.rawAttributes).toHaveProperty('student_id');
      expect(Enrollment.rawAttributes).toHaveProperty('section_id');
    });

    it('should have status enum with default enrolled', () => {
      const statusField = Enrollment.rawAttributes.status;
      expect(statusField.type).toBe(DataTypes.ENUM('enrolled', 'dropped', 'completed', 'failed'));
      expect(statusField.defaultValue).toBe('enrolled');
    });

    it('should have optional grade fields', () => {
      expect(Enrollment.rawAttributes).toHaveProperty('grade');
      expect(Enrollment.rawAttributes).toHaveProperty('grade_points');
    });
  });

  describe('Enrollment creation', () => {
    it('should create enrollment with required fields', async () => {
      const user = await require('../../../src/models/User')(sequelize, DataTypes).create({
        email: 'student@university.edu',
        password_hash: 'Password123',
        role: 'student'
      });
      const department = await require('../../../src/models/Department')(sequelize, DataTypes).create({
        name: 'CS',
        code: 'CS',
        faculty: 'Engineering'
      });
      const student = await Student.create({
        user_id: user.id,
        student_number: '123456',
        department_id: department.id
      });
      const course = await require('../../../src/models/Course')(sequelize, DataTypes).create({
        code: 'CS101',
        name: 'Intro',
        credits: 3,
        department_id: department.id,
        semester: 'fall',
        year: 2024
      });
      const faculty = await require('../../../src/models/Faculty')(sequelize, DataTypes).create({
        user_id: (await require('../../../src/models/User')(sequelize, DataTypes).create({
          email: 'faculty@university.edu',
          password_hash: 'Password123',
          role: 'faculty'
        })).id,
        employee_number: 'EMP001',
        title: 'Professor',
        department_id: department.id
      });
      const section = await CourseSection.create({
        course_id: course.id,
        section_number: '01',
        instructor_id: faculty.id,
        capacity: 30
      });

      const enrollmentData = {
        student_id: student.id,
        section_id: section.id
      };

      const enrollment = await Enrollment.create(enrollmentData);

      expect(enrollment).toBeDefined();
      expect(enrollment.id).toBeDefined();
      expect(enrollment.student_id).toBe(student.id);
      expect(enrollment.section_id).toBe(section.id);
      expect(enrollment.status).toBe('enrolled');
    });
  });

  describe('Enrollment associations', () => {
    it('should have associate method', () => {
      expect(typeof Enrollment.associate).toBe('function');
    });
  });
});

