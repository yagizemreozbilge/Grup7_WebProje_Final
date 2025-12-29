require('dotenv').config();
const prisma = require('./src/prisma');

async function addSensorData() {
  try {
    console.log('🔍 Fetching sensors...\n');
    
    // Tüm aktif sensörleri al
    const sensors = await prisma.sensor.findMany({
      where: { isActive: true }
    });
    
    if (sensors.length === 0) {
      console.log('❌ No sensors found. Please create sensors first.');
      process.exit(1);
    }
    
    console.log(`✅ Found ${sensors.length} sensors:\n`);
    sensors.forEach(s => {
      console.log(`   - ${s.name} (${s.sensorId}) - Type: ${s.type}, Unit: ${s.unit}`);
    });
    
    console.log('\n📊 Adding sample data to sensors...\n');
    
    // Her sensör için son 24 saat içinde örnek veriler ekle
    const now = new Date();
    const hoursToAdd = 24;
    const dataPointsPerHour = 4; // Her saatte 4 veri noktası (15 dakikada bir)
    
    for (const sensor of sensors) {
      console.log(`📈 Adding data for: ${sensor.name}...`);
      
      let addedCount = 0;
      
      for (let hour = 0; hour < hoursToAdd; hour++) {
        for (let point = 0; point < dataPointsPerHour; point++) {
          const timestamp = new Date(now);
          timestamp.setHours(timestamp.getHours() - hour);
          timestamp.setMinutes(timestamp.getMinutes() - (point * 15));
          
          // Sensör tipine göre gerçekçi değerler üret
          let value;
          const randomVariation = () => (Math.random() - 0.5) * 0.2; // ±10% varyasyon
          
          switch (sensor.type.toLowerCase()) {
            case 'energy':
              // Enerji sensörü: 50-200 kWh arası
              const baseEnergy = 100 + (hour % 12 < 6 ? 50 : -30); // Gündüz daha yüksek
              value = baseEnergy + (baseEnergy * randomVariation());
              break;
              
            case 'occupancy':
              // Doluluk sensörü: 0-100 arası
              const baseOccupancy = 30 + (hour % 12 < 6 ? 40 : -20); // Gündüz daha dolu
              value = Math.max(0, Math.min(100, baseOccupancy + (baseOccupancy * randomVariation())));
              break;
              
            case 'temperature':
              // Sıcaklık sensörü: 18-25°C arası
              const baseTemp = 21 + (hour % 12 < 6 ? 2 : -1); // Gündüz daha sıcak
              value = baseTemp + (baseTemp * randomVariation());
              break;
              
            default:
              // Varsayılan: 0-100 arası
              value = 50 + (50 * randomVariation());
          }
          
          // Değeri 2 ondalık basamağa yuvarla
          value = Math.round(value * 100) / 100;
          
          try {
            await prisma.sensorData.create({
              data: {
                sensorId: sensor.id,
                value: value,
                unit: sensor.unit,
                timestamp: timestamp,
                metadata: {
                  source: 'sample_data',
                  hour: hour,
                  point: point
                }
              }
            });
            addedCount++;
          } catch (err) {
            // Duplicate timestamp hatası olabilir, devam et
            if (!err.message.includes('unique') && !err.message.includes('Unique')) {
              console.error(`   ⚠️  Error adding data point: ${err.message}`);
            }
          }
        }
      }
      
      console.log(`   ✅ Added ${addedCount} data points for ${sensor.name}\n`);
    }
    
    console.log('✅ Sensor data added successfully!\n');
    
    // Özet göster
    console.log('📊 Summary:');
    for (const sensor of sensors) {
      const dataCount = await prisma.sensorData.count({
        where: { sensorId: sensor.id }
      });
      console.log(`   ${sensor.name}: ${dataCount} data points`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSensorData();





