const haversine = require('../../src/utils/haversine');

describe('Haversine - Unit Tests', () => {
  
  test('should return 0 for same point', () => {
    expect(haversine(0, 0, 0, 0)).toBeCloseTo(0);
    expect(haversine(41.0082, 28.9784, 41.0082, 28.9784)).toBeCloseTo(0);
  });

  test('should calculate correct distance between Istanbul and Ankara', () => {
    // Istanbul (41.0082, 28.9784) - Ankara (39.9334, 32.8597)
    const d = haversine(41.0082, 28.9784, 39.9334, 32.8597);
    expect(d).toBeGreaterThan(340000); // ~352 km
    expect(d).toBeLessThan(450000);
  });

  test('should calculate distance correctly for nearby points', () => {
    // Two points approximately 1 km apart
    const lat1 = 41.0082;
    const lon1 = 28.9784;
    const lat2 = 41.0173; // ~1km north
    const lon2 = 28.9784;
    
    const d = haversine(lat1, lon1, lat2, lon2);
    expect(d).toBeGreaterThan(900); // ~1km
    expect(d).toBeLessThan(1200);
  });

  test('should handle negative coordinates (southern/western hemisphere)', () => {
    // Two points in different hemispheres
    const d = haversine(-41.0082, -28.9784, -39.9334, -32.8597);
    expect(d).toBeGreaterThan(340000);
    expect(d).toBeLessThan(450000);
  });

  test('should be symmetric (distance A->B equals B->A)', () => {
    const lat1 = 41.0082;
    const lon1 = 28.9784;
    const lat2 = 39.9334;
    const lon2 = 32.8597;
    
    const d1 = haversine(lat1, lon1, lat2, lon2);
    const d2 = haversine(lat2, lon2, lat1, lon1);
    
    expect(d1).toBeCloseTo(d2);
  });

  test('should handle coordinates at poles', () => {
    // North pole to a point
    const d = haversine(90, 0, 0, 0);
    expect(d).toBeCloseTo(10007543, -1); // ~10,007 km (quarter of Earth's circumference)
  });

  test('should handle coordinates crossing 180th meridian (date line)', () => {
    // Points on opposite sides of date line
    const d = haversine(0, 179, 0, -179);
    expect(d).toBeGreaterThan(200000); // Should be close
    expect(d).toBeLessThan(250000);
  });

  test('should handle very small distances (within geofence range)', () => {
    // Two points ~10 meters apart
    const lat1 = 41.0082;
    const lon1 = 28.9784;
    const lat2 = 41.00829; // ~10m north
    const lon2 = 28.9784;
    
    const d = haversine(lat1, lon1, lat2, lon2);
    expect(d).toBeGreaterThan(5);
    expect(d).toBeLessThan(15);
  });

  test('should return positive values for all valid coordinates', () => {
    const testCases = [
      [0, 0, 0, 1],
      [1, 1, 2, 2],
      [-1, -1, -2, -2],
      [45, 90, -45, -90],
      [90, 0, -90, 0]
    ];
    
    testCases.forEach(([lat1, lon1, lat2, lon2]) => {
      const d = haversine(lat1, lon1, lat2, lon2);
      expect(d).toBeGreaterThanOrEqual(0);
    });
  });

  test('should handle geofence radius scenario (15m radius)', () => {
    // Simulate geofence: center point and a point 20m away
    const centerLat = 41.0082;
    const centerLon = 28.9784;
    const pointLat = 41.00835; // ~20m away
    const pointLon = 28.9784;
    
    const distance = haversine(centerLat, centerLon, pointLat, pointLon);
    const geofenceRadius = 15;
    const accuracy = 5;
    const allowed = geofenceRadius + accuracy; // 20m
    
    expect(distance).toBeGreaterThan(allowed);
  });

  test('should handle geofence radius scenario (within range)', () => {
    // Simulate geofence: center point and a point 10m away
    const centerLat = 41.0082;
    const centerLon = 28.9784;
    const pointLat = 41.00825; // ~10m away
    const pointLon = 28.9784;
    
    const distance = haversine(centerLat, centerLon, pointLat, pointLon);
    const geofenceRadius = 15;
    const accuracy = 5;
    const allowed = geofenceRadius + accuracy; // 20m
    
    expect(distance).toBeLessThan(allowed);
  });

  test('should handle edge case: coordinates very close to zero', () => {
    const d = haversine(0.0001, 0.0001, 0.0002, 0.0002);
    expect(d).toBeGreaterThanOrEqual(0);
    expect(d).toBeLessThan(100); // Should be small distance
  });

  test('should handle maximum latitude values', () => {
    const d = haversine(89.9, 0, -89.9, 0);
    expect(d).toBeGreaterThan(19000000); // Almost opposite poles
    expect(d).toBeLessThan(20020000);
  });

  test('should handle longitude wrapping correctly', () => {
    // Points that wrap around 360 degrees
    const d1 = haversine(0, 359, 0, 1);
    const d2 = haversine(0, 1, 0, 359);
    
    expect(d1).toBeCloseTo(d2);
    expect(d1).toBeGreaterThan(200000);
    expect(d1).toBeLessThan(250000);
  });
});













