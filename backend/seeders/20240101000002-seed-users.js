'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('Password123', 10);
    
    // Admin user
    const adminId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        email: 'admin@campus.edu',
        password_hash: hashedPassword,
        role: 'admin',
        full_name: 'Admin User',
        phone: '+905551234567',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Faculty users
    const facultyIds = [
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      'cccccccc-cccc-cccc-cccc-cccccccccccc'
    ];
    await queryInterface.bulkInsert('users', [
      {
        id: facultyIds[0],
        email: 'prof.doe@campus.edu',
        password_hash: hashedPassword,
        role: 'faculty',
        full_name: 'Prof. John Doe',
        phone: '+905551234568',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: facultyIds[1],
        email: 'prof.smith@campus.edu',
        password_hash: hashedPassword,
        role: 'faculty',
        full_name: 'Prof. Jane Smith',
        phone: '+905551234569',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Student users
    const studentIds = [
      'dddddddd-dddd-dddd-dddd-dddddddddddd',
      'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    ];
    await queryInterface.bulkInsert('users', [
      {
        id: studentIds[0],
        email: 'student1@campus.edu',
        password_hash: hashedPassword,
        role: 'student',
        full_name: 'Alice Johnson',
        phone: '+905551234570',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: studentIds[1],
        email: 'student2@campus.edu',
        password_hash: hashedPassword,
        role: 'student',
        full_name: 'Bob Williams',
        phone: '+905551234571',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: studentIds[2],
        email: 'student3@campus.edu',
        password_hash: hashedPassword,
        role: 'student',
        full_name: 'Charlie Brown',
        phone: '+905551234572',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: studentIds[3],
        email: 'student4@campus.edu',
        password_hash: hashedPassword,
        role: 'student',
        full_name: 'Diana Prince',
        phone: '+905551234573',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: studentIds[4],
        email: 'student5@campus.edu',
        password_hash: hashedPassword,
        role: 'student',
        full_name: 'Eve Davis',
        phone: '+905551234574',
        is_verified: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert faculty records
    await queryInterface.bulkInsert('faculty', [
      {
        id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
        user_id: facultyIds[0],
        employee_number: 'EMP001',
        title: 'Professor',
        department_id: '11111111-1111-1111-1111-111111111111',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
        user_id: facultyIds[1],
        employee_number: 'EMP002',
        title: 'Associate Professor',
        department_id: '22222222-2222-2222-2222-222222222222',
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Insert student records
    await queryInterface.bulkInsert('students', [
      {
        id: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
        user_id: studentIds[0],
        student_number: 'STU001',
        department_id: '11111111-1111-1111-1111-111111111111',
        gpa: 3.50,
        cgpa: 3.45,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a2a2a2a2-a2a2-a2a2-a2a2-a2a2a2a2a2a2',
        user_id: studentIds[1],
        student_number: 'STU002',
        department_id: '11111111-1111-1111-1111-111111111111',
        gpa: 3.75,
        cgpa: 3.70,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a3a3a3a3-a3a3-a3a3-a3a3-a3a3a3a3a3a3',
        user_id: studentIds[2],
        student_number: 'STU003',
        department_id: '22222222-2222-2222-2222-222222222222',
        gpa: 3.25,
        cgpa: 3.20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a4a4a4a4-a4a4-a4a4-a4a4-a4a4a4a4a4a4',
        user_id: studentIds[3],
        student_number: 'STU004',
        department_id: '33333333-3333-3333-3333-333333333333',
        gpa: 3.90,
        cgpa: 3.85,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 'a5a5a5a5-a5a5-a5a5-a5a5-a5a5a5a5a5a5',
        user_id: studentIds[4],
        student_number: 'STU005',
        department_id: '33333333-3333-3333-3333-333333333333',
        gpa: 3.60,
        cgpa: 3.55,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('students', null, {});
    await queryInterface.bulkDelete('faculty', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};

