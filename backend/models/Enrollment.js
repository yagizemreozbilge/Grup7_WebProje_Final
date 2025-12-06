'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    static associate(models) {
      Enrollment.belongsTo(models.Student, { foreignKey: 'student_id', as: 'student' });
      Enrollment.belongsTo(models.CourseSection, { foreignKey: 'section_id', as: 'section' });
    }
  }

  Enrollment.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    student_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'students',
        key: 'id'
      }
    },
    section_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'course_sections',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('enrolled', 'dropped', 'completed', 'failed'),
      defaultValue: 'enrolled'
    },
    grade: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    grade_points: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: true
    },
    enrolled_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    dropped_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['section_id'] },
      { unique: true, fields: ['student_id', 'section_id'] },
      { fields: ['status'] }
    ]
  });

  return Enrollment;
};

