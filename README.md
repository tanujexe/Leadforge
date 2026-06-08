# 🚀 ClientScout

> **A smart assistant that finds local business clients, checks their websites, and writes personalized pitches—all automatically.**

ClientScout is a specialized tool built for freelancers, web designers, and developers. It helps them find local businesses (like restaurants, plumbers, or dental clinics) that need help with their websites, analyzes their current sites for issues, and uses AI to write personalized outreach emails to win them as clients.

---

## 🎯 What is ClientScout? (In Simple Terms)

Imagine you want to offer web design services to local businesses in your city. Doing this manually is exhausting:
1. You search Google Maps for businesses.
2. You click on their websites.
3. You check if the websites look good on phones, load fast, and are easy to find.
4. You write a personalized email to each business explaining how you can help.

**ClientScout automates this entire process in seconds:**
- **🔍 Smart Search:** It automatically finds businesses in any category and location (e.g., "Dentists in Boston") via Google Maps.
- **⚡ Technical Audit:** It visits their website and tests:
  - Is it fast or slow?
  - Does it work well on mobile phones?
  - Does it have good search engine settings (SEO)?
- **🤖 AI Pitches:** It reads the audit results and writes a custom email highlighting their website's issues and how you can fix them.
- **📊 Lead Dashboard:** It organizes everything in a clean database where you can update statuses (e.g., "Contacted", "Replied", "Not Interested"), take notes, and export reports to Excel.

---

## 🛠️ The Tech Stack (What Powers ClientScout)

Here is a breakdown of the technologies used, explained for both non-tech and tech readers:

### 1. The Visual Interface (Frontend)
*This is the dashboard you see and interact with in your browser.*
* **React & Vite**: Modern technologies used to build super fast, responsive user interfaces.
* **Tailwind CSS**: A styling tool that ensures the dashboard looks modern, clean, and runs smoothly on both desktop and mobile devices.
* **React Query & TanStack Table**: Tools that keep the data in the tables updated in real-time without annoying page reloads.

### 2. The Engine (Backend)
*This works behind the scenes to handle data, runs calculations, and talks to external services.*
* **Node.js & Express.js**: A reliable and fast technology stack used to build the server that runs the application logic.

### 3. The Memory (Database)
*Where all your leads, search histories, and notes are saved.*
* **MongoDB**: A modern database that stores information in a flexible, fast format. We use **Mongoose** to help the backend engine talk to the database easily.

### 4. Smart Integrations (Third-Party Services)
*The specialized tools that perform the heavy lifting like scraping, auditing, and AI writing.*
* **Apify (Google Maps Scraper)**: Automatically searches Google Maps to find business details, ratings, reviews, and website URLs.
* **Lightweight HTML Fetch & Parser**: A high-speed native network fetcher that crawls a business's homepage in milliseconds and inspects its HTML structure (viewport tags, h1 structure, meta descriptions, image alternative tags) using regular expressions, eliminating the need for slow, heavy browser packages.
* **Groq AI (Outreach Pitch Writer)**: An artificial intelligence service (similar to ChatGPT) that instantly drafts highly personalized, professional emails tailored to the specific business and its website problems.
* **ExcelJS**: Generates clean, formatted spreadsheets so you can download and open your lead lists in Microsoft Excel or Google Sheets.

---

## 📊 How Leads are Scored

ClientScout automatically grades each business with a **Lead Score (from 0 to 100)** to help you target the best opportunities first. The score is calculated using these rules:

| Condition | Points Added | Why it matters |
| :--- | :--- | :--- |
| **No Website** | **+50** | They desperately need a website built from scratch! |
| **Outdated Website** | **+15** | Their site looks old and needs a modern redesign. |
| **Slow Website** | **+10** | Slow loading times frustrate customers and hurt sales. |
| **Reviews Count > 100** | **+20** | They are a busy business with a budget, making them a great client. |
| **Google Rating > 4.0** | **+15** | They care about their reputation and will value a good online presence. |

### Opportunity Levels:
* 🟢 **High Opportunity (71 - 100)**: Excellent candidates. They either have no website, or have a highly active business with a slow/outdated website. **Target these first!**
* 🟡 **Medium Opportunity (41 - 70)**: Good candidates. They have a website, but there are clear areas of improvement.
* 🔴 **Low Opportunity (0 - 40)**: They already have a fast, modern website and might not need web design services right now.

---

## 📂 Project Folder Structure

If you open the project files, this is how they are organized:
```
client_finder/
├── backend/                  # The server, database models, and smart services
│   ├── config/              # Database connection settings
│   ├── controllers/         # Handles logic (saving leads, exporting Excel, etc.)
│   ├── middleware/          # Security and error checks
│   ├── models/              # Structures for saving Leads and Searches in MongoDB
│   ├── routes/              # Map entries connecting the frontend to the backend
│   ├── services/
│   │   ├── apify/           # Google Maps search script (with a demo mode)
│   │   ├── audit/           # Website health checker (Playwright)
│   │   └── groq/            # AI email writer (Groq AI)
│   ├── utils/               # Scoring calculators
│   └── server.js            # The main entrypoint that starts the backend
├── frontend/                 # The visual dashboard you see in the browser
│   ├── src/
│   │   ├── components/      # UI parts like sidebar, menus, cards, and tables
│   │   ├── hooks/           # Data loading helpers
│   │   ├── pages/           # Pages (Dashboard, Scanner, Lead List)
│   │   ├── services/        # Connects the frontend to the backend server
│   │   ├── App.jsx          # Root setup of the visual app
│   │   ├── index.css        # Visual styles and designs
│   │   └── main.jsx         # Mounts the app to your browser window
│   ├── index.html           # Main HTML page
│   ├── tailwind.config.js   # Custom design colors and layouts
│   └── vite.config.js       # Configuration for running the frontend
└── README.md                # This manual
```

---

## 📋 Prerequisites

To run ClientScout on your computer, you need:
1. **Node.js**: Version 18.0.0 or higher.
2. **MongoDB**: Installed and running on your local machine.
   - *On Windows*, you can start MongoDB by opening PowerShell as Administrator and running:
     ```powershell
     net start MongoDB
     ```

---

## 🚀 Getting Started (Step-by-Step Setup)

Follow these steps to run ClientScout on your machine:

### Step 1: Environment Settings
Create a `.env` configuration file inside the `backend/` folder by copying the example file:
```bash
cd backend
copy .env.example .env
```
Open the new `.env` file in a text editor and fill in your details:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/clientscout
APIFY_TOKEN=your_apify_api_token
GROQ_API_KEY=your_groq_api_key
```

> [!TIP]
> **No API Keys? No Problem (Mock Mode)**
> If you leave `APIFY_TOKEN` and `GROQ_API_KEY` empty, the app automatically runs in **Mock Mode**. 
> - Searches will generate realistic mock businesses.
> - Audits and AI pitches will be generated instantly using smart pre-made templates.
> - You can fully test the database, Excel export, status changes, and notes without registering for any accounts!

### Step 2: Start the Backend Server
Open your terminal at the project root folder:
```bash
cd backend
npm install
npm run dev
```
The backend server will start running at `http://localhost:5000`.

### Step 3: Start the Frontend Interface
Open a **second terminal window** at the project root folder:
```bash
cd frontend
npm install
npm run dev
```
The dashboard interface will start. Open `http://localhost:5173` in your web browser to start finding leads!

---

## 🌐 Hosting & Troubleshooting (How to Deploy)

### 1. Hosting the Backend (Render)
When you deploy the backend server to **Render.com**, make sure to set your build and start commands correctly:

* **⚠️ Do NOT use `npm run dev` or `nodemon` on Render**: These are only meant for running the app on your local computer. Using them on Render will cause the server to crash and fail to start.
* **🔧 Set the Start Command**: 
  * If your Render Root Directory is set to `backend`, use:
    ```bash
    npm start
    ```
  * If your Render Root Directory is set to the main project folder, use:
    ```bash
    node backend/server.js
    ```
* **🔧 Set the Build Command**:
  * If your Render Root Directory is set to `backend`, use:
    ```bash
    npm install
    ```
  * If your Render Root Directory is set to the main project folder, use:
    ```bash
    cd backend && npm install
    ```

---

### 2. Google Login Error: `auth/unauthorized-domain`
If you click **Sign in with Google** and see a red box saying `Firebase: Error (auth/unauthorized-domain)`:

* **💡 Why this happens**: Google Sign-In is blocking your website because Google doesn't recognize your website's URL (like your Vercel address: `https://clientscout-snowy.vercel.app`) yet.
* **🛠️ How to fix it**:
  1. Open your [Firebase Console](https://console.firebase.google.com/).
  2. Select your project.
  3. Click on **Authentication** on the left-hand menu, then click the **Settings** tab.
  4. Find **Authorized domains** and click **Add domain**.
  5. Enter your website's address (for example: `clientscout-snowy.vercel.app`).
  6. Click **Add** to save. Google Sign-In will start working immediately!

---

### 3. Environment Variables Reference (Config Checklist)

To make everything work in production, you must set these configuration variables in your hosting provider's settings panel:

#### Backend settings (on Render)
* `PORT`: Set to `10000` (Render handles this automatically).
* `MONGODB_URI`: Your MongoDB database connection link. **(Required)**
* `CLIENT_ORIGIN`: Your frontend website URL (e.g., `https://clientscout-snowy.vercel.app`).
* `APIFY_TOKEN`: Required for real Google Maps lead scanning.
* `GROQ_API_KEY`: Required for real AI pitch generation.
* `JWT_SECRET`: A secret word of your choice to secure user logins.
* `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`: Your Firebase Admin credentials (needed to verify Google login).

#### Frontend settings (on Vercel/Netlify)
* `VITE_API_URL`: The link to your hosted backend API (e.g., `https://client-finder-api.onrender.com/api`).
* `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`: Your Firebase web app configuration settings (found in Firebase Project Settings).


