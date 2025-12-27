// test/models/Admin.test.js
const { Sequelize, DataTypes } = require('sequelize');

describe('Admin Model', () => {
  let sequelize;
  let Admin;
  let User;

  beforeAll(async () => {
    sequelize = new Sequelize('sqlite::memory:', {
      logging: false
    });
    
    User = require('../../../src/models/User')(sequelize, DataTypes);
    Admin = require('../../../src/models/Admin')(sequelize, DataTypes);
    
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Admin.destroy({ where: {}, truncate: true });
    await User.destroy({ where: {}, truncate: true });
  });

  describe('Admin model definition', () => {
    it('should create Admin model', () => {
      expect(Admin).toBeDefined();
      expect(Admin.name).toBe('Admin');
    });

    it('should have required fields', () => {
      expect(Admin.rawAttributes).toHaveProperty('id');
      expect(Admin.rawAttributes).toHaveProperty('user_id');
      expect(Admin.rawAttributes).toHaveProperty('employee_number');
    });

    it('should have unique user_id', () => {
      const userIdField = Admin.rawAttributes.user_id;
      expect(userIdField.unique).toBe(true);
      expect(userIdField.allowNull).toBe(false);
    });

    it('should have unique employee_number', () => {
      const employeeNumberField = Admin.rawAttributes.employee_number;
      expect(employeeNumberField.unique).toBe(true);
      expect(employeeNumberField.allowNull).toBe(false);
    });

    it('should have permissions field with default empty object', () => {
      const permissionsField = Admin.rawAttributes.permissions;
      expect(permissionsField.type).toBe(DataTypes.JSONB);
      expect(permissionsField.defaultValue).toEqual({});
    });

    it('should have deleted_at field for soft delete', () => {
      expect(Admin.rawAttributes).toHaveProperty('deleted_at');
    });
  });

  describe('Admin creation', () => {
    it('should create admin with required fields', async () => {
      const user = await User.create({
        email: 'admin@university.edu',
        password_hash: 'Password123',
        role: 'admin'
      });

      const adminData = {
        user_id: user.id,
        employee_number: 'ADM001'
      };

      const admin = await Admin.create(adminData);

      expect(admin).toBeDefined();
      expect(admin.id).toBeDefined();
      expect(admin.user_id).toBe(user.id);
      expect(admin.employee_number).toBe('ADM001');
      expect(admin.permissions).toEqual({});
    });

    it('should set default permissions to empty object', async () => {
      const user = await User.create({
        email: 'admin2@university.edu',
        password_hash: 'Password123',
        role: 'admin'
      });

      const admin = await Admin.create({
        user_id: user.id,
        employee_number: 'ADM002'
      });

      expect(admin.permissions).toEqual({});
    });
  });

  describe('Admin associations', () => {
    it('should have associate method', () => {
      expect(typeof Admin.associate).toBe('function');
    });

    it('should associate with User if model exists', () => {
      const models = { User: { belongsTo: jest.fn() } };
      Admin.associate(models);
      expect(models.User.belongsTo).toHaveBeenCalled();
    });
  });
});

