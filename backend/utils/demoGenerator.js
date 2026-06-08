const fs = require('fs');
const path = require('path');

/**
 * Generates 20-35 realistic mock leads for testing in Development Mode.
 * @param {string} businessType - E.g. "gym" or "cafe"
 * @param {string} location - E.g. "Bhopal" or "Gwalior"
 * @returns {Array<Object>} Mock business details
 */
function generateDemoLeads(businessType, location, limit = 30) {
  const normalizedType = businessType.toLowerCase().trim();
  const correctedType = normalizedType.includes('gym') ? 'Gym' 
                      : normalizedType.includes('cafe') ? 'Cafe' 
                      : normalizedType.includes('rest') ? 'Restaurant' 
                      : normalizedType.includes('sal') ? 'Salon' 
                      : 'Business';

  const count = limit;
  const leads = [];

  const adjectives = [
    'Elite', 'Iron', 'Active', 'Urban', 'Royal', 'Golden', 'Pulse', 'Apex',
    'Pure', 'Bliss', 'Classic', 'Epic', 'Metro', 'Fusion', 'Prime', 'Red',
    'Blue', 'Green', 'Velvet', 'Supreme', 'Absolute', 'Matrix', 'Horizon'
  ];

  const gymNouns = ['Gym', 'Fitness Club', 'Studio', 'Arena', 'Workouts', 'Iron Gym', 'Health Club'];
  const cafeNouns = ['Cafe', 'Coffee House', 'Bistro', 'Roasters', 'Lounge', 'Cup & Mug', 'Espresso Bar'];
  const restaurantNouns = ['Restaurant', 'Kitchen', 'Grill', 'Diner', 'Eatery', 'Bites', 'Table'];
  const salonNouns = ['Salon', 'Studio', 'Spa', 'Makeover', 'Cut & Color', 'Beauty Lounge', 'Unisex Salon'];
  const genericNouns = ['Hub', 'Center', 'Zone', 'Point', 'Spot'];

  const getNouns = () => {
    if (correctedType === 'Gym') return gymNouns;
    if (correctedType === 'Cafe') return cafeNouns;
    if (correctedType === 'Restaurant') return restaurantNouns;
    if (correctedType === 'Salon') return salonNouns;
    return genericNouns;
  };

  const nouns = getNouns();

  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const businessName = `${adj} ${noun} ${location}`;
    
    // Generate phone
    const phone = `+91 ${90000 + Math.floor(Math.random() * 10000)} ${Math.floor(10000 + Math.random() * 90000)}`;

    // Rating (1.5 to 5.0)
    const rating = parseFloat((1.5 + Math.random() * 3.5).toFixed(1));
    const reviewCount = Math.floor(Math.random() * 480) + 10;

    // Address
    const streets = ['Link Road', 'Main Road', 'Arera Colony', 'MP Nagar', 'Palasia', 'Vijay Nagar', 'MG Road', 'Bandra West', 'Colaba', 'DB Mall Road'];
    const street = streets[Math.floor(Math.random() * streets.length)];
    const address = `${10 + Math.floor(Math.random() * 200)}, ${street}, ${location}, MP, India`;

    // Website logic: 60% have website, 40% do not
    const hasWebsite = Math.random() < 0.6;
    let website = null;
    let mockAudit = null;

    if (hasWebsite) {
      const domainName = businessName.toLowerCase().replace(/[^a-z0-9]/g, '');
      website = `http://www.${domainName}.in`;

      // Generate a diverse mock audit
      const auditTypeRand = Math.random();
      let websiteScore = 0;
      let websiteStatus = 'Responsive';
      let issues = [];
      let responseTimeMs = 500 + Math.floor(Math.random() * 500);
      let isHttps = Math.random() < 0.7;
      let isMobileResponsive = true;

      if (auditTypeRand < 0.2) {
        // 1. Responsive & Good
        websiteScore = 80 + Math.floor(Math.random() * 15);
        websiteStatus = 'Responsive';
        if (!isHttps) {
          websiteScore -= 15;
          issues.push('Website does not use secure HTTPS protocol');
        }
      } else if (auditTypeRand < 0.4) {
        // 2. Slow website
        responseTimeMs = 2600 + Math.floor(Math.random() * 1500);
        websiteScore = 55 + Math.floor(Math.random() * 15);
        websiteStatus = 'Slow';
        issues.push(`Slow page load speed (response time: ${(responseTimeMs / 1000).toFixed(1)}s)`);
        if (!isHttps) {
          websiteScore -= 15;
          issues.push('Website does not use secure HTTPS protocol');
        }
      } else if (auditTypeRand < 0.65) {
        // 3. Non Responsive website
        isMobileResponsive = false;
        websiteScore = 30 + Math.floor(Math.random() * 20);
        websiteStatus = 'Non Responsive';
        issues.push('Missing mobile-responsive viewport meta tag');
        issues.push('Outdated layouts and overlapping text blocks on mobile screens');
        if (Math.random() < 0.5) {
          issues.push('Title tag is missing or too short');
        }
      } else if (auditTypeRand < 0.85) {
        // 4. Outdated website
        websiteScore = 20 + Math.floor(Math.random() * 25);
        websiteStatus = 'Outdated';
        isHttps = false;
        issues.push('Website does not use secure HTTPS protocol');
        issues.push('Outdated site structure, missing H1 tags, and poor meta description parameters');
        issues.push('5 images are missing alternative text (alt attributes)');
      } else {
        // 5. Offline website
        websiteScore = 10;
        websiteStatus = 'Offline';
        responseTimeMs = 0;
        isHttps = false;
        isMobileResponsive = false;
        issues.push('Failed to connect to website: Connection timed out or DNS error');
      }

      mockAudit = {
        websiteScore,
        websiteStatus,
        responseTimeMs,
        isHttps,
        isMobileResponsive,
        seoReady: websiteScore > 60,
        issues,
        screenshotFull: `/screenshots/demo_full.png`,
        screenshotThumb: `/screenshots/demo_thumb.png`,
        htmlMetadata: {
          title: `${businessName} | Official Website`,
          description: `Welcome to ${businessName}. Find reviews, contact phone numbers, hours, and menu specifications here.`,
          h1Count: websiteStatus === 'Outdated' ? 0 : 1,
          missingAltCount: websiteStatus === 'Outdated' ? 5 : 0
        }
      };
    } else {
      mockAudit = {
        websiteScore: 0,
        websiteStatus: 'No Website',
        issues: ['No website URL on Google Maps profile']
      };
    }

    leads.push({
      businessName,
      phone,
      website,
      address,
      googleMapsUrl: `https://www.google.com/maps/place/${encodeURIComponent(businessName)}/@${22 + Math.random()},${77 + Math.random()},15z`,
      rating,
      reviewCount,
      category: correctedType,
      isDemo: true,
      mockAudit
    });
  }

  return leads;
}

/**
 * Ensures that placeholder files for demo screenshots exist.
 */
function ensureDemoScreenshots() {
  const dir = path.join(__dirname, '../public/screenshots');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const fullPath = path.join(dir, 'demo_full.png');
  const thumbPath = path.join(dir, 'demo_thumb.png');
  
  // 1x1 solid dark gray pixel PNG base64 representation
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  const buffer = Buffer.from(base64Png, 'base64');
  
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, buffer);
  }
  if (!fs.existsSync(thumbPath)) {
    fs.writeFileSync(thumbPath, buffer);
  }
}

module.exports = { generateDemoLeads, ensureDemoScreenshots };
