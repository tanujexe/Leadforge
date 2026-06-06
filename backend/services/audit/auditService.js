const { chromium } = require('playwright');
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
 * Conducts a website audit on a target URL and captures screenshots
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

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 }
    });

    const page = await context.newPage();
    const startTime = Date.now();
    
    // Set 6-second timeout for navigation
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 6000
    });
    
    const responseTimeMs = Date.now() - startTime;

    if (!response) {
      throw new Error('No response received from website');
    }

    const finalUrl = page.url();
    const isHttps = finalUrl.startsWith('https://');
    const status = response.status();

    if (status >= 400) {
      await browser.close();
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

    // 1. Check Mobile Responsiveness via Viewport tag
    let isMobileResponsive = false;
    const viewportMeta = await page.$('meta[name="viewport"]');
    if (viewportMeta) {
      const content = await viewportMeta.getAttribute('content');
      if (content && content.includes('width=device-width')) {
        isMobileResponsive = true;
      }
    }

    // 2. SEO Audit
    const title = await page.title().catch(() => '');
    const metaDescription = await page.$eval('meta[name="description"]', el => el.getAttribute('content')).catch(() => '');
    const h1Count = await page.$$eval('h1', el => el.length).catch(() => 0);
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', el => el.length).catch(() => 0);
    const totalImages = await page.$$eval('img', el => el.length).catch(() => 0);

    const issues = [];
    let seoReady = true;

    if (!title || title.trim().length < 5) {
      issues.push('Title tag is missing or too short');
      seoReady = false;
    }
    if (!metaDescription || metaDescription.trim().length < 10) {
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
    if (title && title.trim().length >= 5) score += 10;
    if (metaDescription && metaDescription.trim().length >= 10) score += 10;
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

    // 3. Media Screenshot Engine Workflow
    let screenshotFull = null;
    let screenshotThumb = null;

    if (leadId) {
      try {
        const screenshotDir = path.join(__dirname, '../../public/screenshots');
        
        // Ensure static directory exists
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }

        const fullFileName = `${leadId}_full.png`;
        const thumbFileName = `${leadId}_thumb.png`;
        const fullFilePath = path.join(screenshotDir, fullFileName);
        const thumbFilePath = path.join(screenshotDir, thumbFileName);

        // Capture Full-Height Screenshot
        await page.screenshot({ path: fullFilePath, fullPage: true }).catch(err => {
          console.warn('[Screenshot Engine] Failed to capture full-page:', err.message);
        });

        // Capture Scaled Viewport Thumbnail of the top fold (Pure Playwright Solution)
        await page.setViewportSize({ width: 640, height: 400 });
        await page.screenshot({ path: thumbFilePath, fullPage: false }).catch(err => {
          console.warn('[Screenshot Engine] Failed to capture thumbnail:', err.message);
        });

        screenshotFull = `/screenshots/${fullFileName}`;
        screenshotThumb = `/screenshots/${thumbFileName}`;
      } catch (err) {
        console.error('[Screenshot Engine] Internal process error:', err.message);
      }
    }

    await browser.close();

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
    if (browser) {
      await browser.close().catch(() => {});
    }
    
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
