const Lead = require('../models/Lead');
const { generateExcelBuffer } = require('../services/excel/excelService');

/**
 * Downloads a professional, multi-sheet Excel workbook of leads
 * Supports live filters (category, city, search, status, websiteStatus, or specific selected IDs)
 * Generates custom dynamic filenames (e.g. Gwalior_Cafe_Leads_Export_2026-06-07.xlsx)
 */
const exportLeadsToExcel = async (req, res, next) => {
  try {
    console.log('Exporting filtered leads to Excel...');
    
    const { ids, search, hasWebsite, opportunityLevel, status, websiteStatus, category, city } = req.query;
    
    // Default query: exclude soft-deleted leads
    let query = { isDeleted: { $ne: true } };

    // 1. Filter by specific selected IDs (Bulk export takes priority)
    if (ids) {
      const idArray = ids.split(',').filter(id => id.trim() !== '');
      if (idArray.length > 0) {
        query._id = { $in: idArray };
      }
    } else {
      // 2. Full-text search using MongoDB Text Index
      if (search) {
        query.$text = { $search: search };
      }

      // 3. Filter: Has Website
      if (hasWebsite) {
        if (hasWebsite === 'true') {
          query.website = { $exists: true, $nin: [null, '', 'null'] };
        } else {
          query.$or = [
            { website: { $exists: false } },
            { website: null },
            { website: '' },
            { website: 'null' }
          ];
        }
      }

      // 4. Filter: Opportunity Level
      if (opportunityLevel) {
        query.opportunityLevel = opportunityLevel;
      }

      // 5. Filter: Outreach Status
      if (status) {
        query.status = status;
      }

      // 6. Filter: Website Status
      if (websiteStatus) {
        query.websiteStatus = websiteStatus;
      }

      // 7. Filter: Category (Niche)
      if (category) {
        query.category = category;
      }

      // 8. Filter: City (Location)
      if (city) {
        query.address = { $regex: new RegExp(city.trim(), 'i') };
      }
    }

    // Fetch matching leads
    const leads = await Lead.find(query).sort({ createdAt: -1 });
    
    if (leads.length === 0) {
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Export Failed - ClientScout</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            body {
              background-color: #0b0f19;
              color: #f3f4f6;
              font-family: 'Inter', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .card {
              background: rgba(20, 27, 43, 0.75);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              max-width: 440px;
              backdrop-filter: blur(16px);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }
            h1 {
              font-family: 'Outfit', sans-serif;
              font-weight: 800;
              margin: 0 0 12px 0;
              font-size: 24px;
              background: linear-gradient(135deg, #f87171, #ef4444);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            p {
              font-size: 13px;
              color: #9ca3af;
              line-height: 1.6;
              margin: 0 0 24px 0;
            }
            .btn {
              display: inline-block;
              background-color: #3b82f6;
              color: #ffffff;
              text-decoration: none;
              font-weight: 600;
              font-size: 12px;
              padding: 10px 24px;
              border-radius: 8px;
              transition: background-color 0.2s;
            }
            .btn:hover {
              background-color: #2563eb;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>No Leads to Export</h1>
            <p>We couldn't find any scouted clients matching your active filter criteria. Try running a new scanner query or clearing some of your directory filters.</p>
            <a href="javascript:window.close()" class="btn">Close Window</a>
          </div>
        </body>
        </html>
      `);
    }

    // Generate workbook buffer
    const buffer = await generateExcelBuffer(leads);
    
    // Construct dynamic prefix based on filters
    let prefix = 'ClientScout';
    if (city && category) {
      prefix = `${city}_${category}`;
    } else if (city) {
      prefix = `${city}`;
    } else if (category) {
      prefix = `${category}`;
    }
    
    // Clean spaces and special characters from filename prefix
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_]/g, '_');
    const dateStr = new Date().toISOString().slice(0,10);
    const filename = `${cleanPrefix}_Leads_Export_${dateStr}.xlsx`;

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
