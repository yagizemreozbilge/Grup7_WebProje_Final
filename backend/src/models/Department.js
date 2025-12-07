'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Department extends Model {
        static associate(models) {
            // Only associate if models exist (for Part 1, some models may not be created yet)
            if (models.Student) {
                Department.hasMany(models.Student, { foreignKey: 'department_id', as: 'students' });
            }
            if (models.Faculty) {
                Department.hasMany(models.Faculty, { foreignKey: 'department_id', as: 'facultyMembers' });
            }
        }
    }

    Department.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        faculty: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        sequelize,
        modelName: 'Department',
        tableName: 'departments',
        timestamps: true,
        underscored: true
    });

    return Department;
};