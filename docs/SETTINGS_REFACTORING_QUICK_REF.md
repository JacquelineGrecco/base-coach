# Settings Page Refactoring - Quick Reference

**Version:** v2.4.0 (Planned)  
**Priority:** 🟡 MEDIUM  
**Time:** 12-16 hours  
**Status:** Documented, Ready for Implementation

---

## 🎯 Quick Summary

**Problem:** Duplicate plan comparison in both Pricing AND Settings, cluttered Settings page  
**Solution:** Remove duplication, add 4 new high-value tabs, reorganize into 6 focused tabs

---

## 📊 Before → After

### Before (Current)
```
Settings:
├─ Personal Info (name, email, photo, bio, password, delete) ❌ Too much
└─ Plano (FULL comparison table - DUPLICATED) ❌ 100% duplicate
```

### After (Refactored)
```
Settings:
├─ Personal Info (name, email, photo, bio) ✅
├─ Security (password, 2FA, sessions) ✅ NEW
├─ Notifications (push, email, in-app) ✅ NEW
├─ Preferences (language, theme, defaults) ✅ NEW
├─ Billing (summary, payment, invoices) ✅ Simplified
└─ Data & Privacy (export, delete) ✅ NEW
```

---

## 🆕 New Features

### Security Tab 🔒
- Two-Factor Authentication (2FA)
- Active sessions manager
- Sign out specific devices
- Login history

### Notifications Tab 🔔
- Push notifications control
- Email notifications control
- In-app notifications control

### Preferences Tab ⚙️
- Language selection (PT-BR, English, Spanish)
- Theme (Light, Dark, High Contrast)
- Display options
- Session defaults

### Billing Tab 💳 (Simplified)
- **Removed:** Full plan comparison
- **Added:** Payment method, invoices, "Change Plan" button

### Data & Privacy Tab 🗄️
- Custom export (by team, date range)
- Granular deletion options
- LGPD compliance

---

## 📁 Files to Create

### New Components (6 files)
1. `src/components/ui/settings/BillingTab.tsx` (~150 lines)
2. `src/components/ui/settings/SecurityTab.tsx` (~200 lines)
3. `src/components/ui/settings/NotificationsTab.tsx` (~150 lines)
4. `src/components/ui/settings/PreferencesTab.tsx` (~150 lines)
5. `src/components/ui/settings/DataPrivacyTab.tsx` (~150 lines)
6. `src/components/ui/settings/index.ts` (barrel)

### New Services (2 files)
1. `src/services/notificationService.ts`
2. `src/services/preferencesService.ts`

### Modified Files (1 file)
1. `src/components/ui/Profile.tsx` (refactor tab structure)

---

## 📅 Timeline

**Week 1:** Security + Notifications + Billing (8-10h)  
**Week 2:** Preferences + Data & Privacy + Testing (4-6h)  
**Total:** 12-16 hours

---

## ✅ Benefits

- ✅ Eliminates ~500 lines duplicate code
- ✅ Better UX (6 focused tabs)
- ✅ High-value features (2FA, notifications, theme)
- ✅ LGPD compliant
- ✅ Single source of truth (pricing only in Pricing.tsx)

---

## 📚 Full Documentation

See: `docs/SETTINGS_REFACTORING_PLAN.md` (851 lines, complete implementation guide)

---

## 🚀 Status

- ✅ Problem identified
- ✅ Solution designed
- ✅ Documentation complete
- ✅ Added to ROADMAP.md
- ✅ Added to CHANGELOG.md
- ⏳ Implementation pending

**Ready to implement when prioritized!**

---

**Document Version:** 1.0  
**Last Updated:** December 21, 2025  
**Next:** Implement after v2.0.0-beta launch


