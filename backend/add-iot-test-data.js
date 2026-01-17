require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 IoT test verileri ekleniyor...\n');

  try {
    // 1. Sensörleri oluştur veya kontrol et
    const sensors = [
      {
        sensorId: 'TEMP-A101-01',
        name: 'Sıcaklık Sensörü - A101',
        type: 'temperature',
        location: 'A Blok, Oda 101',
        unit: '°C'
      },
      {
        sensorId: 'OCC-A101-01',
        name: 'Doluluk Sensörü - A101',
        type: 'occupancy',
        location: 'A Blok, Oda 101',
        unit: 'kişi'
      },
      {
        sensorId: 'TEMP-B201-01',
        name: 'Sıcaklık Sensörü - B201',
        type: 'temperature',
        location: 'B Blok, Oda 201',
        unit: '°C'
      },
      {
        sensorId: 'ENERGY-MAIN-01',
        name: 'Enerji Tüketim Sensörü - Ana Bina',
        type: 'energy',
        location: 'Ana Bina, Zemin Kat',
        unit: 'kWh'
      },
      {
        sensorId: 'HUMIDITY-A101-01',
        name: 'Nem Sensörü - A101',
        type: 'humidity',
        location: 'A Blok, Oda 101',
        unit: '%'
      }
    ];

    const createdSensors = [];
    for (const sensorData of sensors) {
      const sensor = await prisma.sensor.upsert({
        where: { sensorId: sensorData.sensorId },
        update: {},
        create: sensorData
      });
      createdSensors.push(sensor);
      console.log(`✓ Sensör oluşturuldu: ${sensor.name} (${sensor.id})`);
    }

    console.log(`\n📊 ${createdSensors.length} sensör hazır.\n`);

    // 2. Her sensör için test verileri ekle
    const now = new Date();
    
    for (const sensor of createdSensors) {
      const dataPoints = [];
      const baseValue = getBaseValue(sensor.type);
      const variation = getVariation(sensor.type);

      // Son 30 gün için günlük veri ekle
      for (let day = 0; day < 30; day++) {
        const date = new Date(now);
        date.setDate(date.getDate() - day);
        
        // Her gün için 24 saatlik veri (saatlik)
        for (let hour = 0; hour < 24; hour++) {
          const timestamp = new Date(date);
          timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
          
          // Rastgele değer üret (baseValue ± variation)
          const value = baseValue + (Math.random() * 2 - 1) * variation;
          
          dataPoints.push({
            sensorId: sensor.id,
            value: parseFloat(value.toFixed(2)),
            unit: sensor.unit,
            timestamp: timestamp
          });
        }
      }

      // Verileri batch olarak ekle (her 100 veri için bir batch)
      const batchSize = 100;
      for (let i = 0; i < dataPoints.length; i += batchSize) {
        const batch = dataPoints.slice(i, i + batchSize);
        await prisma.sensorData.createMany({
          data: batch,
          skipDuplicates: true
        });
      }

      console.log(`✓ ${dataPoints.length} veri eklendi: ${sensor.name}`);
    }

    console.log('\n✅ Tüm test verileri başarıyla eklendi!');
    console.log('\n📈 IoT Dashboard\'da verileri görebilirsiniz:');
    console.log('   http://localhost:3000/iot-dashboard\n');

  } catch (error) {
    console.error('❌ Hata:', error);
    throw error;
  }
}

function getBaseValue(type) {
  switch (type) {
    case 'temperature':
      return 22; // 22°C
    case 'occupancy':
      return 15; // 15 kişi
    case 'energy':
      return 50; // 50 kWh
    case 'humidity':
      return 45; // %45
    default:
      return 20;
  }
}

function getVariation(type) {
  switch (type) {
    case 'temperature':
      return 5; // ±5°C
    case 'occupancy':
      return 10; // ±10 kişi
    case 'energy':
      return 20; // ±20 kWh
    case 'humidity':
      return 15; // ±15%
    default:
      return 5;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

