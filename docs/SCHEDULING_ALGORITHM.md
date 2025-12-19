# Scheduling Algorithm Documentation

Bu dokümantasyon, otomatik ders programı oluşturma algoritmasını açıklar.

## Genel Bakış

Sistem, **Constraint Satisfaction Problem (CSP)** yaklaşımını kullanarak otomatik ders programı oluşturur. Algoritma, backtracking ve heuristic yöntemlerle optimize edilmiştir.

## Problem Tanımı

### Girdiler

- **Sections**: Ders bölümleri (course sections)
- **Classrooms**: Derslikler (kapasite, özellikler)
- **Time Slots**: Zaman aralıkları (Pazartesi-Cuma, 09:00-17:00)
- **Instructor Preferences**: Öğretim üyesi tercihleri (opsiyonel)

### Çıktı

Her section için:
- Gün (day_of_week)
- Başlangıç saati (start_time)
- Bitiş saati (end_time)
- Derslik (classroom_id)

## Constraint'ler

### Hard Constraints (Zorunlu)

Bu constraint'ler mutlaka sağlanmalıdır:

1. **No Instructor Double-Booking**
   - Aynı öğretim üyesi aynı anda birden fazla ders veremez

2. **No Classroom Double-Booking**
   - Aynı derslik aynı anda birden fazla derse tahsis edilemez

3. **No Student Schedule Conflict**
   - Öğrencilerin dersleri çakışmamalı (enrollment'lara göre)

4. **Classroom Capacity**
   - Derslik kapasitesi section kapasitesinden büyük veya eşit olmalı

5. **Classroom Features**
   - Derslik özellikleri ders gereksinimlerini karşılamalı
   - Örnek: Laboratuvar dersi için laboratuvar dersliği gerekli

### Soft Constraints (Optimizasyon)

Bu constraint'ler mümkün olduğunca sağlanmalıdır:

1. **Respect Instructor Preferences**
   - Öğretim üyesi tercihlerine uyulmalı

2. **Minimize Gaps**
   - Öğrenci programlarındaki boşluklar minimize edilmeli

3. **Distribute Evenly**
   - Dersler haftaya eşit dağıtılmalı

4. **Prefer Morning for Required Courses**
   - Zorunlu dersler mümkünse sabah saatlerine yerleştirilmeli

## Algoritma

### Backtracking Algorithm

```javascript
function backtrack(sectionIndex, assignments) {
  // Base case: Tüm section'lar atandı
  if (sectionIndex >= sections.length) {
    return assignments;
  }

  const section = sections[sectionIndex];

  // Her zaman slotunu dene
  for (const timeSlot of timeSlots) {
    // Her dersliği dene
    for (const classroom of classrooms) {
      // Hard constraint'leri kontrol et
      if (!checkHardConstraints(section, classroom, timeSlot, assignments)) {
        continue; // Bu kombinasyon geçersiz, sonrakini dene
      }

      // Assignment oluştur
      const assignment = {
        section_id: section.id,
        day_of_week: timeSlot.day,
        start_time: timeSlot.start,
        end_time: timeSlot.end,
        classroom_id: classroom.id
      };

      // Assignment'ı ekle
      assignments.set(section.id, assignment);

      // Recursive call: Sonraki section'ı dene
      if (backtrack(sectionIndex + 1, assignments)) {
        return assignments; // Çözüm bulundu
      }

      // Backtrack: Bu assignment çalışmadı, geri al
      assignments.delete(section.id);
    }
  }

  return false; // Çözüm bulunamadı
}
```

### Heuristic Ordering

Daha hızlı çözüm bulmak için section'lar ve time slot'lar sıralanır:

1. **Section Ordering**:
   - Önce zorunlu dersler (required courses)
   - Sonra büyük kapasiteli section'lar
   - Son olarak küçük section'lar

2. **Time Slot Ordering**:
   - Önce sabah saatleri (09:00-12:00)
   - Sonra öğleden sonra (13:00-17:00)

3. **Classroom Ordering**:
   - Önce uygun kapasiteli derslikler
   - Sonra özellik uyumu olan derslikler

### Constraint Checking

```javascript
function checkHardConstraints(section, classroom, timeSlot, assignments) {
  // 1. Instructor double-booking kontrolü
  for (const [existingSectionId, existingAssignment] of assignments) {
    const existingSection = findSection(existingSectionId);
    
    // Aynı zaman slotunda ve aynı öğretim üyesi
    if (existingAssignment.day_of_week === timeSlot.day &&
        existingAssignment.start_time === timeSlot.start &&
        existingSection.instructor_id === section.instructor_id) {
      return false; // Conflict!
    }
  }

  // 2. Classroom double-booking kontrolü
  for (const [existingSectionId, existingAssignment] of assignments) {
    // Aynı derslik ve zaman çakışması
    if (existingAssignment.classroom_id === classroom.id &&
        existingAssignment.day_of_week === timeSlot.day &&
        timeOverlaps(existingAssignment.start_time, existingAssignment.end_time,
                     timeSlot.start, timeSlot.end)) {
      return false; // Conflict!
    }
  }

  // 3. Student schedule conflict kontrolü
  const sectionEnrollments = getEnrollments(section.id);
  for (const enrollment of sectionEnrollments) {
    const studentId = enrollment.student_id;
    const studentSections = getStudentSections(studentId);
    
    for (const studentSectionId of studentSections) {
      if (studentSectionId === section.id) continue;
      
      const studentAssignment = assignments.get(studentSectionId);
      if (studentAssignment &&
          studentAssignment.day_of_week === timeSlot.day &&
          timeOverlaps(studentAssignment.start_time, studentAssignment.end_time,
                       timeSlot.start, timeSlot.end)) {
        return false; // Student conflict!
      }
    }
  }

  // 4. Capacity kontrolü
  if (classroom.capacity < section.capacity) {
    return false; // Insufficient capacity!
  }

  // 5. Features kontrolü
  if (!classroomHasRequiredFeatures(classroom, section)) {
    return false; // Missing features!
  }

  return true; // Tüm constraint'ler sağlandı
}
```

### Optimization Phase

Hard constraint'ler sağlandıktan sonra, soft constraint'ler için optimizasyon yapılır:

```javascript
function optimizeSchedule(schedule, sections, classrooms, timeSlots, preferences) {
  let bestSchedule = schedule;
  let bestScore = calculateScore(schedule, preferences);

  // Local search: Komşu çözümleri dene
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const neighbor = generateNeighbor(schedule);
    const neighborScore = calculateScore(neighbor, preferences);

    if (neighborScore > bestScore) {
      bestSchedule = neighbor;
      bestScore = neighborScore;
    }
  }

  return bestSchedule;
}

function calculateScore(schedule, preferences) {
  let score = 0;

  // Instructor preferences
  for (const assignment of schedule) {
    const section = findSection(assignment.section_id);
    if (preferences[section.instructor_id]?.includes(assignment.day_of_week)) {
      score += 10;
    }
  }

  // Minimize gaps
  score -= countGaps(schedule) * 5;

  // Distribute evenly
  score += calculateDistributionScore(schedule);

  return score;
}
```

## Time Complexity

- **Worst Case**: O(b^d) - b = branching factor, d = depth
- **Average Case**: O(b^d) (heuristic'lerle iyileştirilebilir)
- **Best Case**: O(n) - n = section sayısı

## Space Complexity

- **O(n)**: n = section sayısı (assignments map'i)

## Örnek Senaryo

### Input

**Sections:**
- CENG101-A (50 öğrenci, Dr. Ahmet)
- CENG101-B (50 öğrenci, Dr. Ahmet)
- CENG201-A (30 öğrenci, Dr. Mehmet)

**Classrooms:**
- A-101 (kapasite: 60)
- A-102 (kapasite: 60)
- B-201 (kapasite: 40)

**Time Slots:**
- Monday 09:00-11:00
- Monday 11:00-13:00
- Tuesday 09:00-11:00

### Output

```
CENG101-A: Monday 09:00-11:00, A-101
CENG101-B: Tuesday 09:00-11:00, A-101
CENG201-A: Monday 11:00-13:00, A-102
```

### Constraint Kontrolü

✅ No instructor double-booking (Dr. Ahmet'in dersleri farklı zamanlarda)
✅ No classroom double-booking (A-101 farklı zamanlarda kullanılıyor)
✅ No student conflict (öğrenciler farklı section'larda)
✅ Capacity OK (tüm derslikler yeterli kapasitede)

## İyileştirme Önerileri

1. **Forward Checking**: Gelecekteki constraint'leri önceden kontrol et
2. **Arc Consistency**: Değişkenler arası tutarlılığı kontrol et
3. **Genetic Algorithm**: Büyük problemler için alternatif yaklaşım
4. **Simulated Annealing**: Global optimum arama
5. **Parallel Processing**: Farklı çözümleri paralel arama

## Kullanım

```javascript
const schedule = await SchedulingService.generateSchedule(
  sections,      // Array of section objects
  classrooms,    // Array of classroom objects
  timeSlots,     // Array of time slot objects
  preferences    // Object with instructor preferences
);
```

## Hata Durumları

Eğer tüm hard constraint'ler sağlanamazsa:
- `Error: Could not generate valid schedule with given constraints`

Bu durumda:
1. Constraint'leri gevşetin
2. Daha fazla derslik ekleyin
3. Zaman slot'larını artırın
4. Section kapasitelerini azaltın

## Kaynaklar

- [CSP Algorithms](https://en.wikipedia.org/wiki/Constraint_satisfaction_problem)
- [Backtracking](https://en.wikipedia.org/wiki/Backtracking)
- [Heuristic Search](https://en.wikipedia.org/wiki/Heuristic_(computer_science))

