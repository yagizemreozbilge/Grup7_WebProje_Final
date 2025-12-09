const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getLatestToken() {
  try {
    const token = await prisma.emailVerificationToken.findFirst({
      where: {
        user: {
          email: { contains: 'test@campus' }
        }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (token) {
      console.log('\n✅ Latest token found:');
      console.log('📧 User email:', token.user.email);
      console.log('🔑 Full token:', token.token);
      console.log('🔗 Verification URL:', `http://localhost:3000/verify-email/${token.token}`);
      console.log('⏰ Expires at:', token.expiresAt);
      console.log('✅ User verified:', token.user.isVerified);
    } else {
      console.log('❌ No token found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getLatestToken();

