/**
 * Lead Scorer utility
 * Calculates a lead score (0-100), opportunity level, and recommended service
 * based on business characteristics and website audit.
 */
function calculateLeadScore(leadData) {
  let score = 0;
  
  const hasWebsite = !!leadData.website && leadData.website !== 'null' && leadData.website !== '';
  const rating = Number(leadData.rating) || 0;
  const reviewCount = Number(leadData.reviewCount) || 0;
  
  // 1. No Website = +50
  if (!hasWebsite) {
    score += 50;
  }
  
  // 2. Reviews > 100 = +20
  if (reviewCount > 100) {
    score += 20;
  }
  
  // 3. Rating > 4 = +15
  if (rating > 4.0) {
    score += 15;
  }
  
  // 4. Outdated Website = +15
  // (We check if audit says it is outdated or non-responsive)
  const isOutdated = leadData.websiteStatus === 'Outdated' || leadData.websiteStatus === 'Non Responsive';
  if (hasWebsite && isOutdated) {
    score += 15;
  }
  
  // 5. Slow Website = +10
  const isSlow = leadData.websiteStatus === 'Slow';
  if (hasWebsite && isSlow) {
    score += 10;
  }
  
  // Cap score at 100
  score = Math.min(score, 100);
  
  // Determine Opportunity Level
  let opportunityLevel = 'Low';
  if (score >= 71) {
    opportunityLevel = 'High';
  } else if (score >= 41) {
    opportunityLevel = 'Medium';
  }
  
  // Determine Recommended Service
  let recommendedService = 'Google Business Optimization';
  if (!hasWebsite) {
    recommendedService = 'Website Development';
  } else if (isOutdated) {
    recommendedService = 'Website Redesign';
  } else if (isSlow) {
    recommendedService = 'Speed & Performance Optimization';
  } else if (rating < 4.0 && reviewCount > 0) {
    recommendedService = 'Reputation Management';
  } else if (hasWebsite) {
    recommendedService = 'SEO Optimization & Landing Pages';
  }
  
  return {
    leadScore: score,
    opportunityLevel,
    recommendedService
  };
}

module.exports = { calculateLeadScore };
