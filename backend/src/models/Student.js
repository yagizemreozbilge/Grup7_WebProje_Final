'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Student extends Model {
        static associate(models) {
            // Only associate if models exist (for Part 1, some models may not be created yet)
            if (models.User) {
                Student.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            }
            if (models.Department) {
                Student.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            }
        }
    }

    Student.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            unique: true
        },
        student_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'departments',
                key: 'id'
            }
        },
        admission_year: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: new Date().getFullYear()
        },
        current_semester: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1
        },
        gpa: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        cgpa: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true,
            defaultValue: 0.00
        },
        total_credits: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        enrollment_status: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: 'active'
        }
    }, {
        sequelize,
        modelName: 'Student',
        tableName: 'students',
        timestamps: true,
        underscored: true
    });

    return Student;
};