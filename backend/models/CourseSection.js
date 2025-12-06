'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CourseSection extends Model {
    static associate(models) {
      CourseSection.belongsTo(models.Course, { foreignKey: 'course_id', as: 'course' });
      CourseSection.belongsTo(models.Faculty, { foreignKey: 'instructor_id', as: 'instructor' });
      CourseSection.belongsTo(models.Classroom, { foreignKey: 'classroom_id', as: 'classroom' });
      CourseSection.hasMany(models.Enrollment, { foreignKey: 'section_id', as: 'enrollments' });
      CourseSection.hasMany(models.AttendanceSession, { foreignKey: 'section_id', as: 'attendanceSessions' });
      CourseSection.hasMany(models.Schedule, { foreignKey: 'section_id', as: 'schedules' });
    }
  }

  CourseSection.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    course_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id'
      }
    },
    section_number: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    instructor_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'faculty',
        key: 'id'
      }
    },
    classroom_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'classrooms',
        key: 'id'
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    enrolled_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    schedule_info: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'CourseSection',
    tableName: 'course_sections',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['course_id'] },
      { fields: ['instructor_id'] },
      { unique: true, fields: ['course_id', 'section_number'] }
    ]
  });

  return CourseSection;
};

