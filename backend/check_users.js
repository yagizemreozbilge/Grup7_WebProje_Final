const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      isVerified: true,
      createdAt: true
    },
    take: 5
  });
  
  console.log('\nMevcut Kullanıcılar:');
  console.log('==================');
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Doğrulanmış: ${user.isVerified}`);
    console.log(`Oluşturulma: ${user.createdAt}`);
    console.log('---');
  });
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);

