const { Sequelize, DataTypes } = require('sequelize');
const EnrollmentModel = require('../../src/models/Enrollment');

describe('Enrollment Model Integration', () => {
  let sequelize;
  let Enrollment;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    Enrollment = EnrollmentModel(sequelize, DataTypes);

    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('creates enrollment with default values', async () => {
    const enrollment = await Enrollment.create({
      student_id: '11111111-1111-1111-1111-111111111111',
      section_id: '22222222-2222-2222-2222-222222222222'
    });

    expect(enrollment.status).toBe('enrolled');
    expect(enrollment.enrolled_at).toBeDefined();
  });

  test('enforces unique student-section constraint', async () => {
    const data = {
      student_id: '33333333-3333-3333-3333-333333333333',
      section_id: '44444444-4444-4444-4444-444444444444'
    };

    await Enrollment.create(data);

    await expect(
      Enrollment.create(data)
    ).rejects.toThrow();
  });
});
