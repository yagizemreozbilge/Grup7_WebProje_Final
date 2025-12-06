'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('departments', [
      {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Computer Engineering',
        code: 'CENG',
        faculty: 'Engineering',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        name: 'Electrical Engineering',
        code: 'EE',
        faculty: 'Engineering',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Mathematics',
        code: 'MATH',
        faculty: 'Science',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('departments', null, {});
  }
};

