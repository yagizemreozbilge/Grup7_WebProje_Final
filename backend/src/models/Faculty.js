'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Faculty extends Model {
        static associate(models) {
            // Only associate if models exist (for Part 1, some models may not be created yet)
            if (models.User) {
                Faculty.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
            }
            if (models.Department) {
                Faculty.belongsTo(models.Department, { foreignKey: 'department_id', as: 'department' });
            }
        }
    }

    Faculty.init({
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
        employee_number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        department_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: 'departments',
                key: 'id'
            }
        }
    }, {
        sequelize,
        modelName: 'Faculty',
        tableName: 'faculty',
        timestamps: true,
        underscored: true
    });

    return Faculty;
};