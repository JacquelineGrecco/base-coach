<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ⚽ FutsalPro Coach

A modern, AI-powered futsal coaching evaluation app designed to help coaches quickly assess players during training sessions and generate professional reports.

## 🎯 What It Does

- **Fast Evaluations:** Select up to 3 criteria per session and evaluate 23+ players in under 30 minutes
- **Smart Navigation:** Keyboard shortcuts and swipe gestures for rapid player switching
- **Auto-Generated Reports:** Professional 200-300 character reports in Portuguese highlighting strengths and weaknesses
- **Export & Share:** Download or share reports directly with parents
- **Premium Model:** Unlock professional reports to sell to parents
- **AI-Powered:** Gemini AI provides coaching insights and analysis

## 🚀 Quick Start

**Prerequisites:** Node.js 18+

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:3000`

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Fast overview of features and changes
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Complete testing instructions
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details and architecture
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes
- **[ROADMAP.md](./ROADMAP.md)** - 🗺️ **Future features and product roadmap**

## 🎯 Key Features (v1.0)

### Session Setup
- Select 1-3 evaluation criteria before starting
- Focus on what matters for each training session
- Beautiful categorized interface (Technical, Tactical, Physical, Mental)

### Optimized Evaluation
- ⌨️ Keyboard shortcuts (← → arrows)
- 📱 Swipe gestures for mobile
- 🎯 Large touch-friendly buttons
- ⚡ Only shows selected criteria

### Individual Reports
- Auto-generated 200-300 character descriptions
- Identifies strengths (scores ≥ 4.0)
- Identifies weaknesses (scores ≤ 2.5)
- Professional Portuguese formatting
- Ready to sell to parents

### Export Options
- 📥 Download as formatted .txt
- 📤 Share via mobile (Web Share API)
- 📋 Clipboard fallback

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **AI:** Google Gemini 2.5 Flash
- **Icons:** Lucide React
- **Charts:** Recharts
- **Styling:** Tailwind CSS (utility classes)

## 📱 Platform Support

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (iOS Safari, Android Chrome)
- ✅ Tablet-optimized
- ✅ Offline-capable (with service worker)

## 🗺️ Roadmap

See **[ROADMAP.md](./ROADMAP.md)** for detailed future plans including:

### Phase 1 (v1.5) - Q1 2026
- Session history & progress tracking
- Attendance management
- Multi-team support
- Enhanced player profiles

### Phase 2 (v2.0) - Q2 2026
- Custom valences
- Session templates
- Advanced exports (PDF)
- Team analytics dashboard

### Phase 3 (v2.5) - Q3 2026
- **Parent Portal** 🌟
- Payment processing
- Tiered subscriptions
- Automated monetization

### Phase 4 (v3.0) - Q4 2026
- Match analysis mode
- Advanced AI features
- Federation integration
- Gamification

## 💼 Business Model

### For Coaches:
- Monthly subscription for evaluation tools
- Premium tier unlocks professional reports
- Sell reports to parents (coach keeps 70%)

### For Parents:
- Purchase individual premium reports
- Optional subscription for continuous access
- Direct app payments (automated)

## 🤝 Contributing

This is a private project developed for Fernanda's futsal coaching business. For feature requests or feedback, please reach out directly.

## 📄 License

Proprietary - All rights reserved

## 📞 Support

For questions or support, contact Jacqueline Grecco.

---

**Version:** 1.0 MVP  
**Status:** ✅ Production Ready  
**Last Updated:** November 30, 2025
