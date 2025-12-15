const haversine = require('../utils/haversine');

describe('Haversine', () => {
  it('should return 0 for same point', () => {
    expect(haversine(0, 0, 0, 0)).toBeCloseTo(0);
  });
  it('should calculate correct distance', () => {
    // Istanbul (41.0082, 28.9784) - Ankara (39.9334, 32.8597)
    const d = haversine(41.0082, 28.9784, 39.9334, 32.8597);
    expect(d).toBeGreaterThan(350000);
    expect(d).toBeLessThan(450000);
  });
});
