import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, PlayCircle, BookOpen, BarChart2, LogOut, Menu, Settings, Users, MessageCircle, CreditCard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children }) => {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const SUPPORT_WHATSAPP = import.meta.env.VITE_SUPPORT_WHATSAPP || '5511999999999';

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
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
            <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg">B</div>
                <span className="text-xl font-bold tracking-tight">BaseCoach</span>
            </div>
            {user && (
              <p className="text-xs text-slate-400 mt-2 truncate">{user.email}</p>
            )}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
            <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem view="TEAMS" icon={Users} label="Times" />
            <NavItem view="SESSION_SETUP" icon={PlayCircle} label="Sessão ao Vivo" />
            <NavItem view="DRILLS" icon={BookOpen} label="Biblioteca" />
            <NavItem view="REPORTS" icon={BarChart2} label="Relatórios" />
            <NavItem view="PRICING" icon={CreditCard} label="Planos" />
            <NavItem view="PROFILE" icon={Settings} label="Configurações" />
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
            <button 
              onClick={handleContactSupport}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <MessageCircle className="w-5 h-5" />
                <span>Suporte</span>
            </button>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center shadow-md z-20">
             <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg">B</div>
                <span className="text-xl font-bold">BaseCoach</span>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                <Menu className="w-6 h-6" />
            </button>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
            <div className="absolute inset-0 bg-slate-900 z-50 p-6 flex flex-col space-y-4 md:hidden">
                <div className="flex justify-end mb-4">
                    <button onClick={() => setMobileMenuOpen(false)} className="text-white">
                         <span className="text-2xl">✕</span>
                    </button>
                </div>
                <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
                <NavItem view="TEAMS" icon={Users} label="Times" />
                <NavItem view="SESSION_SETUP" icon={PlayCircle} label="Sessão ao Vivo" />
                <NavItem view="DRILLS" icon={BookOpen} label="Biblioteca" />
                <NavItem view="REPORTS" icon={BarChart2} label="Relatórios" />
                <NavItem view="PRICING" icon={CreditCard} label="Planos" />
                <NavItem view="PROFILE" icon={Settings} label="Configurações" />
                <div className="pt-4 mt-auto space-y-2">
                  <button 
                    onClick={handleContactSupport}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                      <MessageCircle className="w-5 h-5" />
                      <span>Suporte</span>
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                  >
                      <LogOut className="w-5 h-5" />
                      <span>Sair</span>
                  </button>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto relative">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
