/**
 * Environment variable validation on server bootstrap
 */
function validateEnv() {
  const warnings = [];
  const errors = [];

  // Validate Port
  if (process.env.PORT) {
    const port = Number(process.env.PORT);
    if (isNaN(port) || port <= 0) {
      errors.push(`Invalid PORT configuration: "${process.env.PORT}"`);
    }
  }

  // Validate MONGODB_URI
  if (!process.env.MONGODB_URI) {
    warnings.push('MONGODB_URI is not set. Defaulting to local instance: mongodb://127.0.0.1:27017/clientscout');
  }

  // Validate APIFY_TOKEN
  if (!process.env.APIFY_TOKEN || process.env.APIFY_TOKEN.trim() === '') {
    warnings.push(
      'APIFY_TOKEN is missing. Direct lead scanning via Google Maps is disabled. Search queries will require token configuration.'
    );
  }

  // Validate GROQ_API_KEY
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY.trim() === '') {
    warnings.push(
      'GROQ_API_KEY is missing. Groq LLM analysis is disabled. AI summaries and pitch templates will use local fallback structures.'
    );
  }

  if (errors.length > 0) {
    console.error('\n❌ CRITICAL CONFIGURATION ERRORS DETECTED:');
    errors.forEach(err => console.error(` - ${err}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn('\n⚠️  CONFIGURATION WARNINGS DETECTED (Server starting in warning mode):');
    warnings.forEach(warn => console.warn(` - ${warn}`));
    console.log('');
  } else {
    console.log('\n✅ Environment variables validated successfully. Server config is secure.\n');
  }
}

module.exports = { validateEnv };
