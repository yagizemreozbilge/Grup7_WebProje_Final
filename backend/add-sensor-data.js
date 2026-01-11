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
    
    // Her sensör için son 30 gün içinde örnek veriler ekle
    const now = new Date();
    const daysToAdd = 30; // Son 30 gün
    const dataPointsPerDay = 24; // Her günde 24 veri noktası (saatte bir)
    
    for (const sensor of sensors) {
      console.log(`📈 Adding data for: ${sensor.name}...`);
      
      let addedCount = 0;
      
      for (let day = 0; day < daysToAdd; day++) {
        for (let hour = 0; hour < dataPointsPerDay; hour++) {
          const timestamp = new Date(now);
          timestamp.setDate(timestamp.getDate() - day);
          timestamp.setHours(timestamp.getHours() - hour);
          timestamp.setMinutes(0);
          timestamp.setSeconds(0);
          timestamp.setMilliseconds(0);
          
          // Sensör tipine göre gerçekçi değerler üret
          let value;
          const randomVariation = () => (Math.random() - 0.5) * 0.15; // ±7.5% varyasyon
          const currentHour = (24 - hour) % 24;
          const isDayTime = currentHour >= 8 && currentHour <= 20;
          
          switch (sensor.type.toLowerCase()) {
            case 'energy':
              // Enerji sensörü: 50-200 kWh arası, gündüz daha yüksek
              const baseEnergy = isDayTime ? 120 + Math.random() * 50 : 60 + Math.random() * 30;
              value = baseEnergy + (baseEnergy * randomVariation());
              break;
              
            case 'occupancy':
              // Doluluk sensörü: 0-100 arası, gündüz ve hafta içi daha dolu
              const dayOfWeek = timestamp.getDay(); // 0=Pazar, 6=Cumartesi
              const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
              let baseOccupancy;
              if (isWeekday && isDayTime) {
                baseOccupancy = 50 + Math.random() * 40; // Hafta içi gündüz: 50-90
              } else if (isWeekday) {
                baseOccupancy = 10 + Math.random() * 20; // Hafta içi gece: 10-30
              } else if (isDayTime) {
                baseOccupancy = 20 + Math.random() * 30; // Hafta sonu gündüz: 20-50
              } else {
                baseOccupancy = 5 + Math.random() * 10; // Hafta sonu gece: 5-15
              }
              value = Math.max(0, Math.min(100, baseOccupancy + (baseOccupancy * randomVariation())));
              break;
              
            case 'temperature':
              // Sıcaklık sensörü: 18-25°C arası, gündüz daha sıcak
              const baseTemp = isDayTime ? 22 + Math.random() * 3 : 19 + Math.random() * 2;
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
                  day: day,
                  hour: hour
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









