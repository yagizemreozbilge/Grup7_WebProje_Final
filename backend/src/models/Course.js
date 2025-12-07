'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
        static associate(models) {
            // Only associate if models exist (for Part 1, some models may not be created yet)
            if (models.Department) {
                Course.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            }
            if (models.CourseSection) {
                Course.hasMany(models.CourseSection, { foreignKey: 'course_id', as: 'sections' });
            }
        }
    }

    Course.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        credits: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 10
            }
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'departments',
                key: 'id'
            }
        },
        semester: {
            type: DataTypes.ENUM('fall', 'spring', 'summer'),
            allowNull: false
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        metadata: {
            type: DataTypes.JSONB,
            defaultValue: {}
        },
        deleted_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        sequelize,
        modelName: 'Course',
        tableName: 'courses',
        timestamps: true,
        underscored: true,
        paranoid: true,
        indexes: [
            { fields: ['code'] },
            { fields: ['department_id'] },
            { fields: ['semester', 'year'] }
        ]
    });

    return Course;
};