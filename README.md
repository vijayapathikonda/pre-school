# Preschool Daily Child Observation System (V1)
### Professional Mobile Application for Early Childhood Education

A high-performance, mobile-first observation and attendance application designed specifically for preschool teachers to capture student engagement, social interactions, and emotional disposition on a daily basis.

Built with **React, TypeScript, Tailwind CSS, Dexie (IndexedDB), and Supabase Free Tier** to ensure **$0.00 / month hosting costs** while supporting **250+ students** across multiple classrooms.

---

## 🌟 Key Features

1. **Exact V1 Questionnaire Capture**:
   - Attendance Toggle (Present / Absent)
   - 1. **Engagement / Attention**: Single-select touch chips
   - 2. **Participation**: Single-select touch chips
   - 3. **Following / Response**: Single-select touch chips
   - 4. **Thinking / Exploring**: Multi-select tags
   - 5. **Social / Communication**: Multi-select tags
   - 6. **State / Disposition Today**: Emotion & disposition tags
   - 7. **Interest Today**: Dynamic conditional detail input (*"If greater / less – in what?"*)
   - **Additional Observation**: Voice-dictation friendly notes with quick-insert tags.

2. **Classroom-First Workflow for 250 Students**:
   - Classroom section switcher (e.g. *Sunflowers Pre-K*, *Bluebells Pre-K*, *Toddlers*, *Kindergarten*).
   - Teachers only see their assigned group of 20–25 students, never having to scroll through 250 children.
   - Built-in **"⚡ Test 250 Students"** generator to simulate full school capacity with one click.

3. **Hybrid $0 Storage Architecture**:
   - **Offline-First**: Uses high-speed IndexedDB on the device. Works 100% offline in classrooms without Wi-Fi.
   - **Cloud Sync**: 1-click integration with Supabase Free Tier (500 MB database accommodates 20 years of history for 250 students at zero cost).
   - **Multi-Teacher Collaboration**: Teachers enter observations simultaneously on their own phones.

4. **1-Tap Parent Sharing & Reporting**:
   - **WhatsApp Sharing**: Generates a clean, formatted daily progress card with emojis ready to send to parents via WhatsApp.
   - **Printable PDF Slips**: Professional 1-page observation certificate ready to download or print.
   - **Excel / CSV Export**: Instant export of daily or full-history observation logs for school administration.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Navigate to the project directory
cd d:\personal\school\repo\pre-school

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open your browser at `http://localhost:3000` (or the network IP shown in your terminal to test on your phone).

---

## 📱 Mobile Installation (Android & iOS)

This app is built as a Progressive Web App (PWA):
- **On iPhone (Safari)**: Open the web link, tap the **Share** button, and tap **"Add to Home Screen"**. It opens in full-screen mode like a native app.
- **On Android (Chrome)**: Open the web link, tap the **⋮ (Menu)** button, and tap **"Install App"** or **"Add to Home screen"**.

*(Optional)* To compile into a standalone `.apk` using Capacitor:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "ChildObs" "com.preschool.childobs"
npx cap add android
npx cap open android
```

---

## ☁️ Zero-Cost Cloud Sync Setup (Supabase)

1. Create a free account at [supabase.com](https://supabase.com) ($0 / month).
2. Create a new project (e.g., `preschool-observations`).
3. In Supabase, open the **SQL Editor** and paste the SQL script found in **Settings -> Show 1-Click Supabase SQL Script** (or from `src/db/supabaseClient.ts`).
4. Click **Run**.
5. Copy your **Project URL** and **Anon Public Key** from Supabase Settings -> API, and paste them into the app's **Settings Modal**.
6. All teacher entries will now automatically synchronize to your cloud database!

---

## 🛡️ License
Private and Confidential — Designed for Preschool Child Observation.
