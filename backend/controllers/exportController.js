const Lead = require('../models/Lead');
const { generateExcelBuffer } = require('../services/excel/excelService');

/**
 * Downloads a professional, multi-sheet Excel workbook of all leads
 */
const exportLeadsToExcel = async (req, res, next) => {
  try {
    console.log('Exporting leads to Excel...');
    
    // Fetch all leads in database
    const leads = await Lead.find().sort({ createdAt: -1 });
    
    if (leads.length === 0) {
      res.status(404);
      throw new Error('No leads available to export. Search for some leads first!');
    }

    // Generate workbook buffer
    const buffer = await generateExcelBuffer(leads);
    
    // Format download filename with timestamp
    const dateStr = new Date().toISOString().slice(0,10);
    const filename = `LeadForge_Leads_Export_${dateStr}.xlsx`;

    // Set Response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`
    );

    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { exportLeadsToExcel };
