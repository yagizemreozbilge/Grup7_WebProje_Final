const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudentNames() {
    try {
        console.log('=== Checking Student Names ===\n');

        // Get all students
        const students = await prisma.student.findMany({
            take: 5
        });

        console.log('Students found:', students.length);

        for (const student of students) {
            const user = await prisma.user.findUnique({
                where: { id: student.userId }
            });
            console.log(`- Number: ${student.student_number}`);
            console.log(`  Name: ${user?.full_name || 'MISSING'}`);
            console.log(`  Email: ${user?.email}`);
            console.log('');
        }

        console.log('=== Testing Attendance Report ===\n');

        // Get enrollments
        const sectionId = '11111111-aaaa-bbbb-cccc-111111111111';
        const enrollments = await prisma.enrollments.findMany({
            where: { section_id: sectionId }
        });

        console.log('Enrollments found:', enrollments.length);

        for (const enrollment of enrollments) {
            const student = await prisma.student.findUnique({
                where: { id: enrollment.student_id }
            });

            if (student) {
                const user = await prisma.user.findUnique({
                    where: { id: student.userId }
                });
                console.log(`- Number: ${student.student_number}`);
                console.log(`  Name: ${user?.full_name || 'MISSING'}`);
                console.log('');
            }
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkStudentNames();
