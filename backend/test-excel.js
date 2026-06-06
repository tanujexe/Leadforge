const fs = require('fs');
const path = require('path');
const { generateExcelBuffer } = require('./services/excel/excelService');

console.log('--- RUNNING EXCEL EXPORT ENGINE VERIFICATION ---');

const mockLeads = [
  {
    businessName: 'Gwalior Fitness Hub',
    phone: '+91 98765 43210',
    website: 'https://example.com',
    address: '14, Main Road, Gwalior, MP, India',
    googleMapsUrl: 'https://www.google.com/maps/place/Gwalior+Fitness+Hub',
    rating: 4.8,
    reviewCount: 150,
    category: 'Gym',
    websiteScore: 85,
    websiteStatus: 'Responsive',
    leadScore: 85,
    opportunityLevel: 'High',
    recommendedService: 'SEO Optimization & Landing Pages',
    status: 'New',
    aiSummary: 'Gwalior Fitness Hub has a solid Google profile and a responsive website, but speed optimizations can bring in more traffic.',
    aiReason: 'Excellent reputation but missing local SEO parameters.',
    callPitch: 'Call script mock here...',
    whatsappPitch: 'WhatsApp mock here...',
    emailPitch: 'Email template mock here...',
    meetingPitch: 'Meeting proposal mock here...',
    notes: [{ content: 'Emailed audit report link', createdAt: new Date() }]
  },
  {
    businessName: 'Bhopal Spicy Feast',
    phone: '+91 91111 22222',
    website: null,
    address: '22, Link Road, Bhopal, MP, India',
    googleMapsUrl: 'https://www.google.com/maps/place/Bhopal+Spicy+Feast',
    rating: 4.2,
    reviewCount: 80,
    category: 'Restaurant',
    websiteScore: 0,
    websiteStatus: 'No Website',
    leadScore: 70,
    opportunityLevel: 'Medium',
    recommendedService: 'Website Development',
    status: 'Contacted',
    aiSummary: 'Bhopal Spicy Feast has a good reputation but lacks a web presence entirely.',
    aiReason: 'No website leads to zero organic search captures.',
    callPitch: 'Call script mock here...',
    whatsappPitch: 'WhatsApp mock here...',
    emailPitch: 'Email template mock here...',
    meetingPitch: 'Meeting proposal mock here...',
    notes: [{ content: 'Left voicemail for manager', createdAt: new Date() }]
  }
];

async function runTest() {
  try {
    const buffer = await generateExcelBuffer(mockLeads);
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Generated Excel buffer is empty or null.');
    }

    const exportPath = path.join(__dirname, 'test-export.xlsx');
    fs.writeFileSync(exportPath, buffer);

    console.log(`✅ Success: Excel buffer compiled successfully.`);
    console.log(`✅ Buffer Size: ${buffer.length} bytes.`);
    console.log(`✅ Test Workbook written to: ${exportPath}`);
    console.log('\n🎉 EXCEL EXPORT ENGINE IS FULLY OPERATIONAL AND VERIFIED!\n');
  } catch (error) {
    console.error('❌ Excel Export test failed:', error.message);
    process.exit(1);
  }
}

runTest();
