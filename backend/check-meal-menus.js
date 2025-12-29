require('dotenv').config({ path: '../.env' });
const prisma = require('./src/prisma');

async function checkMealMenus() {
  try {
    const menus = await prisma.mealMenu.findMany({
      include: {
        cafeteria: true
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' }
      ]
    });

    console.log(`Total menus: ${menus.length}`);
    console.log('\nMenus by cafeteria:');
    
    const byCafeteria = {};
    menus.forEach(menu => {
      const cafeName = menu.cafeteria.name;
      if (!byCafeteria[cafeName]) {
        byCafeteria[cafeName] = [];
      }
      byCafeteria[cafeName].push(menu);
    });

    Object.keys(byCafeteria).forEach(cafeName => {
      console.log(`\n${cafeName} (${byCafeteria[cafeName].length} menus):`);
      byCafeteria[cafeName].forEach(menu => {
        console.log(`  - ${menu.mealType} on ${menu.date.toISOString().split('T')[0]}`);
      });
    });

    // Check for duplicate menus (same date, meal type, but different cafeteria)
    console.log('\n\nChecking for duplicate menus (same date and meal type):');
    const duplicates = {};
    menus.forEach(menu => {
      const key = `${menu.date.toISOString().split('T')[0]}_${menu.mealType}`;
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(menu);
    });

    Object.keys(duplicates).forEach(key => {
      if (duplicates[key].length > 1) {
        console.log(`\n${key}:`);
        duplicates[key].forEach(menu => {
          console.log(`  - ${menu.cafeteria.name} (${menu.cafeteria.location})`);
        });
      }
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMealMenus();


