# Screenshot Protection Strategies

**Last Updated:** December 13, 2024  
**Status:** 📋 Future Enhancement

---

## 🎯 Overview

This document outlines strategies to protect premium content from unauthorized screenshots and sharing. Since web browsers cannot technically block screenshots, we focus on **deterrence** and **native app solutions**.

---

## 🚫 Technical Reality

### **Web Browser Limitations:**
- ❌ **Cannot block screenshots** - No browser API exists
- ❌ **Cannot detect screenshots** - OS-level feature outside browser control
- ❌ **PWAs have same limits** - Still run in browser sandbox
- ❌ **Users can always:** Use phone camera, external tools, browser extensions

### **Native Mobile Apps:**
- ✅ **Can block screenshots** on iOS and Android
- ✅ **Can block screen recording**
- ✅ **Can detect screenshot attempts** and log them
- ✅ **100% effective** when properly implemented

---

## ✅ Protection Strategies

### **Phase 1: Web App Protection (Immediate)**

#### 1. Dynamic Watermarks ⭐ **RECOMMENDED**
**Implementation Priority:** High  
**Effort:** 4 hours  
**Effectiveness:** High deterrent

**What:**
Overlay user-specific information on sensitive content that appears in screenshots.

**Technical Implementation:**
```typescript
// components/Watermark.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Watermark: React.FC = () => {
  const { user } = useAuth();
  const timestamp = new Date().toISOString().split('T')[0];
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 select-none">
      <div className="grid grid-cols-4 grid-rows-8 h-full opacity-[0.08]">
        {Array.from({ length: 32 }).map((_, i) => (
          <div 
            key={i} 
            className="flex items-center justify-center -rotate-45 text-slate-600 text-[10px] font-mono whitespace-nowrap"
          >
            {user?.email} • {timestamp}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Usage:**
```typescript
// Apply to Reports component
<div className="relative">
  <Watermark /> {/* Overlays entire page */}
  
  {/* Premium content */}
  <RadarChart data={data} />
  <EvolutionChart data={evolution} />
  <AIInsights insights={insights} />
</div>
```

**Benefits:**
- ✅ User email visible in every screenshot
- ✅ Timestamp proves when screenshot was taken
- ✅ Repeating pattern (hard to crop out)
- ✅ Legal evidence if content is leaked
- ✅ Discourages sharing (user is identifiable)
- ✅ Low opacity - doesn't hurt UX for legitimate users

**Apply To:**
- Radar charts (Pro+ feature)
- Evolution charts (Pro+ feature)
- AI insights (Pro+ feature)
- PDF exports (paid content)
- Any premium analytics

---

#### 2. Time-Limited Access Tokens
**Implementation Priority:** Medium  
**Effort:** 6 hours  
**Effectiveness:** Medium

**What:**
Generate time-limited tokens for viewing reports. Screenshots become outdated quickly.

**Technical Implementation:**
```typescript
// services/reportTokenService.ts
import jwt from 'jsonwebtoken';

export const generateReportToken = (reportId: string, userId: string) => {
  return jwt.sign(
    { reportId, userId, type: 'report_access' },
    process.env.JWT_SECRET!,
    { expiresIn: '5m' } // 5 minutes
  );
};

export const validateReportToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return { valid: true, data: decoded };
  } catch {
    return { valid: false, data: null };
  }
};

// In Reports component
const loadReport = async (reportId: string) => {
  const token = await generateReportToken(reportId, user.id);
  const data = await fetchReportWithToken(reportId, token);
  // Token expires in 5 minutes, screenshot becomes stale
};
```

**Benefits:**
- ✅ Old screenshots become outdated
- ✅ Forces re-login for fresh data
- ✅ Real-time data is more valuable

---

#### 3. UI Obfuscation
**Implementation Priority:** Low  
**Effort:** 2 hours  
**Effectiveness:** Low (minor deterrent)

**What:**
Disable right-click, text selection, and add subtle protections.

**Technical Implementation:**
```typescript
// In Reports component
<div 
  className="select-none"
  onContextMenu={(e) => e.preventDefault()}
  onCopy={(e) => e.preventDefault()}
>
  {/* Premium content */}
</div>
```

```css
/* In CSS */
.protected-content {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
```

**Reality Check:**
⚠️ This only slows down casual users. Tech-savvy users can still screenshot.

---

#### 4. Blur Previews for Free Users
**Implementation Priority:** High (already planned)  
**Effort:** Included in subscription gating  
**Effectiveness:** High for conversion

**What:**
Show blurred versions of premium charts to free users.

**Technical Implementation:**
```typescript
// In Reports component
{hasProAccess ? (
  <RadarChart data={radarData} />
) : (
  <div className="relative">
    <div className="filter blur-xl">
      <RadarChart data={radarData} />
    </div>
    <div className="absolute inset-0 flex items-center justify-center">
      <UpgradePrompt feature="Radar Charts" />
    </div>
  </div>
)}
```

**Benefits:**
- ✅ Screenshots show blurred content (useless)
- ✅ Creates curiosity and desire
- ✅ Encourages upgrades
- ✅ Free users can't share useful screenshots

---

### **Phase 2: Native Mobile App (3-6 Months)**

#### 5. Native App with Screenshot Blocking 🔥 **FULL PROTECTION**
**Implementation Priority:** Future  
**Effort:** 2-3 weeks  
**Effectiveness:** 100%

**Technology:** Capacitor (converts web app to native)

**What:**
Convert BaseCoach to native iOS/Android app with built-in screenshot blocking.

**Technical Implementation:**

**iOS (Swift):**
```swift
// Prevent screenshots
override func makeSecure() {
    DispatchQueue.main.async {
        let field = UITextField()
        field.isSecureTextEntry = true
        self.view.addSubview(field)
        field.centerXAnchor.constraint(equalTo: self.view.centerXAnchor).isActive = true
        field.centerYAnchor.constraint(equalTo: self.view.centerYAnchor).isActive = true
        field.layer.sublayers?.first?.addSublayer(self.view.layer)
        field.isHidden = true
    }
}

// Or detect and log
NotificationCenter.default.addObserver(
    forName: UIApplication.userDidTakeScreenshotNotification,
    object: nil,
    queue: .main
) { _ in
    // Log screenshot attempt
    analytics.track("screenshot_attempted", user: currentUser)
    // Show warning to user
    showAlert("Screenshots are not allowed")
}
```

**Android (Kotlin):**
```kotlin
// Prevent screenshots and screen recording
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window.setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    )
}
```

**Capacitor Integration:**
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.basecoach',
  appName: 'BaseCoach',
  webDir: 'dist',
  plugins: {
    ScreenProtection: {
      enabled: true,
      preventScreenshots: true,
      preventScreenRecording: true
    }
  }
};

export default config;
```

**Benefits:**
- ✅ **100% blocks screenshots** on iOS and Android
- ✅ **Blocks screen recording**
- ✅ Better performance than PWA
- ✅ Native notifications
- ✅ Offline mode
- ✅ More professional experience
- ✅ Can publish to App Store and Google Play

**Costs:**
- Apple Developer: $99/year
- Google Play: $25 one-time
- App Store review process: ~2 weeks
- Capacitor setup: 2-3 weeks

**Keep Web Version:**
- Desktop users still use web app (with watermarks)
- Mobile users download native app (full protection)
- Same codebase for both (Capacitor wraps existing React app)

---

## 🎯 Recommended Implementation Plan

### **Immediate (Phase 1):**
1. ✅ **Add dynamic watermarks** to Reports component
   - User email + subscription tier + date
   - Apply to: Radar charts, Evolution charts, AI insights
   - **Effort:** 4 hours
   - **Priority:** High

2. ✅ **Blur previews** for free users (already in subscription plan)
   - **Effort:** Included in gating work
   - **Priority:** High

3. ⚠️ **Disable right-click** on premium content (optional)
   - Minor deterrent
   - **Effort:** 30 minutes
   - **Priority:** Low

### **Later (Phase 2 - After Business Validation):**
1. ✅ **Convert to native app** with Capacitor
   - **Timing:** After 50+ paying users
   - **Effort:** 2-3 weeks
   - **Priority:** High (when ready)

2. ✅ **Enable screenshot blocking** on mobile
   - iOS and Android
   - **Effort:** Included in native conversion
   - **Priority:** High

3. ✅ **Keep web version** for desktop users
   - With watermarks for protection
   - **Effort:** No extra work
   - **Priority:** Medium

---

## 📊 Effectiveness Comparison

| Strategy | Effectiveness | Effort | Cost | When |
|----------|--------------|--------|------|------|
| **Dynamic Watermarks** | 🟢 High | 4 hours | Free | Now |
| **Blur Previews** | 🟢 High | Included | Free | Now |
| **Time-Limited Tokens** | 🟡 Medium | 6 hours | Free | Later |
| **UI Obfuscation** | 🔴 Low | 2 hours | Free | Optional |
| **Native App + Blocking** | 🟢 100% | 2-3 weeks | $124/year | Phase 2 |

---

## 🔒 Legal & Policy Considerations

### **Terms of Service:**
Add clause prohibiting:
- Unauthorized screenshots of premium content
- Sharing of paid reports without permission
- Distribution of proprietary analytics

### **User Agreement:**
- User acknowledges content is proprietary
- Screenshots for personal use only
- Sharing violates terms and may result in account termination

### **LGPD Compliance:**
- Watermarks contain user email (personal data)
- Clearly communicate why watermarks exist
- Privacy policy must explain data usage in watermarks

---

## 📝 Implementation Checklist

### **Phase 1 (Web App):**
- [ ] Create `Watermark.tsx` component
- [ ] Add watermark to Reports component
- [ ] Test watermark visibility in screenshots
- [ ] Ensure watermark doesn't hurt UX
- [ ] Update Terms of Service
- [ ] Update Privacy Policy
- [ ] Add "Screenshots prohibited" notice to premium content

### **Phase 2 (Native App):**
- [ ] Research Capacitor setup
- [ ] Convert app to Capacitor project
- [ ] Test screenshot blocking on iOS
- [ ] Test screenshot blocking on Android
- [ ] Submit to App Store
- [ ] Submit to Google Play
- [ ] Market native app to existing users

---

## 💡 Additional Ideas

### **Detection & Logging:**
```typescript
// Log when users view premium content
// If content leaks, trace back to source
analytics.track('premium_content_viewed', {
  userId: user.id,
  email: user.email,
  contentType: 'radar_chart',
  reportId: report.id,
  timestamp: new Date().toISOString(),
  sessionId: sessionStorage.getItem('sessionId')
});
```

### **Social Proof:**
- Show "X coaches trust us with their data" on pricing page
- Testimonials emphasizing security
- Case studies about data protection

### **Education:**
- Explain to users why we protect content
- "We protect your valuable coaching insights"
- Position as a feature, not a restriction

---

## 🎯 Success Metrics

Track:
- Screenshot-related complaints (should be low)
- Unauthorized content sharing incidents
- User trust/satisfaction with security
- Native app adoption rate (Phase 2)

---

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Screenshot Prevention](https://developer.apple.com/documentation/uikit/uiapplication/1622959-userdidtakescreenshotnotificatio)
- [Android FLAG_SECURE](https://developer.android.com/reference/android/view/WindowManager.LayoutParams#FLAG_SECURE)
- [React Native Screen Protection](https://github.com/kristiansorens/react-native-screenshot-prevent)

---

**Status:** 📋 Documented for future implementation  
**Next Action:** Add watermark task to Phase 1 checklist  
**Owner:** Development Team





