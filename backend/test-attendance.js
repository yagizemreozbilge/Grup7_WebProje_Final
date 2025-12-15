// Test script to add sample attendance records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestAttendance() {
    try {
        // Get test data - use User table to find students by email
        const session = await prisma.attendance_sessions.findFirst({
            where: { section_id: '11111111-aaaa-bbbb-cccc-111111111111' },
            orderBy: { created_at: 'desc' }
        });

        const user1 = await prisma.user.findUnique({
            where: { email: 'student1@campus.edu.tr' }
        });

        const user2 = await prisma.user.findUnique({
            where: { email: 'student2@campus.edu.tr' }
        });

        if (!user1 || !user2) {
            console.log('Users not found');
            return;
        }

        const student1 = await prisma.student.findUnique({
            where: { userId: user1.id }
        });

        const student2 = await prisma.student.findUnique({
            where: { userId: user2.id }
        });

        if (!session) {
            console.log('No attendance session found. Please start an attendance session first.');
            return;
        }

        console.log('Session ID:', session.id);
        console.log('Student1 ID:', student1?.id);
        console.log('Student2 ID:', student2?.id);

        if (session && student1) {
            // Check if already exists
            const existing = await prisma.attendance_records.findFirst({
                where: {
                    session_id: session.id,
                    student_id: student1.id
                }
            });

            if (!existing) {
                // Student1 attended
                await prisma.attendance_records.create({
                    data: {
                        session_id: session.id,
                        student_id: student1.id,
                        check_in_time: new Date(),
                        latitude: 41.0082,
                        longitude: 28.9784,
                        distance_from_center: 5.2,
                        is_flagged: false
                    }
                });
                console.log('✅ Student1 attendance recorded');
            } else {
                console.log('✅ Student1 already has attendance record');
            }
        }

        if (student2) {
            console.log('❌ Student2 did not attend (no record created)');
        }

        console.log('\n✅ Test completed! Check attendance report now.');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

addTestAttendance();
