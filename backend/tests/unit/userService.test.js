const userService = require('../../src/services/userService');

// Mock Prisma Client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../../src/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
}));

describe('userService (unit)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Get user by ID', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@test.edu',
      role: 'STUDENT',
      fullName: 'Test User',
      phone: '+905551234567',
      student: {
        studentNumber: '20210001',
        department: { name: 'CE', code: 'CE' },
      },
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await userService.getCurrentUser('user-1');

    expect(result.id).toBe('user-1');
    expect(result.email).toBe('user@test.edu');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('Update user profile', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@test.edu',
      fullName: 'Old Name',
      phone: '+111',
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      fullName: 'New Name',
      phone: '+905551234567',
    });

    const result = await userService.updateProfile('user-1', {
      fullName: 'New Name',
      phone: '+905551234567',
    });

    expect(mockPrisma.user.update).toHaveBeenCalled();
    expect(result.fullName).toBe('New Name');
    expect(result.phone).toBe('+905551234567');
  });

  it('Upload profile picture validation', async () => {
    const mockUser = {
      id: 'user-1',
      profilePictureUrl: null,
    };

    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.user.update.mockResolvedValue({
      ...mockUser,
      profilePictureUrl: '/uploads/profile.jpg',
    });

    const result = await userService.updateProfilePicture('user-1', '/uploads/profile.jpg');

    expect(mockPrisma.user.update).toHaveBeenCalled();
    expect(result).toBe('/uploads/profile.jpg');
  });
});
