'use client';

import React from 'react';
import { ViewState } from '@/types';
import { LayoutDashboard, PlayCircle, BookOpen, BarChart2, LogOut, Menu, User, Users, MessageCircle, CreditCard, Gift, Clock, X, ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { subscriptionService, SubscriptionInfo } from '@/features/auth/services/subscriptionService';
import { TrialExpirationWarning } from './TrialExpirationWarning';
import BottomNav from './BottomNav';
import MoreMenu from './MoreMenu';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);
  const [subscription, setSubscription] = React.useState<SubscriptionInfo | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = React.useState<number | null>(null);

  const SUPPORT_WHATSAPP = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '5511984199058';

  // Load subscription info
  React.useEffect(() => {
    loadSubscription();
  }, []);

  async function loadSubscription() {
    const data = await subscriptionService.getUserSubscription();
    if (!data) {
      console.error('Error loading subscription');
      return;
    }
    setSubscription(data);

    // Calculate trial days left
    if (data?.trialEndsAt) {
      const daysLeft = await subscriptionService.getTrialDaysRemaining();
      setTrialDaysLeft(daysLeft);
    }
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent(
      `Olá! Preciso de ajuda com o BaseCoach.\n\nEmail: ${user?.email || 'não informado'}`
    );
    const whatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setMobileMenuOpen(false);
  };

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setMobileMenuOpen(false);
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-emerald-600 text-white shadow-md'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  // Trial banner color based on days left
  const getTrialBannerStyle = () => {
    if (trialDaysLeft === null) return null;
    
    if (trialDaysLeft <= 3) {
      return {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        icon: '🚨',
        text: 'text-white'
      };
    } else if (trialDaysLeft <= 7) {
      return {
        bg: 'bg-gradient-to-r from-yellow-500 to-orange-500',
        icon: '⚠️',
        text: 'text-white'
      };
    } else {
      return {
        bg: 'bg-gradient-to-r from-blue-500 to-purple-600',
        icon: '🎁',
        text: 'text-white'
      };
    }
  };

  const trialStyle = getTrialBannerStyle();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Trial Expiration Warning Modal */}
      <TrialExpirationWarning 
        subscription={subscription}
        onUpgrade={() => onChangeView('PRICING')}
      />

      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800">
        {/* Logo & User */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
              B
            </div>
            <span className="text-xl font-bold tracking-tight">BaseCoach</span>
          </div>
          {user && (
            <p className="text-xs text-slate-400 mt-3 truncate">{user.email}</p>
          )}
        </div>
        
        {/* Primary Navigation - Core Features */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="TEAMS" icon={Users} label="Times" />
          <NavItem view="DRILLS" icon={BookOpen} label="Biblioteca" />
          <NavItem view="REPORTS" icon={BarChart2} label="Relatórios" />
        </nav>

        {/* Bottom Section - Account & Support */}
        <div className="p-4 border-t-2 border-slate-700 space-y-2">
          <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Conta e Suporte
          </div>
          <NavItem view="PROFILE" icon={User} label="Perfil" />
          <NavItem view="PRICING" icon={CreditCard} label="Planos" />
          <button 
            onClick={handleContactSupport}
            className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span>Suporte</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Trial Banner - Desktop */}
        {trialDaysLeft !== null && trialDaysLeft >= 0 && trialStyle && (
          <div className={`hidden md:block ${trialStyle.bg} ${trialStyle.text} py-3 px-4 shadow-md`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{trialStyle.icon}</span>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">
                    Teste Pro: {trialDaysLeft} {trialDaysLeft === 1 ? 'dia restante' : 'dias restantes'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onChangeView('PRICING')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors backdrop-blur-sm text-sm"
              >
                Ver Planos
              </button>
            </div>
          </div>
        )}

        {/* Mobile Header - Simplified */}
        <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
              B
            </div>
            <span className="text-lg font-bold text-slate-900">BaseCoach</span>
          </div>
          
          {/* Trial Badge on Mobile */}
          {trialDaysLeft !== null && trialDaysLeft >= 0 && (
            <button
              onClick={() => onChangeView('PRICING')}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold
                ${trialDaysLeft <= 3 
                  ? 'bg-red-100 text-red-700' 
                  : trialDaysLeft <= 7 
                    ? 'bg-yellow-100 text-yellow-700' 
                    : 'bg-blue-100 text-blue-700'
                }
              `}
            >
              <Clock className="w-3.5 h-3.5" />
              {trialDaysLeft}d
            </button>
          )}
        </header>

        {/* Legacy Mobile Menu Overlay - For hamburger menu if needed */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900 z-50 p-6 flex flex-col space-y-4 md:hidden animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center font-bold text-white">
                  B
                </div>
                <span className="text-xl font-bold text-white">BaseCoach</span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Primary Navigation */}
            <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="TEAMS" icon={Users} label="Times" />
            <NavItem view="DRILLS" icon={BookOpen} label="Biblioteca" />
            <NavItem view="REPORTS" icon={BarChart2} label="Relatórios" />
            
            {/* Bottom Section - Account & Support */}
            <div className="pt-4 mt-auto space-y-2 border-t-2 border-slate-700">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Conta e Suporte
              </div>
              <NavItem view="PROFILE" icon={User} label="Perfil" />
              <NavItem view="PRICING" icon={CreditCard} label="Planos" />
              <button 
                onClick={handleContactSupport}
                className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Suporte</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto relative pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom Navigation - Mobile Only */}
        <BottomNav 
          currentView={currentView}
          onChangeView={onChangeView}
          onOpenMore={() => setMoreMenuOpen(true)}
        />

        {/* More Menu - Bottom Sheet */}
        <MoreMenu
          isOpen={moreMenuOpen}
          onClose={() => setMoreMenuOpen(false)}
          currentView={currentView}
          onChangeView={onChangeView}
          onContactSupport={handleContactSupport}
        />
      </main>
    </div>
  );
};

export default Layout;
