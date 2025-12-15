// Mock pdfkit module for testing
const mockPDFDocument = jest.fn().mockImplementation(() => ({
  pipe: jest.fn().mockReturnThis(),
  font: jest.fn().mockReturnThis(),
  fontSize: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  moveDown: jest.fn().mockReturnThis(),
  end: jest.fn()
}));

module.exports = mockPDFDocument;

