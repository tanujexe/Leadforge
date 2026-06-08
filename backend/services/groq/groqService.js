const Groq = require('groq-sdk');

/**
 * Fallback static templates if Groq API key is missing
 */
function getTemplateFallback(lead) {
  const name = lead.businessName;
  const city = lead.address ? lead.address.split(',')[0] : 'your local area';
  const rating = lead.rating || 0;
  const reviews = lead.reviewCount || 0;
  const service = lead.recommendedService || 'Website Development';
  const score = lead.leadScore || 0;

  let summary = '';
  let reason = '';
  let callPitch = '';
  let whatsappPitch = '';
  let emailPitch = '';
  let meetingPitch = '';

  if (lead.websiteStatus === 'No Website') {
    summary = `${name} is a local ${lead.category || 'business'} with an active Google presence but lacks an official website.`;
    reason = `With an impressive rating of ${rating} stars from ${reviews} reviews, customers are looking for ${name} online. However, they have no website, resulting in lost organic web leads and zero landing page conversions. This is a prime candidate for professional Web Development.`;
    
    callPitch = `Hi there! Am I speaking with the owner of ${name}? 
    
My name is [Your Name], and I'm a web developer local to the ${city} area. I was looking for services like yours and saw your business has a fantastic Google profile with ${reviews} reviews and a ${rating}-star rating! 

I noticed you don't have a website listed on Google yet. I help local businesses build high-converting websites to turn those searchers into paying customers. Would you be open to a quick 5-minute chat next Tuesday about how we can build a simple website to bring in more bookings?`;

    whatsappPitch = `Hi! I'm [Your Name], a local web developer. I saw ${name} has a great ${rating}★ rating on Google with ${reviews} reviews! 🚀

I noticed you don't have a website listed. A simple, professional website can help you capture more clients looking for you online. 

I've put together a quick mockup for ${name}. Let me know if you'd like me to send it over!`;

    emailPitch = `Subject: Website Proposal for ${name} - Turn Google Searchers into Bookings

Dear Owner,

I hope this email finds you well.

My name is [Your Name], and I run a local web development agency. I recently came across ${name} on Google Maps while looking for businesses in ${city}. 

First, congratulations on your outstanding reputation! Having ${reviews} reviews and a ${rating}-star rating shows that your customers truly value your service.

However, I noticed that you don't currently have a website linked to your business profile. In today's market, over 70% of customers search a business's website before making a booking. By not having one, you are likely losing valuable clients to competitors who have websites.

I specialize in building fast, mobile-friendly websites specifically for ${lead.category || 'local businesses'}. I would love to build a modern website for ${name} that includes:
- An easy booking/contact structure
- Customer reviews integration
- A clean mobile layout

Are you available for a brief, 10-minute phone call this week to discuss how we can get this set up for you?

Best regards,
[Your Name]
[Your Phone Number]`;

    meetingPitch = `### Website Development Pitch for ${name}

* **Target Need**: Establish a professional web presence to capture high-intent Google Search traffic.
* **Key Observations**: Excellent social proof (${rating}★, ${reviews} reviews) but missing a website.
* **Proposed Solution**: 
  - Build a responsive 3-page website (Home, Services, Contact/Booking).
  - Sync Google Reviews directly onto the homepage to build trust.
  - Optimize the local SEO structure so they rank high on Google Search.
* **Expected Outcome**: Increased online bookings, professional brand image, and higher ROI from local searches.`;

  } else {
    // Website exists but has issues (outdated, slow, etc.)
    const status = lead.websiteStatus.toLowerCase();
    const issuesList = lead.audit && lead.audit.issues ? lead.audit.issues.join(', ') : 'minor layout issues';
    
    summary = `${name} is a ${lead.category || 'business'} in ${city} with a website, but their online experience suffers from being ${status}.`;
    reason = `Although ${name} has an online web presence, their website is currently classified as ${status}. Key issues identified include: ${issuesList}. This creates a poor user experience, leading to high bounce rates and lost client conversions.`;

    callPitch = `Hi! Is this the owner of ${name}?

My name is [Your Name], and I'm a local website consultant in ${city}. I came across your website (${lead.website}) and noticed you have a great reputation with ${reviews} reviews on Google.

I did a quick audit of your website and noticed some performance challenges, specifically that it is ${status} and has issues like: ${issuesList}. This makes it hard for mobile users to navigate and book.

I specialize in redesigning websites for local businesses to make them fast and mobile-friendly. I'd love to send you a free mockup of a redesigned site. Would it be okay if I send a WhatsApp or email with the details?`;

    whatsappPitch = `Hi! I'm [Your Name], a website redesign specialist. I was browsing your site (${lead.website}) and noticed you have a strong ${rating}★ rating on Google! 🌟

However, your site runs a bit ${status} on mobile devices, which could be causing visitors to leave without booking. 

I've sketched out a fast, responsive redesigned mockup for ${name}. Let me know if you'd like to check it out!`;

    emailPitch = `Subject: Website Redesign for ${name} - Fix Mobile and Performance Issues

Dear Owner,

I hope you're having a great week.

My name is [Your Name], and I'm a web developer based in ${city}. I came across ${name} on Google Maps and looked through your website at ${lead.website}.

You have a wonderful business with a solid ${rating}★ Google rating and ${reviews} reviews. However, when auditing your website, I noticed a few technical issues that could be hurting your business:
- **Mobile Usability**: The website is currently ${status === 'non responsive' ? 'not mobile responsive' : 'difficult to read on mobile screens'}.
- **Performance**: The page load speed is currently flagged as ${status}.
- **SEO/Issues**: Found issues such as: ${issuesList}.

Today, over 60% of local searches happen on mobile phones. If a website is slow or hard to navigate on mobile, visitors will leave within 3 seconds and go to a competitor.

I specialize in redesigning websites into high-speed, modern sales tools. I would love to help you refresh ${name}'s website to make it load instantly and convert more visitors.

Would you be open to a quick call or meeting next week to review these areas?

Best regards,
[Your Name]
[Your Website/Phone]`;

    meetingPitch = `### Website Redesign Pitch for ${name}

* **Target Need**: Modernize the website to resolve ${status} performance and convert mobile users.
* **Key Observations**: Outdated layout and slow loading speed (${lead.audit ? (lead.audit.responseTimeMs / 1000).toFixed(1) : '3+'}s response time) are driving prospects away.
* **Proposed Solution**:
  - Rebuild the website on a clean, modern framework with 100% mobile responsiveness.
  - Implement caching and clean asset loading to bring load times under 1 second.
  - Fix SEO structured headers and alt attributes to raise search placement.
* **Expected Outcome**: Lower bounce rates, significantly higher mobile conversions, and improved user experience.`;
  }

  return {
    aiSummary: summary,
    aiReason: reason,
    callPitch,
    whatsappPitch,
    emailPitch,
    meetingPitch
  };
}

/**
 * Formats AI field values (which might be returned as JSON objects/arrays by LLM) to strings.
 */
function formatAiFieldToString(value) {
  if (value === undefined || value === null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === 'object') {
        return `- ${JSON.stringify(item)}`;
      }
      return `- ${item}`;
    }).join('\n');
  }
  if (typeof value === 'object') {
    if (value.Subject || value.subject || value.Body || value.body) {
      const subject = value.Subject || value.subject || '';
      const body = value.Body || value.body || '';
      return `Subject: ${subject}\n\n${body}`;
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
}

/**
 * Analyzes lead metrics and website audit to generate custom pitches using Groq API
 */
async function analyzeLeadAndGeneratePitches(lead) {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey || apiKey === 'your_groq_api_key' || apiKey === '') {
    // Return static template if key is missing
    return getTemplateFallback(lead);
  }

  try {
    const groq = new Groq({ apiKey });
    
    const hasWebsite = !!lead.website && lead.website !== 'null' && lead.website !== '';
    const websiteAuditText = hasWebsite && lead.audit
      ? `Website: ${lead.website}
         Website Score: ${lead.websiteScore}/100
         Website Status: ${lead.websiteStatus}
         Audit Issues: ${lead.audit.issues.join(', ')}
         Response Time: ${lead.audit.responseTimeMs}ms
         SEO Title: ${lead.audit.htmlMetadata?.title || 'None'}
         SEO Description: ${lead.audit.htmlMetadata?.description || 'None'}`
      : `No website.`;

    const prompt = `You are an expert sales strategist and local business intelligence assistant.
Analyze this local business lead and generate outreach materials.

BUSINESS DETAILS:
Name: ${lead.businessName}
Category: ${lead.category || 'Local Business'}
Address/City: ${lead.address}
Google Rating: ${lead.rating}/5
Review Count: ${lead.reviewCount} reviews
Calculated Lead Score: ${lead.leadScore}/100
Opportunity Level: ${lead.opportunityLevel}
Recommended Service: ${lead.recommendedService}

WEBSITE AUDIT DETAILS:
${websiteAuditText}

Generate the following six fields in clean JSON format:
1. "aiSummary": A 1-2 sentence overview of the business's current state and online footprint.
2. "aiReason": An explanation of why this business has a lead score of ${lead.leadScore}/100, focusing on the gap between their customer reputation (rating/reviews) and their website presence (or lack thereof).
3. "callPitch": A short, friendly, and persuasive phone script (under 100 words) to get a meeting with the owner, referencing their Google rating and the specific website issue (or lack of website).
4. "whatsappPitch": A concise, modern WhatsApp outreach message (under 80 words) introducing yourself, praising their reviews, and politely proposing a website upgrade/creation.
5. "emailPitch": A professional email template including a compelling Subject line and email Body. Keep it highly personalized, referencing their reviews and audit issues.
6. "meetingPitch": A bulleted, professional service recommendation detail of what you will fix, build, and optimize for their business.

CRITICAL: Return ONLY valid, clean, parseable JSON. No conversational wrapper, no markdown ticks like \`\`\`json, just raw JSON. Ensure all quotes inside values are properly escaped.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a professional business analyst. Output valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const responseContent = chatCompletion.choices[0].message.content.trim();
    const parsedData = JSON.parse(responseContent);

    // Validate structure
    return {
      aiSummary: formatAiFieldToString(parsedData.aiSummary),
      aiReason: formatAiFieldToString(parsedData.aiReason),
      callPitch: formatAiFieldToString(parsedData.callPitch),
      whatsappPitch: formatAiFieldToString(parsedData.whatsappPitch),
      emailPitch: formatAiFieldToString(parsedData.emailPitch),
      meetingPitch: formatAiFieldToString(parsedData.meetingPitch)
    };
  } catch (error) {
    console.error('Groq API Error, falling back to templates:', error.message);
    return getTemplateFallback(lead);
  }
}

module.exports = { analyzeLeadAndGeneratePitches };
