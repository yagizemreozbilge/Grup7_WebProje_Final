'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Insert Courses
        await queryInterface.bulkInsert('courses', [
            // COMPUTER ENGINEERING
            {
                id: '10000000-0000-0000-0000-000000000101',
                code: 'CENG101',
                name: 'Introduction to Computer Science',
                description: 'Basic concepts of computer science and programming.',
                credits: 3,
                department_id: '11111111-1111-1111-1111-111111111111', // CENG
                semester: 'fall',
                year: 2024,
                attendance_limit: 4,
                created_at: new Date(),
                updated_at: new Date()
            },
            {
                id: '10000000-0000-0000-0000-000000000102',
                code: 'CENG102',
                name: 'Algorithms and Data Structures',
                description: 'Advanced algorithms, trees, graphs, and sorting.',
                credits: 4,
                department_id: '11111111-1111-1111-1111-111111111111', // CENG
                semester: 'spring',
                year: 2024,
                attendance_limit: 4,
                created_at: new Date(),
                updated_at: new Date()
            },
            // ELECTRICAL ENGINEERING
            {
                id: '20000000-0000-0000-0000-000000000101',
                code: 'EE101',
                name: 'Circuit Theory I',
                description: 'Fundamental circuit laws, node/mesh analysis.',
                credits: 3,
                department_id: '22222222-2222-2222-2222-222222222222', // EE
                semester: 'fall',
                year: 2024,
                attendance_limit: 4,
                created_at: new Date(),
                updated_at: new Date()
            },
            // MATHEMATICS
            {
                id: '30000000-0000-0000-0000-000000000101',
                code: 'MATH101',
                name: 'Calculus I',
                description: 'Limits, derivatives, and integrals.',
                credits: 4,
                department_id: '33333333-3333-3333-3333-333333333333', // MATH
                semester: 'fall',
                year: 2024,
                attendance_limit: 5,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});

        // 2. Insert Sections
        await queryInterface.bulkInsert('course_sections', [
            // CENG101 - Section 1 (Prof Doe)
            {
                id: '10000000-0000-0000-0000-000000000111',
                course_id: '10000000-0000-0000-0000-000000000101',
                section_number: 1,
                semester: 'fall',
                year: 2024,
                instructor_id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', // Prof Doe
                capacity: 50,
                enrolled_count: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            // CENG101 - Section 2 (Prof Doe)
            {
                id: '10000000-0000-0000-0000-000000000112',
                course_id: '10000000-0000-0000-0000-000000000101',
                section_number: 2,
                semester: 'fall',
                year: 2024,
                instructor_id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1', // Prof Doe
                capacity: 50,
                enrolled_count: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            // CENG102 - Section 1 (Prof Doe)
            {
                id: '10000000-0000-0000-0000-000000000121',
                course_id: '10000000-0000-0000-0000-000000000102',
                section_number: 1,
                semester: 'spring',
                year: 2024,
                instructor_id: 'f1f1f1f1-f1f1-f1f1-f1f1-f1f1f1f1f1f1',
                capacity: 40,
                enrolled_count: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            // EE101 - Section 1 (Prof Smith)
            {
                id: '20000000-0000-0000-0000-000000000111',
                course_id: '20000000-0000-0000-0000-000000000101',
                section_number: 1,
                semester: 'fall',
                year: 2024,
                instructor_id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2', // Prof Smith
                capacity: 60,
                enrolled_count: 0,
                created_at: new Date(),
                updated_at: new Date()
            },
            // MATH101 - Section 1 (Prof Smith - Assuming she teaches math too for demo)
            {
                id: '30000000-0000-0000-0000-000000000111',
                course_id: '30000000-0000-0000-0000-000000000101',
                section_number: 1,
                semester: 'fall',
                year: 2024,
                instructor_id: 'f2f2f2f2-f2f2-f2f2-f2f2-f2f2f2f2f2f2',
                capacity: 100,
                enrolled_count: 0,
                created_at: new Date(),
                updated_at: new Date()
            }
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('course_sections', null, {});
        await queryInterface.bulkDelete('courses', null, {});
    }
};
