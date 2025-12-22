# Settings Page Refactoring Plan

**Date:** December 21, 2025  
**Issue:** Redundant subscription information in Profile/Settings  
**Goal:** Streamline UX, add high-value features, reduce duplication

---

## 🔍 Current State Analysis

### Identified Duplications

#### 1. **Plan Comparison Tables**
**Location:** Both "Planos" menu AND "Plano" tab in Profile/Settings  
**Content:** Identical feature lists for Gratuito, Pro, and Premium tiers
- Number of teams
- Athletes per team  
- AI insights availability
- All tier features

#### 2. **Active Subscription Status**
**Location:** Both pages  
**Content:** Pro plan with "14 dias restantes" on free trial

#### 3. **Actionable Buttons**
**Location:** Both pages  
**Content:** "Fazer Upgrade" and "Ver Detalhes" buttons

#### 4. **Enterprise Inquiry CTA**
**Location:** Both pages  
**Content:** "Precisa de um plano Enterprise?" with "Falar com Vendas" button

### Current Files
- `src/components/ui/Pricing.tsx` - Dedicated Plans page (428 lines)
- `src/components/ui/Profile.tsx` - Settings page with "Plano" tab (1,352 lines)

---

## 🎯 Proposed Solution

### Architecture Change

**Before:**
```
Pricing.tsx (standalone page)
  └─ Full comparison table
  └─ All tier details
  └─ Upgrade/Trial buttons

Profile.tsx ("Plano" tab)
  └─ Full comparison table (DUPLICATE)
  └─ All tier details (DUPLICATE)
  └─ Upgrade/Trial buttons (DUPLICATE)
```

**After:**
```
Pricing.tsx (standalone page - UNCHANGED)
  └─ Full comparison table
  └─ Marketing focus
  └─ All tier details
  └─ Upgrade/Trial buttons

Profile.tsx (refactored)
  ├─ Personal Info Tab (existing)
  ├─ Security Tab (NEW)
  ├─ Notifications Tab (NEW)
  ├─ Preferences Tab (NEW)
  ├─ Billing Tab (RENAMED from "Plano")
  │   └─ Current plan summary
  │   └─ Next payment date
  │   └─ "Change Plan" → Links to Pricing.tsx
  │   └─ Payment method
  │   └─ Invoice history
  └─ Data & Privacy Tab (NEW)
      └─ Export options
      └─ Account deletion
```

---

## 📋 Implementation Plan

### Phase 1: Billing Tab Simplification (3-4 hours)

#### Remove from Profile.tsx "Plano" Tab:
- ❌ Full comparison table (keep in Pricing.tsx only)
- ❌ Feature lists for all tiers
- ❌ Marketing copy
- ❌ "Fazer Upgrade" buttons for other tiers

#### Keep in Profile.tsx "Plano" Tab (rename to "Billing"):
- ✅ Current active plan card
- ✅ Trial status (if applicable)
- ✅ Next billing date
- ✅ "Change Plan" button → Navigate to Pricing.tsx

#### Add to "Billing" Tab:
- ✅ Payment method card (credit card, last 4 digits)
- ✅ Invoice history table (date, amount, status, download)
- ✅ Cancel subscription button (with confirmation)
- ✅ Billing address

**New Component:** `BillingTab.tsx` (~150 lines)

**Code Example:**
```typescript
// BillingTab.tsx
export function BillingTab() {
  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader>
          <h3>Plano Atual</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={tier === 'premium' ? 'premium' : 'primary'}>
                {TIER_INFO[tier].name}
              </Badge>
              <p className="text-sm text-slate-600 mt-2">
                {trialDaysLeft > 0 
                  ? `Teste grátis: ${trialDaysLeft} dias restantes`
                  : `Próxima cobrança: ${nextBillingDate}`
                }
              </p>
            </div>
            <Button onClick={() => navigate('/pricing')}>
              Alterar Plano
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <h3>Método de Pagamento</h3>
        </CardHeader>
        <CardBody>
          {/* Credit card info */}
        </CardBody>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader>
          <h3>Histórico de Faturas</h3>
        </CardHeader>
        <CardBody>
          <table>{/* Invoice table */}</table>
        </CardBody>
      </Card>
    </div>
  );
}
```

---

### Phase 2: Security Tab (2-3 hours)

#### Features:
- ✅ **Change Password** (move from Personal tab)
- ✅ **Two-Factor Authentication (2FA)**
  - Enable/Disable toggle
  - QR code for authenticator app
  - Recovery codes
- ✅ **Active Sessions**
  - List of logged-in devices
  - Last active timestamp
  - "Sign Out All" button
- ✅ **Login History**
  - Recent login attempts
  - IP addresses
  - Location (approximate)

**New Component:** `SecurityTab.tsx` (~200 lines)

**Code Example:**
```typescript
// SecurityTab.tsx
export function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card>
        <CardHeader>
          <Lock className="w-5 h-5" />
          <h3>Alterar Senha</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handlePasswordChange}>
            <Input type="password" label="Senha Atual" />
            <Input type="password" label="Nova Senha" />
            <Input type="password" label="Confirmar Nova Senha" />
            <Button type="submit">Atualizar Senha</Button>
          </form>
        </CardBody>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <Shield className="w-5 h-5" />
          <h3>Autenticação de Dois Fatores</h3>
        </CardHeader>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">
                {twoFactorEnabled ? 'Ativado' : 'Desativado'}
              </p>
              <p className="text-sm text-slate-600">
                Adicione uma camada extra de segurança
              </p>
            </div>
            <Toggle checked={twoFactorEnabled} onChange={setTwoFactorEnabled} />
          </div>
          {twoFactorEnabled && (
            <div>
              <QRCode value={twoFactorSecret} />
              <Button onClick={downloadRecoveryCodes}>
                Baixar Códigos de Recuperação
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <Smartphone className="w-5 h-5" />
          <h3>Sessões Ativas</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {activeSessions.map(session => (
              <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{session.device}</p>
                  <p className="text-sm text-slate-600">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => signOutSession(session.id)}>
                  Desconectar
                </Button>
              </div>
            ))}
          </div>
          <Button variant="danger" onClick={signOutAllSessions} className="mt-4">
            Desconectar Todos
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
```

---

### Phase 3: Notifications Tab (2-3 hours)

#### Features:
- ✅ **Push Notifications**
  - Upcoming sessions (24h, 1h before)
  - Athlete absences
  - New AI reports generated
- ✅ **Email Notifications**
  - Weekly summary
  - Monthly reports
  - Trial expiration warnings
  - Payment receipts
- ✅ **In-App Notifications**
  - Session reminders
  - Feature updates
  - Tips & tricks

**New Component:** `NotificationsTab.tsx` (~150 lines)

**Code Example:**
```typescript
// NotificationsTab.tsx
export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    push: {
      sessionsReminder24h: true,
      sessionsReminder1h: true,
      athleteAbsences: false,
      aiReportsReady: true,
    },
    email: {
      weeklySummary: true,
      monthlyReports: false,
      trialExpiration: true,
      paymentReceipts: true,
    },
    inApp: {
      sessionReminders: true,
      featureUpdates: true,
      tipsAndTricks: false,
    }
  });

  return (
    <div className="space-y-6">
      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <Bell className="w-5 h-5" />
          <h3>Notificações Push</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <NotificationToggle
              label="Lembrete de sessão (24h antes)"
              description="Receba uma notificação um dia antes de cada treino"
              checked={notifications.push.sessionsReminder24h}
              onChange={(val) => updateNotification('push', 'sessionsReminder24h', val)}
            />
            <NotificationToggle
              label="Lembrete de sessão (1h antes)"
              description="Notificação uma hora antes do início"
              checked={notifications.push.sessionsReminder1h}
              onChange={(val) => updateNotification('push', 'sessionsReminder1h', val)}
            />
            <NotificationToggle
              label="Ausências de atletas"
              description="Alerta quando um atleta confirma ausência"
              checked={notifications.push.athleteAbsences}
              onChange={(val) => updateNotification('push', 'athleteAbsences', val)}
            />
            <NotificationToggle
              label="Relatórios IA prontos"
              description="Quando análises com IA forem concluídas"
              checked={notifications.push.aiReportsReady}
              onChange={(val) => updateNotification('push', 'aiReportsReady', val)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <Mail className="w-5 h-5" />
          <h3>Notificações por Email</h3>
        </CardHeader>
        <CardBody>
          {/* Similar toggle list */}
        </CardBody>
      </Card>
    </div>
  );
}
```

---

### Phase 4: Preferences Tab (2-3 hours)

#### Features:
- ✅ **Language**
  - Portuguese (Brasil)
  - English
  - Spanish (future)
- ✅ **Theme**
  - Light mode
  - Dark mode
  - High contrast (for outdoor use)
- ✅ **Display**
  - Compact view / Comfortable view
  - Show player photos
  - Date format (DD/MM/YYYY vs MM/DD/YYYY)
- ✅ **Default Settings**
  - Default number of valences to select (1-3)
  - Auto-save evaluations
  - Session timer auto-start

**New Component:** `PreferencesTab.tsx` (~150 lines)

**Code Example:**
```typescript
// PreferencesTab.tsx
export function PreferencesTab() {
  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    theme: 'light',
    compactView: false,
    showPlayerPhotos: true,
    dateFormat: 'DD/MM/YYYY',
    defaultValences: 3,
    autoSave: true,
    timerAutoStart: false,
  });

  return (
    <div className="space-y-6">
      {/* Language & Region */}
      <Card>
        <CardHeader>
          <Globe className="w-5 h-5" />
          <h3>Idioma e Região</h3>
        </CardHeader>
        <CardBody>
          <Select
            label="Idioma"
            value={preferences.language}
            onChange={(val) => updatePreference('language', val)}
            options={[
              { value: 'pt-BR', label: 'Português (Brasil)' },
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Español (em breve)' }
            ]}
          />
          <Select
            label="Formato de Data"
            value={preferences.dateFormat}
            onChange={(val) => updatePreference('dateFormat', val)}
            options={[
              { value: 'DD/MM/YYYY', label: '21/12/2025' },
              { value: 'MM/DD/YYYY', label: '12/21/2025' },
              { value: 'YYYY-MM-DD', label: '2025-12-21' }
            ]}
          />
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <Palette className="w-5 h-5" />
          <h3>Aparência</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <RadioGroup
              label="Tema"
              value={preferences.theme}
              onChange={(val) => updatePreference('theme', val)}
              options={[
                { value: 'light', label: 'Claro', icon: Sun },
                { value: 'dark', label: 'Escuro', icon: Moon },
                { value: 'highContrast', label: 'Alto Contraste (Outdoor)', icon: Sun }
              ]}
            />
            <Toggle
              label="Visualização Compacta"
              description="Mostre mais informações em menos espaço"
              checked={preferences.compactView}
              onChange={(val) => updatePreference('compactView', val)}
            />
            <Toggle
              label="Mostrar Fotos dos Atletas"
              description="Exibir fotos de perfil nas listas"
              checked={preferences.showPlayerPhotos}
              onChange={(val) => updatePreference('showPlayerPhotos', val)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Session Defaults */}
      <Card>
        <CardHeader>
          <Settings className="w-5 h-5" />
          <h3>Padrões de Sessão</h3>
        </CardHeader>
        <CardBody>
          <NumberInput
            label="Número Padrão de Critérios"
            value={preferences.defaultValences}
            min={1}
            max={3}
            onChange={(val) => updatePreference('defaultValences', val)}
            description="Quantos critérios selecionar automaticamente"
          />
          <Toggle
            label="Salvamento Automático"
            description="Salvar avaliações automaticamente enquanto digita"
            checked={preferences.autoSave}
            onChange={(val) => updatePreference('autoSave', val)}
          />
          <Toggle
            label="Cronômetro Inicia Automaticamente"
            description="Começar a contar o tempo ao iniciar sessão"
            checked={preferences.timerAutoStart}
            onChange={(val) => updatePreference('timerAutoStart', val)}
          />
        </CardBody>
      </Card>
    </div>
  );
}
```

---

### Phase 5: Data & Privacy Tab (1-2 hours)

#### Features:
- ✅ **Data Export** (move from main tab)
  - Export all data (JSON/CSV)
  - Export specific team rosters
  - Export session history (date range)
  - Export player evaluations
- ✅ **Data Deletion**
  - Delete specific team
  - Delete all sessions before date
  - Clear all evaluations
- ✅ **Account Deletion** (move from main tab)
  - Strong confirmation
  - Reason selection
  - Final download of data

**New Component:** `DataPrivacyTab.tsx` (~150 lines)

**Code Example:**
```typescript
// DataPrivacyTab.tsx
export function DataPrivacyTab() {
  return (
    <div className="space-y-6">
      {/* Export Data */}
      <Card>
        <CardHeader>
          <Download className="w-5 h-5" />
          <h3>Exportar Meus Dados</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <Button onClick={() => exportAllData('json')}>
              <FileJson className="w-4 h-4 mr-2" />
              Exportar Tudo (JSON)
            </Button>
            <Button onClick={() => exportAllData('csv')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Tudo (CSV)
            </Button>
            <Button onClick={() => setShowExportModal(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Exportação Personalizada
            </Button>
          </div>

          {/* Custom Export Modal */}
          {showExportModal && (
            <Modal onClose={() => setShowExportModal(false)}>
              <h3>Exportação Personalizada</h3>
              <div className="space-y-4">
                <Checkbox label="Times e Atletas" />
                <Checkbox label="Sessões de Treino" />
                <DateRangePicker label="Período" />
                <Select label="Formato" options={['JSON', 'CSV', 'PDF']} />
              </div>
              <Button onClick={handleCustomExport}>Exportar</Button>
            </Modal>
          )}
        </CardBody>
      </Card>

      {/* Delete Data */}
      <Card>
        <CardHeader>
          <Trash2 className="w-5 h-5" />
          <h3>Excluir Dados</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            <Button variant="outline" onClick={() => setShowDeleteTeamModal(true)}>
              Excluir Time Específico
            </Button>
            <Button variant="outline" onClick={() => setShowDeleteSessionsModal(true)}>
              Excluir Sessões Antigas
            </Button>
            <Button variant="outline" onClick={() => setShowClearEvaluationsModal(true)}>
              Limpar Todas as Avaliações
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Account Deletion */}
      <Card variant="danger">
        <CardHeader>
          <AlertCircle className="w-5 h-5" />
          <h3>Excluir Conta</h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-slate-600 mb-4">
            Esta ação é permanente e não pode ser desfeita. 
            Todos os seus dados serão apagados.
          </p>
          <Button variant="danger" onClick={() => setShowDeleteAccountModal(true)}>
            Excluir Minha Conta
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
```

---

## 🗂️ New Tab Structure

### Profile.tsx Tabs

```typescript
const tabs = [
  {
    id: 'personal',
    label: 'Informações Pessoais',
    icon: User,
    description: 'Nome, email, telefone, foto de perfil, bio'
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: Shield,
    description: 'Senha, 2FA, sessões ativas, histórico de login'
  },
  {
    id: 'notifications',
    label: 'Notificações',
    icon: Bell,
    description: 'Push, email, e notificações in-app'
  },
  {
    id: 'preferences',
    label: 'Preferências',
    icon: Settings,
    description: 'Idioma, tema, padrões de sessão'
  },
  {
    id: 'billing',
    label: 'Cobrança',
    icon: CreditCard,
    description: 'Plano atual, método de pagamento, faturas'
  },
  {
    id: 'data',
    label: 'Dados & Privacidade',
    icon: Database,
    description: 'Exportar dados, excluir dados, excluir conta'
  }
];
```

---

## 📊 Comparison: Before vs After

### Before (Current)
| Tab | Content | Issues |
|-----|---------|--------|
| **Personal** | Name, email, phone, photo, bio, password, delete | ❌ Too many unrelated items |
| **Plano** | Full comparison table, all tiers, upgrade buttons | ❌ 100% duplicated from Pricing.tsx |

### After (Proposed)
| Tab | Content | Value |
|-----|---------|-------|
| **Personal** | Name, email, phone, photo, bio | ✅ Clean, focused |
| **Security** | Password, 2FA, active sessions, login history | ✅ High-value security features |
| **Notifications** | Push, email, in-app preferences | ✅ Control over alerts |
| **Preferences** | Language, theme, defaults | ✅ Personalization |
| **Billing** | Current plan, payment, invoices, change plan button | ✅ Billing-focused, not marketing |
| **Data & Privacy** | Export, delete, account deletion | ✅ LGPD compliance, user control |

---

## 🎯 Benefits

### For Users
- ✅ **Less Redundancy:** No more duplicate subscription info
- ✅ **Better Organization:** Security, Notifications, Preferences separated
- ✅ **More Control:** 2FA, session management, notification preferences
- ✅ **Clear Intent:** Pricing.tsx for marketing, Settings for management
- ✅ **LGPD Compliant:** Better data export and deletion options

### For Development
- ✅ **Single Source of Truth:** Pricing.tsx is the only place for plan comparisons
- ✅ **Easier Maintenance:** Update pricing in one place
- ✅ **Better UX:** Settings focused on management, not sales
- ✅ **Scalability:** Easy to add more tabs as needed

---

## 📅 Implementation Timeline

### Week 1 (8-10 hours)
- [ ] **Day 1-2:** Phase 1 - Billing Tab Simplification (3-4h)
- [ ] **Day 3:** Phase 2 - Security Tab (2-3h)
- [ ] **Day 4:** Phase 3 - Notifications Tab (2-3h)

### Week 2 (4-6 hours)
- [ ] **Day 5:** Phase 4 - Preferences Tab (2-3h)
- [ ] **Day 6:** Phase 5 - Data & Privacy Tab (1-2h)
- [ ] **Day 7:** Testing, bug fixes, polish (1h)

**Total Estimated Time:** 12-16 hours

---

## 🚨 Breaking Changes

### None Expected
- All existing functionality preserved
- Only UI reorganization
- No API changes
- No database changes

### Migration Path
- Existing "Plano" tab → Becomes "Billing" tab
- Password change → Moves to Security tab
- Account deletion → Moves to Data & Privacy tab
- Export data → Moves to Data & Privacy tab

---

## ✅ Testing Checklist

### Billing Tab
- [ ] Current plan displayed correctly
- [ ] Trial status shows if applicable
- [ ] "Change Plan" button navigates to Pricing.tsx
- [ ] Payment method displayed (when v1.9.0 payment integration complete)
- [ ] Invoice history loads correctly

### Security Tab
- [ ] Password change works
- [ ] 2FA enable/disable works
- [ ] Active sessions list loads
- [ ] Sign out individual session works
- [ ] Sign out all sessions works

### Notifications Tab
- [ ] All toggles save correctly
- [ ] Settings persist after refresh
- [ ] Notifications fire based on settings

### Preferences Tab
- [ ] Language change applies immediately
- [ ] Theme change applies immediately
- [ ] Default settings save correctly

### Data & Privacy Tab
- [ ] Export all data works (JSON/CSV)
- [ ] Custom export modal works
- [ ] Account deletion flow works

---

## 📝 Files to Create/Modify

### New Files (6)
1. `src/components/ui/settings/BillingTab.tsx` (~150 lines)
2. `src/components/ui/settings/SecurityTab.tsx` (~200 lines)
3. `src/components/ui/settings/NotificationsTab.tsx` (~150 lines)
4. `src/components/ui/settings/PreferencesTab.tsx` (~150 lines)
5. `src/components/ui/settings/DataPrivacyTab.tsx` (~150 lines)
6. `src/components/ui/settings/index.ts` (barrel export)

### Modified Files (1)
1. `src/components/ui/Profile.tsx` - Refactor tab structure (~800 lines after cleanup)

### New Utility Files (2)
1. `src/services/notificationService.ts` - Notification preferences
2. `src/services/preferencesService.ts` - User preferences

**Total New Code:** ~1,000 lines  
**Code Removed:** ~500 lines (duplicates)  
**Net Change:** +500 lines

---

## 🎨 UI/UX Improvements

### Visual Hierarchy
- **Before:** Two tabs with cluttered info
- **After:** Six focused tabs with clear purposes

### Information Architecture
- **Before:** Marketing (plan comparison) in Settings
- **After:** Settings focused on management only

### User Flow
- **Before:** Confused where to upgrade (two places)
- **After:** Clear: Pricing.tsx for upgrades, Settings for management

### Mobile Experience
- Tab navigation works well on mobile
- Each tab content is responsive
- Large touch targets maintained

---

## 💡 Future Enhancements (Post-Implementation)

### Phase 6: Advanced Features (Future)
- [ ] **Integrations Tab**
  - Google Calendar sync
  - WhatsApp Business integration
  - Zapier connections
  
- [ ] **Team Settings Tab** (for multi-coach accounts)
  - Team members
  - Permissions
  - Shared resources

- [ ] **Accessibility Tab**
  - Screen reader settings
  - Keyboard shortcuts customization
  - Font size adjustments

---

## 🚀 Ready to Implement?

**Prerequisites:**
- ✅ Clear understanding of current duplication
- ✅ User pain points identified
- ✅ Design approved
- ✅ Implementation plan defined

**Next Steps:**
1. Review and approve this plan
2. Create new component files
3. Implement tab by tab (phased approach)
4. Test each tab independently
5. Deploy incrementally

**Status:** Ready for implementation! 🎯

---

**Document Version:** 1.0  
**Last Updated:** December 21, 2025  
**Estimated Total Time:** 12-16 hours  
**Impact:** High (significantly improved UX)

