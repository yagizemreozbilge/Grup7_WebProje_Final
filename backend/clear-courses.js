const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Delete in order of dependencies
        await prisma.excuse_requests.deleteMany({});
        await prisma.attendance_records.deleteMany({});
        await prisma.attendance_sessions.deleteMany({});
        await prisma.enrollments.deleteMany({});
        await prisma.course_sections.deleteMany({});
        await prisma.course_prerequisites.deleteMany({});
        await prisma.courses.deleteMany({});
        console.log('✅ Existing courses and sections cleared successfully.');
    } catch (e) {
        console.error('Error clearing data:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
