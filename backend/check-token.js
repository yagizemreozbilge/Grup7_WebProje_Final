const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkToken() {
  try {
    const tokenToCheck = '7b681327d5f62d5ba742747167da2835c95a1ac4adf90baf206fd18fbf1484a8';
    
    console.log('🔍 Checking token:', tokenToCheck.substring(0, 20) + '...');
    
    const token = await prisma.emailVerificationToken.findUnique({
      where: { token: tokenToCheck },
      include: { user: true }
    });
    
    if (token) {
      console.log('✅ Token found!');
      console.log('📧 User email:', token.user.email);
      console.log('✅ User verified:', token.user.isVerified);
      console.log('⏰ Expires at:', token.expiresAt);
      console.log('⏰ Current time:', new Date());
      console.log('⏰ Is expired:', token.expiresAt < new Date());
    } else {
      console.log('❌ Token not found in database');
      
      // List all tokens
      const allTokens = await prisma.emailVerificationToken.findMany({
        include: { user: true },
        take: 10
      });
      
      console.log(`\n📋 Found ${allTokens.length} tokens in database:`);
      allTokens.forEach((t, i) => {
        console.log(`\n${i + 1}. Token: ${t.token.substring(0, 20)}...`);
        console.log(`   User: ${t.user.email}`);
        console.log(`   Verified: ${t.user.isVerified}`);
        console.log(`   Expires: ${t.expiresAt}`);
      });
    }
    
    // Check users
    const users = await prisma.user.findMany({
      where: { email: { contains: 'test@campus' } },
      take: 5
    });
    
    console.log(`\n👥 Found ${users.length} test users:`);
    users.forEach(u => {
      console.log(`   - ${u.email} (Verified: ${u.isVerified})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkToken();






























