require('dotenv').config({ path: '../.env' });
const prisma = require('./src/prisma');

async function fixMealMenus() {
  try {
    console.log('Fixing meal menus - creating multiple cafeterias and distributing menus...');

    // Önce tüm tekrarlanan menüleri sil
    console.log('Deleting all existing menus...');
    await prisma.mealMenu.deleteMany({});
    console.log('All menus deleted.');

    // Birden fazla kafeterya oluştur
    const cafeterias = [
      { id: 'cafe1111-1111-1111-1111-111111111111', name: 'Ana Kafeterya', location: 'Merkez Bina, Zemin Kat', capacity: 500 },
      { id: 'cafe2222-2222-2222-2222-222222222222', name: 'Mühendislik Kafeteryası', location: 'Mühendislik Fakültesi, 1. Kat', capacity: 300 },
      { id: 'cafe3333-3333-3333-3333-333333333333', name: 'Fen Edebiyat Kafeteryası', location: 'Fen Edebiyat Fakültesi, Giriş Kat', capacity: 250 },
      { id: 'cafe4444-4444-4444-4444-444444444444', name: 'Spor Kompleksi Kafeteryası', location: 'Spor Kompleksi, Zemin Kat', capacity: 200 }
    ];

    console.log('Creating cafeterias...');
    for (const cafe of cafeterias) {
      await prisma.cafeteria.upsert({
        where: { id: cafe.id },
        update: {},
        create: cafe
      });
    }
    console.log(`Created ${cafeterias.length} cafeterias.`);

    // Menü verileri - farklı öğünler için farklı menüler
    const mealMenus = {
      breakfast: [
        { main: 'Omlet', side: 'Peynir, Zeytin, Domates', dessert: 'Reçel', calories: 450, protein: 20 },
        { main: 'Menemen', side: 'Peynir, Zeytin, Ekmek', dessert: 'Bal', calories: 480, protein: 22 },
        { main: 'Sucuklu Yumurta', side: 'Peynir, Zeytin, Domates', dessert: 'Reçel', calories: 520, protein: 25 },
        { main: 'Kaşarlı Tost', side: 'Domates, Salatalık', dessert: 'Çay', calories: 400, protein: 18 }
      ],
      lunch: [
        { main: 'Tavuk Izgara', side: 'Pilav, Salata', dessert: 'Sütlaç', calories: 650, protein: 45 },
        { main: 'Köfte', side: 'Makarna, Salata', dessert: 'Baklava', calories: 700, protein: 50 },
        { main: 'Balık', side: 'Pilav, Meze', dessert: 'Meyve', calories: 580, protein: 40 },
        { main: 'Etli Kuru Fasulye', side: 'Pilav, Turşu', dessert: 'Sütlaç', calories: 680, protein: 48 }
      ],
      dinner: [
        { main: 'Köfte', side: 'Makarna, Salata', dessert: 'Baklava', calories: 700, protein: 50 },
        { main: 'Tavuk Sote', side: 'Pilav, Salata', dessert: 'Meyve', calories: 620, protein: 42 },
        { main: 'Mantı', side: 'Yoğurt, Salata', dessert: 'Sütlaç', calories: 750, protein: 35 },
        { main: 'Izgara Köfte', side: 'Pilav, Meze', dessert: 'Baklava', calories: 720, protein: 52 }
      ]
    };

    // Bugünden itibaren 7 gün için menü oluştur
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    let createdCount = 0;

    for (let day = 0; day < 7; day++) {
      const menuDate = new Date(today);
      menuDate.setDate(today.getDate() + day);
      
      for (let i = 0; i < mealTypes.length; i++) {
        const mealType = mealTypes[i];
        const menus = mealMenus[mealType];
        
        // Her öğün için farklı kafeteryalarda farklı menüler oluştur
        for (let j = 0; j < Math.min(cafeterias.length, menus.length); j++) {
          const cafeteria = cafeterias[j];
          const menu = menus[j];
          
          try {
            await prisma.mealMenu.create({
              data: {
                cafeteriaId: cafeteria.id,
                date: menuDate,
                mealType: mealType,
                itemsJson: { 
                  main: menu.main, 
                  side: menu.side, 
                  dessert: menu.dessert 
                },
                nutritionJson: { 
                  calories: menu.calories, 
                  protein: menu.protein,
                  carbs: Math.round(menu.calories * 0.5),
                  fat: Math.round(menu.calories * 0.3)
                },
                isPublished: true
              }
            });
            createdCount++;
            console.log(`Created ${mealType} menu for ${cafeteria.name} on ${menuDate.toISOString().split('T')[0]}`);
          } catch (err) {
            console.error(`Error creating menu for ${cafeteria.name}:`, err.message);
          }
        }
      }
    }

    console.log(`\nSummary:`);
    console.log(`- Created: ${createdCount} menus`);
    console.log(`- Distributed across ${cafeterias.length} cafeterias`);
    console.log(`- Each date/meal type has ${Math.min(cafeterias.length, 4)} different menus`);

    // Oluşturulan menüleri göster
    const allMenus = await prisma.mealMenu.findMany({
      include: {
        cafeteria: true
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' },
        { cafeteria: { name: 'asc' } }
      ]
    });

    console.log('\nMenus by date and meal type:');
    const byDateAndType = {};
    allMenus.forEach(menu => {
      const key = `${menu.date.toISOString().split('T')[0]}_${menu.mealType}`;
      if (!byDateAndType[key]) {
        byDateAndType[key] = [];
      }
      byDateAndType[key].push(menu);
    });

    Object.keys(byDateAndType).sort().forEach(key => {
      console.log(`\n${key}:`);
      byDateAndType[key].forEach(menu => {
        const items = menu.itemsJson;
        console.log(`  - ${menu.cafeteria.name}: ${items.main} (${menu.cafeteria.location})`);
      });
    });

  } catch (error) {
    console.error('Error fixing meal menus:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixMealMenus()
  .then(() => {
    console.log('\nMeal menus fixed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to fix meal menus:', error);
    process.exit(1);
  });


