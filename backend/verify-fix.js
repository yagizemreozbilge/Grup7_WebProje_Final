const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyReportFix() {
    try {
        console.log('=== Verifying Report Logic ===\n');

        const sectionId = '11111111-aaaa-bbbb-cccc-111111111111';

        // Simulate what getReport does
        const enrollments = await prisma.enrollments.findMany({
            where: { section_id: sectionId, status: 'active' },
            include: {
                student: {
                    include: {
                        user: true
                    }
                }
            }
        });

        console.log(`Found ${enrollments.length} enrollments.`);

        enrollments.forEach((e, i) => {
            const student = e.student;
            if (!student) return;

            // Use the CORRECT property names as defined in schema.prisma models
            // User model: fullName String? @map("full_name") -> Prisma client uses fullName
            // Student model: studentNumber String @unique @map("student_number") -> Prisma client uses studentNumber

            const number = student.studentNumber;
            const name = student.user ? student.user.fullName : 'Bilinmiyor';

            console.log(`${i + 1}. Number: ${number} (from .studentNumber)`);
            console.log(`   Name:   ${name} (from .user.fullName)`);

            if (!number || name === 'Bilinmiyor') {
                console.log('   ⚠️  MISSING DATA DETECTED!');
            } else {
                console.log('   ✅  Data OK');
            }
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

verifyReportFix();
