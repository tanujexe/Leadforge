const fs = require('fs');
const path = require('path');

/**
 * Normalizes URL to ensure it starts with http/https
 */
function normalizeUrl(url) {
  if (!url) return null;
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'http://' + cleanUrl;
  }
  return cleanUrl;
}

/**
 * Conducts a website audit on a target URL using lightweight fetch & HTML regex parsing.
 * Eliminates Playwright browser dependencies for easy and lightweight deployment.
 * @param {string} rawUrl - Website to audit
 * @param {string} leadId - Database ID of the lead to name screenshots
 */
async function auditWebsite(rawUrl, leadId) {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return {
      websiteScore: 0,
      websiteStatus: 'No Website',
      issues: ['No website URL provided']
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6-second timeout
    const startTime = Date.now();

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    const finalUrl = response.url || url;
    const isHttps = finalUrl.startsWith('https://');
    const status = response.status;

    if (status >= 400) {
      return {
        websiteScore: 10,
        websiteStatus: 'Offline',
        responseTimeMs,
        isHttps,
        isMobileResponsive: false,
        seoReady: false,
        issues: [`Website returned HTTP error status ${status}`]
      };
    }

    const html = await response.text();

    // 1. Check Mobile Responsiveness via Viewport tag
    let isMobileResponsive = false;
    const viewportMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i) || 
                          html.match(/<meta[^>]+content=["'][^"']*viewport[^"']*["'][^>]*>/i);
    if (viewportMatch) {
      const contentMatch = viewportMatch[0].match(/content=["']([^"']+)["']/i);
      if (contentMatch && contentMatch[1].includes('width=device-width')) {
        isMobileResponsive = true;
      }
    }

    // 2. SEO Audit using Regex
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description/i);
    const metaDescription = descMatch ? descMatch[1].trim() : '';

    const h1Count = (html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || []).length;
    
    const imgTags = html.match(/<img\b[^>]*>/gi) || [];
    const totalImages = imgTags.length;
    let imagesWithoutAlt = 0;
    for (const img of imgTags) {
      if (!/alt=["']/i.test(img) || /alt=["']\s*["']/i.test(img)) {
        imagesWithoutAlt++;
      }
    }

    const issues = [];
    let seoReady = true;

    if (!title || title.length < 5) {
      issues.push('Title tag is missing or too short');
      seoReady = false;
    }
    if (!metaDescription || metaDescription.length < 10) {
      issues.push('Meta description is missing or too short');
      seoReady = false;
    }
    if (h1Count === 0) {
      issues.push('Missing h1 heading tag');
      seoReady = false;
    }
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images are missing alternative text (alt attributes)`);
    }
    if (!isHttps) {
      issues.push('Website does not use secure HTTPS protocol');
    }
    if (!isMobileResponsive) {
      issues.push('Missing mobile-responsive viewport meta tag');
    }
    if (responseTimeMs > 2500) {
      issues.push(`Slow page load speed (response time: ${(responseTimeMs / 1000).toFixed(1)}s)`);
    }

    // Calculate score out of 100
    let score = 0;
    if (isHttps) score += 15;
    if (isMobileResponsive) score += 25;
    if (responseTimeMs < 1500) {
      score += 25;
    } else if (responseTimeMs < 3000) {
      score += 15;
    } else {
      score += 5;
    }
    if (title && title.length >= 5) score += 10;
    if (metaDescription && metaDescription.length >= 10) score += 10;
    if (h1Count > 0) score += 10;
    if (totalImages === 0 || imagesWithoutAlt / totalImages < 0.3) score += 5;

    // Categorize websiteStatus
    let websiteStatus = 'Responsive';
    if (!isMobileResponsive) {
      websiteStatus = 'Non Responsive';
    } else if (responseTimeMs > 2500) {
      websiteStatus = 'Slow';
    } else if (score < 50) {
      websiteStatus = 'Outdated';
    }

    // 3. Media Screenshot Engine Workflow (Placeholder Copy)
    let screenshotFull = null;
    let screenshotThumb = null;

    if (leadId) {
      try {
        const screenshotDir = path.join(__dirname, '../../public/screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const demoFullFilePath = path.join(screenshotDir, 'demo_full.png');
        const demoThumbFilePath = path.join(screenshotDir, 'demo_thumb.png');
        
        const fullFileName = `${leadId}_full.png`;
        const thumbFileName = `${leadId}_thumb.png`;
        const fullFilePath = path.join(screenshotDir, fullFileName);
        const thumbFilePath = path.join(screenshotDir, thumbFileName);

        // Copy placeholder images if they exist
        if (fs.existsSync(demoFullFilePath)) {
          fs.copyFileSync(demoFullFilePath, fullFilePath);
        }
        if (fs.existsSync(demoThumbFilePath)) {
          fs.copyFileSync(demoThumbFilePath, thumbFilePath);
        }

        screenshotFull = `/screenshots/${fullFileName}`;
        screenshotThumb = `/screenshots/${thumbFileName}`;
      } catch (err) {
        console.error('[Screenshot Engine] Internal process error:', err.message);
      }
    }

    return {
      websiteScore: score,
      websiteStatus,
      responseTimeMs,
      isHttps,
      isMobileResponsive,
      seoReady,
      issues,
      screenshotFull,
      screenshotThumb,
      htmlMetadata: {
        title: title || undefined,
        description: metaDescription || undefined,
        h1Count,
        missingAltCount: imagesWithoutAlt
      }
    };
  } catch (error) {
    return {
      websiteScore: 0,
      websiteStatus: 'Offline',
      responseTimeMs: 0,
      isHttps: false,
      isMobileResponsive: false,
      seoReady: false,
      issues: [`Failed to connect to website: ${error.message}`]
    };
  }
}

module.exports = { auditWebsite };
