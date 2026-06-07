const ExcelJS = require('exceljs');

/**
 * Maps notes array into a single concatenated string
 */
function formatNotes(notes) {
  if (!notes || notes.length === 0) return '';
  return notes
    .map(n => `[${new Date(n.createdAt).toLocaleDateString()}] ${n.content}`)
    .join('\n');
}

/**
 * Formats a single lead object into a row array matching columns (excluding Groq AI pitches)
 */
function leadToRow(lead) {
  return [
    lead.businessName || '',
    lead.phone || '',
    lead.website || 'No Website',
    lead.category || '',
    lead.rating || 0,
    lead.reviewCount || 0,
    lead.address || '',
    lead.leadScore || 0,
    lead.opportunityLevel || 'Low',
    lead.recommendedService || '',
    lead.websiteScore || 0,
    lead.websiteStatus || 'No Website',
    lead.status || 'New',
    formatNotes(lead.notes)
  ];
}

/**
 * Creates and styles a sheet inside the workbook, then adds rows
 */
function addStyledSheet(workbook, sheetName, leads) {
  const sheet = workbook.addWorksheet(sheetName);

  // Setup Columns (Excludes Groq AI pitch columns)
  sheet.columns = [
    { header: 'Business Name', key: 'businessName', width: 25 },
    { header: 'Phone Number', key: 'phone', width: 18 },
    { header: 'Website URL', key: 'website', width: 28 },
    { header: 'Business Category', key: 'category', width: 20 },
    { header: 'Google Rating', key: 'rating', width: 15 },
    { header: 'Review Count', key: 'reviewCount', width: 15 },
    { header: 'Address', key: 'address', width: 35 },
    { header: 'Lead Score (0-100)', key: 'leadScore', width: 18 },
    { header: 'Opportunity Level', key: 'opportunityLevel', width: 18 },
    { header: 'Recommended Service', key: 'recommendedService', width: 28 },
    { header: 'Website Score (0-100)', key: 'websiteScore', width: 20 },
    { header: 'Website Status', key: 'websiteStatus', width: 18 },
    { header: 'Outreach Status', key: 'status', width: 15 },
    { header: 'User Notes', key: 'notes', width: 30 }
  ];

  // Add rows
  leads.forEach(lead => {
    const row = sheet.addRow(leadToRow(lead));
    
    // Enable text wrapping for long text columns
    row.getCell('address').alignment = { wrapText: true, vertical: 'top' };
    row.getCell('notes').alignment = { wrapText: true, vertical: 'top' };

    // Align numeric and status cells
    row.getCell('rating').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('reviewCount').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('leadScore').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('opportunityLevel').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('websiteScore').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('websiteStatus').alignment = { horizontal: 'center', vertical: 'middle' };
    row.getCell('status').alignment = { horizontal: 'center', vertical: 'middle' };

    // Apply color-coding to Opportunity levels
    const oppLevel = lead.opportunityLevel;
    const oppCell = row.getCell('opportunityLevel');
    if (oppLevel === 'High') {
      oppCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'D1FAE5' } // Emerald light green
      };
      oppCell.font = { color: { argb: '065F46' }, bold: true };
    } else if (oppLevel === 'Medium') {
      oppCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEF3C7' } // Amber light yellow
      };
      oppCell.font = { color: { argb: '92400E' }, bold: true };
    } else {
      oppCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FEE2E2' } // Red light red
      };
      oppCell.font = { color: { argb: '991B1B' }, bold: true };
    }
  });

  // Style Header Row
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0F172A' } // Slate Dark Background
    };
    cell.font = {
      color: { argb: 'F8FAFC' }, // Slate White Text
      bold: true,
      size: 11
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
  });

  // Enable Auto-Filters (14 columns total)
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: leads.length + 1, column: 14 }
  };
}

/**
 * Compiles lead collections into a multi-sheet styled buffer
 */
async function generateExcelBuffer(leads) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ClientScout';
  workbook.created = new Date();

  // Filters for sheets
  const hasWebsite = l => !!l.website && l.website !== 'null' && l.website !== '';
  
  const sheetDefinitions = [
    { name: 'All Leads', filter: () => true },
    { name: 'No Website Leads', filter: l => !hasWebsite(l) },
    { name: 'Website Leads', filter: l => hasWebsite(l) },
    { name: 'High Opportunity Leads', filter: l => l.opportunityLevel === 'High' },
    { name: 'Responsive Websites', filter: l => l.websiteStatus === 'Responsive' },
    { name: 'Non Responsive Websites', filter: l => l.websiteStatus === 'Non Responsive' },
    { name: 'Slow Websites', filter: l => l.websiteStatus === 'Slow' },
    { name: 'Contacted Leads', filter: l => l.status === 'Contacted' },
    { name: 'Follow Up Leads', filter: l => l.status === 'Follow Up' },
    { name: 'Closed Leads', filter: l => l.status === 'Closed' }
  ];

  sheetDefinitions.forEach(def => {
    const filteredLeads = leads.filter(def.filter);
    addStyledSheet(workbook, def.name, filteredLeads);
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = { generateExcelBuffer };
