'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('students', 'admission_year', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: new Date().getFullYear()
    });
    await queryInterface.addColumn('students', 'current_semester', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1
    });
    await queryInterface.addColumn('students', 'total_credits', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0
    });
    await queryInterface.addColumn('students', 'enrollment_status', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'active'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('students', 'admission_year');
    await queryInterface.removeColumn('students', 'current_semester');
    await queryInterface.removeColumn('students', 'total_credits');
    await queryInterface.removeColumn('students', 'enrollment_status');
  }
};
