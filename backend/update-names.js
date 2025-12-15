const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateStudentNames() {
    try {
        console.log('=== Updating Student Names ===\n');

        const updates = [
            { email: 'student1@campus.edu.tr', fullName: 'Ahmet Yılmaz' },
            { email: 'student2@campus.edu.tr', fullName: 'Ayşe Demir' },
            { email: 'student3@campus.edu.tr', fullName: 'Mehmet Kaya' },
            { email: 'student4@campus.edu.tr', fullName: 'Fatma Şahin' },
            { email: 'student5@campus.edu.tr', fullName: 'Ali Çelik' }
        ];

        for (const update of updates) {
            const result = await prisma.user.update({
                where: { email: update.email },
                data: { fullName: update.fullName }
            });
            console.log(`✅ Updated: ${update.email} -> ${update.fullName}`);
        }

        console.log('\n=== Verifying Updates ===\n');

        const students = await prisma.user.findMany({
            where: {
                email: { in: updates.map(u => u.email) }
            },
            select: { email: true, fullName: true }
        });

        students.forEach(s => {
            console.log(`${s.email}: ${s.fullName}`);
        });

        console.log('\n✅ All names updated!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

updateStudentNames();
