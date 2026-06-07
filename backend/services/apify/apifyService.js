const { ApifyClient } = require('apify-client');

/**
 * Searches Google Maps for business leads using the official Apify Google Maps Scraper Actor
 */
async function searchGoogleMaps(businessType, location) {
  const token = process.env.APIFY_TOKEN;

  if (!token || token.trim() === '' || token === 'your_apify_api_token') {
    const error = new Error('APIFY_TOKEN is missing or not configured.');
    error.code = 'MISSING_API_CREDENTIALS';
    error.instructions = {
      apify: 'Please obtain your Apify Token at https://console.apify.com/settings/integrations and add it as APIFY_TOKEN in your backend/.env configuration.'
    };
    throw error;
  }

  try {
    const client = new ApifyClient({ token });
    const query = `${businessType} in ${location}`;
    console.log(`[Apify Service] Starting Google Maps Scraper Actor run for: "${query}"`);

    // Input parameters optimized for speed and token budget
    const input = {
      searchStringsArray: [query],
      maxCrawledPlacesPerSearch: 20, // Clamps results for local performance
      maxReviews: 0, // Disabling reviews speeds up execution significantly
      maxImages: 0,
      language: 'en'
    };

    // Run the actor
    const run = await client.actor('compass/crawler-google-places').call(input);
    
    // Fetch result items
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`[Apify Service] Google Maps Actor completed. Found ${items.length} raw listings.`);

    // Map Apify output to lead fields
    return items.map(item => {
      let website = item.website || null;
      
      // Clean google maps redirect wrappers if present
      if (website && website.includes('google.com/url')) {
        try {
          const urlObj = new URL(website);
          website = urlObj.searchParams.get('q') || website;
        } catch (e) {}
      }

      return {
        businessName: item.title || 'Unknown Business',
        phone: item.phone || '',
        website: website,
        address: item.address || item.street || '',
        googleMapsUrl: item.url || '',
        rating: item.totalScore || 0,
        reviewCount: item.reviewsCount || 0,
        category: item.categoryName || businessType
      };
    });
  } catch (error) {
    if (error.code === 'MISSING_API_CREDENTIALS') {
      throw error;
    }
    console.error('[Apify Service] Actor search run failed:', error.message);
    throw new Error(`Apify Crawler Error: ${error.message}`);
  }
}

module.exports = { searchGoogleMaps };
