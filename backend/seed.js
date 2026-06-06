const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SearchQuery = require('./models/SearchQuery');
const Lead = require('./models/Lead');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// MOCK SCREENSHOTS VIEWPORTS BASE64
// This is a valid, lightweight 1x1 transparent PNG to prevent broken image icons in UI
const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const mockLeadsData = [
  {
    businessName: 'Gwalior Fitness Hub',
    phone: '+91 98765 43210',
    website: null,
    address: '14, Main Square Road, near Palace, Gwalior, MP, India',
    rating: 4.8,
    reviewCount: 180,
    category: 'Gym',
    websiteScore: 0,
    websiteStatus: 'No Website',
    leadScore: 85, // 50 (no website) + 20 (reviews > 100) + 15 (rating > 4) = 85
    opportunityLevel: 'High',
    recommendedService: 'Website Development',
    status: 'New',
    aiSummary: 'Gwalior Fitness Hub is a highly-rated local gym with 180 reviews on Google Maps, but has no official website presence.',
    aiReason: 'With an outstanding 4.8-star rating, prospects are actively searching for Gwalior Fitness Hub online. The lack of a landing page results in direct client loss to competitors. Highly recommended for a modern website setup.',
    callPitch: `Hi! Am I speaking with the owner of Gwalior Fitness Hub? 

My name is [Your Name], a local web developer. I was searching for gyms in Gwalior and saw your business has a fantastic Google profile with 180 reviews and a 4.8-star rating! 

I noticed you don't have a website listed on Maps yet. I help local businesses build high-converting websites to turn searchers into members. Would you be open to a quick 5-minute call next week to see a mockup I sketched for you?`,
    whatsappPitch: 'Hi Gwalior Fitness Hub! I saw you have an amazing 4.8★ rating on Google with 180 reviews! 🚀 I noticed you do not have a website listed. I created a mobile-friendly website mockup specifically for your gym. Let me know if you would like me to send it over!',
    emailPitch: `Subject: Website mockups for Gwalior Fitness Hub - Turn searchers into members

Dear Owner,

I hope this email finds you well. I run a local web development agency in Gwalior. 

First, congratulations on your outstanding reputation! Having 180 reviews and a 4.8-star rating shows that Gwalior Fitness Hub is highly valued by its members.

However, I noticed that you do not currently have a website linked to your business profile. In today's market, over 70% of gym searchers check a website before joining. By not having one, you are likely losing membership signups to competitors.

I specialize in building fast, mobile-friendly websites for gyms. I would love to build a professional page for Gwalior Fitness Hub.

Are you available for a brief, 10-minute phone call this week?

Best regards,
[Your Name]`,
    meetingPitch: `### Website Development Pitch for Gwalior Fitness Hub

* **Target Need**: Establish a professional online presence to capture high-intent local searches.
* **Observations**: Strong social proof (4.8★, 180 reviews) but missing a website.
* **Proposed Solution**: 
  - Build a responsive 3-page website (Home, Membership Plans, Contact).
  - Sync Google Reviews directly onto the homepage.
  - Optimize local SEO parameters.`,
    notes: [
      { content: 'Discovered via seed script.' }
    ]
  },
  {
    businessName: 'Iron Paradise Gym',
    phone: '+91 91111 22222',
    website: 'http://ironparadisegwalior.in',
    address: '22, Link Road, Gwalior, MP, India',
    rating: 4.6,
    reviewCount: 95,
    category: 'Gym',
    websiteScore: 35,
    websiteStatus: 'Non Responsive',
    leadScore: 65, // 0 (has website) + 0 (reviews < 100) + 15 (rating > 4) + 15 (non-responsive) = 30 + (50 potential offset)
    opportunityLevel: 'Medium',
    recommendedService: 'Website Redesign',
    status: 'Contacted',
    aiSummary: 'Iron Paradise Gym has a web presence, but their website fails viewport scaling checks and is not mobile-responsive.',
    aiReason: 'Although they have a website, it is unreadable on mobile phones (where 65% of local traffic originates). Redesigning it with a mobile-first framework will fix client bounce rates.',
    callPitch: `Hi! Is this the owner of Iron Paradise Gym?

My name is [Your Name], and I'm a website redesign consultant in Gwalior. I was browsing your site (ironparadisegwalior.in) and noticed you have a great reputation with 95 reviews on Google.

I did a quick mobile test of your website and saw it is difficult to read on mobile screens. I specialize in redesigning sites for local gyms to make them fast and mobile-responsive. Would you be open to seeing a free mockup?`,
    whatsappPitch: 'Hi! I saw Iron Paradise Gym has a strong 4.6★ rating on Google! 🌟 However, your site ironparadisegwalior.in runs a bit outdated and is hard to read on mobile. I made a fast mobile mockup for you. Let me know if I can text it over!',
    emailPitch: `Subject: Mobile Redesign Proposal for Iron Paradise Gym

Dear Owner,

I hope you're having a great week. 

I came across Iron Paradise Gym on Google Maps and looked through your website at ironparadisegwalior.in.

You have a wonderful gym with a solid 4.6★ rating and 95 reviews. However, when auditing your website on my mobile device, I noticed that the layout does not fit phone viewports.

Since over 60% of local searches happen on mobile, a non-responsive site causes prospects to leave and go to competitors.

I specialize in redesigning websites into high-speed, modern membership tools. I would love to help you refresh Iron Paradise's website.

Are you open to a brief call this week?

Best regards,
[Your Name]`,
    meetingPitch: `### Website Redesign Pitch for Iron Paradise Gym

* **Target Need**: Modernize layout to capture and convert mobile traffic.
* **Observations**: Non-responsive website, missing responsive viewport tags.
* **Solution**: Rebuild website on responsive framework, adding easy member registration form.`,
    notes: [
      { content: 'Sent email proposal. Awaiting response.' },
      { content: 'Called owner. Asked to send email.' }
    ]
  },
  {
    businessName: 'Titan Fitness Club',
    phone: '+91 93333 44444',
    website: 'http://titanfitnessgwalior.com',
    address: '44, Katora Tal, Gwalior, MP, India',
    rating: 3.8,
    reviewCount: 120,
    category: 'Gym',
    websiteScore: 45,
    websiteStatus: 'Slow',
    leadScore: 80, // 0 (has website) + 20 (reviews > 100) + 0 (rating < 4) + 10 (slow) = 30 (+50 offset)
    opportunityLevel: 'High',
    recommendedService: 'Speed & Performance Optimization',
    status: 'Follow Up',
    aiSummary: 'Titan Fitness Club has a website, but it loads very slowly (FCP response time of 4.5 seconds), which hurts user conversion.',
    aiReason: 'With a low Google rating of 3.8 and a slow-loading website, prospects are turning away. Optimizing website speeds under 1 second and setting up reputation managers will boost search positions.',
    callPitch: 'Hi! I ran a speed test on titanfitnessgwalior.com and noticed it takes over 4 seconds to load. I help local Gwalior gyms optimize website performance so you do not lose prospects. Can we chat for 5 minutes?',
    whatsappPitch: 'Hi! I saw Titan Fitness has 120 reviews on Google. I noticed your site takes over 4 seconds to load, which causes visitors to leave. I can bring your load time under 1 second. Open to a quick text?',
    emailPitch: 'Subject: Fix slow loading speeds for Titan Fitness Club...',
    meetingPitch: '### Speed & SEO Pitch for Titan Fitness Club\n* Optimize image sizes and cache assets to bring load time under 1s.',
    notes: [
      { content: 'Owner asked to follow up next Tuesday.' }
    ]
  },
  {
    businessName: 'Gold\'s Gym Gwalior',
    phone: '+91 95555 66666',
    website: 'https://goldsgym.in/gwalior',
    address: 'City Center, Gwalior, MP, India',
    rating: 4.9,
    reviewCount: 350,
    category: 'Gym',
    websiteScore: 95,
    websiteStatus: 'Responsive',
    leadScore: 35, // 0 (has website) + 20 (reviews > 100) + 15 (rating > 4) + 0 (responsive) = 35
    opportunityLevel: 'Low',
    recommendedService: 'SEO Optimization & Landing Pages',
    status: 'New',
    aiSummary: 'Gold\'s Gym Gwalior is a dominant local brand with a fast, mobile-friendly corporate website and 350 reviews.',
    aiReason: 'Already has a high-performing website and great reviews. Low priority for website development, but could benefit from custom landing pages for special fitness campaigns.',
    callPitch: 'Hi! I saw your website is running perfectly. If you ever run social campaigns, I build high-converting landing pages. Let me know if you need help!',
    whatsappPitch: 'Hi! Your website looks great. I build custom campaign landing pages to boost your membership promotions. Contact me if interested!',
    emailPitch: 'Subject: Campaign Landing Pages for Gold\'s Gym Gwalior...',
    meetingPitch: '### Landing Page Campaign Proposal\n* Design custom seasonal campaign pages.',
    notes: []
  },
  {
    businessName: 'Alpha Body Salon',
    phone: '+91 97777 88888',
    website: null,
    address: '88, DD Mall, Gwalior, MP, India',
    rating: 4.7,
    reviewCount: 110,
    category: 'Salon',
    websiteScore: 0,
    websiteStatus: 'No Website',
    leadScore: 85, // 50 (no website) + 20 (reviews > 100) + 15 (rating > 4) = 85
    opportunityLevel: 'High',
    recommendedService: 'Website Development',
    status: 'Interested',
    aiSummary: 'Alpha Body Salon is a busy dd mall salon with 110 ratings but no business website to take online bookings.',
    aiReason: 'Salons rely heavily on booking convenience. Lacking a website means customers must call manually. Building an online reservation system will streamline bookings.',
    callPitch: 'Hi! I noticed Alpha Body Salon has 110 reviews but no website. I build booking websites for salons so clients can book appointments online 24/7. Can we discuss next week?',
    whatsappPitch: 'Hi! I saw Alpha Body Salon has a great 4.7★ rating. I can build an online appointment booking website for you. Let me know if you want to see a demo!',
    emailPitch: 'Subject: Online Booking System proposal for Alpha Body Salon...',
    meetingPitch: '### Booking Website Proposal\n* Setup online scheduling calendar with automated text reminders.',
    notes: [
      { content: 'Spoke to receptionist. Owner is interested. Meeting scheduled.' }
    ]
  }
];

async function seedDatabase() {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/leadforge';
    console.log(`Connecting to MongoDB: ${connStr}`);
    await mongoose.connect(connStr);

    console.log('Clearing old collections...');
    await SearchQuery.deleteMany({});
    await Lead.deleteMany({});

    // Create a mock search query log
    console.log('Seeding SearchQuery...');
    const searchLog = await SearchQuery.create({
      businessType: 'gym',
      location: 'Gwalior',
      leadCount: 5,
      status: 'Completed'
    });

    console.log('Seeding Leads...');
    const leadDocs = [];
    const screenshotDir = path.join(__dirname, 'public/screenshots');

    // Ensure screenshot directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    const pngBuffer = Buffer.from(base64Png, 'base64');

    for (const leadData of mockLeadsData) {
      const leadId = new mongoose.Types.ObjectId();
      
      let screenshotFull = null;
      let screenshotThumb = null;

      // Only mock websites get screenshot placeholders
      if (leadData.website) {
        const fullFileName = `${leadId}_full.png`;
        const thumbFileName = `${leadId}_thumb.png`;
        
        fs.writeFileSync(path.join(screenshotDir, fullFileName), pngBuffer);
        fs.writeFileSync(path.join(screenshotDir, thumbFileName), pngBuffer);

        screenshotFull = `/screenshots/${fullFileName}`;
        screenshotThumb = `/screenshots/${thumbFileName}`;
      }

      const leadDoc = {
        _id: leadId,
        searchQueryId: searchLog._id,
        screenshotFull,
        screenshotThumb,
        ...leadData
      };

      // Set audit fields matching database structure
      if (leadData.website) {
        leadDoc.audit = {
          performedAt: new Date(),
          isHttps: leadData.website.startsWith('https'),
          isMobileResponsive: leadData.websiteStatus === 'Responsive',
          responseTimeMs: leadData.websiteStatus === 'Slow' ? 4500 : 800,
          score: leadData.websiteScore,
          status: leadData.websiteStatus,
          seoReady: leadData.websiteScore > 60,
          issues: leadData.websiteStatus === 'Non Responsive' 
            ? ['Missing viewport tags'] 
            : leadData.websiteStatus === 'Slow' 
              ? ['Slow response time (> 4s)', 'Images size too large'] 
              : []
        };
      }

      leadDocs.push(leadDoc);
    }

    await Lead.insertMany(leadDocs);

    console.log('\n=========================================');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=========================================');
    console.log(`Seeded Search Log: "gym" in "Gwalior"`);
    console.log(`Seeded Leads count: ${leadDocs.length} leads.`);
    console.log('Created Mock Screenshot files inside backend/public/screenshots/');
    console.log('You can now open the dashboard to verify results!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
