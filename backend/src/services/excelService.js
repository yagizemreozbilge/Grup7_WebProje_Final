const ExcelJS = require('exceljs');

class ExcelService {
  /**
   * Create a styled workbook with modern design
   */
  static createWorkbook(title = 'Rapor') {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Campus Management System';
    workbook.created = new Date();
    workbook.modified = new Date();
    return workbook;
  }

  /**
   * Style header row with modern colors
   */
  static styleHeaderRow(worksheet, rowNumber) {
    const headerRow = worksheet.getRow(rowNumber);
    headerRow.font = {
      bold: true,
      size: 14,
      color: { argb: 'FFFFFFFF' },
      name: 'Calibri'
    };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E40AF' } // Darker blue for better contrast
    };
    headerRow.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    headerRow.height = 30;
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      right: { style: 'medium', color: { argb: 'FF1E3A8A' } }
    };
  }

  /**
   * Style data rows with alternating colors
   */
  static styleDataRow(worksheet, rowNumber, isEven = false) {
    const row = worksheet.getRow(rowNumber);
    row.font = {
      size: 11,
      color: { argb: 'FF1E293B' }, // Dark text for readability
      name: 'Calibri'
    };
    row.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: isEven ? 'FFF8FAFC' : 'FFFFFFFF' } // Gray-50 or White
    };
    row.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      wrapText: true
    };
    row.height = 22;
    row.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };
  }

  /**
   * Add title row to worksheet
   */
  static addTitle(worksheet, title, subtitle = null) {
    // Title row
    const titleRow = worksheet.addRow([title]);
    titleRow.font = {
      bold: true,
      size: 18,
      color: { argb: 'FF1E293B' },
      name: 'Calibri'
    };
    titleRow.height = 35;
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    
    // Merge cells for title
    const maxCols = Math.max(worksheet.columnCount || 5, 10);
    worksheet.mergeCells(1, 1, 1, maxCols);
    
    // Subtitle row
    if (subtitle) {
      const subtitleRow = worksheet.addRow([subtitle]);
      subtitleRow.font = {
        size: 12,
        color: { argb: 'FF475569' },
        name: 'Calibri'
      };
      subtitleRow.height = 25;
      subtitleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
      worksheet.mergeCells(2, 1, 2, maxCols);
    }
    
    // Empty row for spacing
    worksheet.addRow([]);
  }

  /**
   * Add summary section
   */
  static addSummary(worksheet, summaryData) {
    const startRow = worksheet.rowCount + 1;
    worksheet.addRow(['Özet Bilgiler']);
    const summaryTitleRow = worksheet.getRow(startRow);
    summaryTitleRow.font = { bold: true, size: 12, color: { argb: 'FF1E293B' } };
    summaryTitleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF1F5F9' }
    };
    worksheet.mergeCells(startRow, 1, startRow, 2);
    
    Object.entries(summaryData).forEach(([key, value], index) => {
      const row = worksheet.addRow([key, value]);
      this.styleDataRow(worksheet, startRow + 1 + index, index % 2 === 0);
    });
  }

  /**
   * Create attendance report
   */
  static async createAttendanceReport(data, sectionInfo = null) {
    const workbook = this.createWorkbook('Yoklama Raporu');
    const worksheet = workbook.addWorksheet('Yoklama Raporu');

    // Title
    const title = sectionInfo 
      ? `${sectionInfo.courseCode} - ${sectionInfo.courseName} (Şube ${sectionInfo.sectionNumber})`
      : 'Yoklama Raporu';
    const subtitle = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    this.addTitle(worksheet, title, subtitle);

    // Headers
    const headers = ['Öğrenci No', 'Ad Soyad', 'Katılım', 'Toplam', 'Devamsızlık (%)', 'Durum'];
    const headerRow = worksheet.addRow(headers);
    const headerRowNum = worksheet.rowCount;
    this.styleHeaderRow(worksheet, headerRowNum);

    // Data rows
    data.forEach((item, index) => {
      const absencePercent = item.absencePercent || 0;
      const status = absencePercent > 30 ? 'Yüksek Devamsızlık' : absencePercent > 20 ? 'Orta Devamsızlık' : 'Normal';
      
      const row = worksheet.addRow([
        item.studentNumber || item.student_number,
        item.fullName || item.full_name,
        item.presentCount || item.present_count || 0,
        item.totalCount || item.total_count || 0,
        absencePercent.toFixed(2),
        status
      ]);

      this.styleDataRow(worksheet, headerRowNum + 1 + index, index % 2 === 0);

      // Color code status column
      const statusCell = row.getCell(6);
      if (absencePercent > 30) {
        statusCell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red
      } else if (absencePercent > 20) {
        statusCell.font = { color: { argb: 'FFF59E0A' }, bold: true }; // Orange
      } else {
        statusCell.font = { color: { argb: 'FF10B981' }, bold: true }; // Green
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 15 }, // Öğrenci No
      { width: 30 }, // Ad Soyad
      { width: 12 }, // Katılım
      { width: 12 }, // Toplam
      { width: 15 }, // Devamsızlık %
      { width: 20 }  // Durum
    ];

    // Add summary
    const total = data.length;
    const avgAbsence = data.reduce((sum, item) => sum + (item.absencePercent || 0), 0) / total;
    const highAbsence = data.filter(item => (item.absencePercent || 0) > 30).length;
    
    this.addSummary(worksheet, {
      'Toplam Öğrenci': total,
      'Ortalama Devamsızlık': `${avgAbsence.toFixed(2)}%`,
      'Yüksek Devamsızlık': highAbsence
    });

    return workbook;
  }

  /**
   * Create analytics report
   */
  static async createAnalyticsReport(type, data, headers) {
    const reportTitle = this.getReportTitle(type);
    const workbook = this.createWorkbook(reportTitle);
    const worksheet = workbook.addWorksheet(reportTitle);

    // Title
    const title = this.getReportTitle(type);
    const subtitle = `Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    
    this.addTitle(worksheet, title, subtitle);

    // Headers
    worksheet.addRow(headers);
    const headerRowNum = worksheet.rowCount;
    this.styleHeaderRow(worksheet, headerRowNum);

    // Data rows
    data.forEach((item, index) => {
      const rowData = Array.isArray(item) ? item : Object.values(item);
      const row = worksheet.addRow(rowData);
      this.styleDataRow(worksheet, headerRowNum + 1 + index, index % 2 === 0);
    });

    // Auto-fit columns with better widths
    worksheet.columns.forEach((column, index) => {
      const headerLength = headers[index]?.length || 10;
      // Calculate optimal width based on header and data
      let maxLength = headerLength;
      data.forEach(row => {
        const cellValue = Array.isArray(row) ? String(row[index] || '') : String(Object.values(row)[index] || '');
        if (cellValue.length > maxLength) {
          maxLength = cellValue.length;
        }
      });
      column.width = Math.max(15, Math.min(maxLength + 3, 50)); // Min 15, Max 50
    });

    return workbook;
  }

  /**
   * Get report title in Turkish
   */
  static getReportTitle(type) {
    const titles = {
      'academic': 'Akademik Performans Raporu',
      'attendance': 'Yoklama Analitik Raporu',
      'meal': 'Yemek Kullanım Raporu',
      'event': 'Etkinlik Raporu'
    };
    return titles[type] || `${type}_report`;
  }
}

module.exports = ExcelService;

