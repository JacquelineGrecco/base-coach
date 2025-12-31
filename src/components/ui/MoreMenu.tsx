'use client';

import React from 'react';
import { ViewState } from '@/types';
import { 
  BookOpen, 
  User, 
  CreditCard, 
  MessageCircle, 
  X,
  LogOut,
  HelpCircle,
  Settings
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';

interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onContactSupport: () => void;
}

const MoreMenu: React.FC<MoreMenuProps> = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onChangeView,
  onContactSupport 
}) => {
  const { signOut, user } = useAuth();

  if (!isOpen) return null;

  const handleNavigation = (view: ViewState) => {
    onChangeView(view);
    onClose();
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  const menuItems = [
    { view: 'DRILLS' as ViewState, icon: BookOpen, label: 'Biblioteca de Exercícios', color: 'text-blue-600', bg: 'bg-blue-50' },
    { view: 'PROFILE' as ViewState, icon: User, label: 'Meu Perfil', color: 'text-purple-600', bg: 'bg-purple-50' },
    { view: 'PRICING' as ViewState, icon: CreditCard, label: 'Planos e Assinatura', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slideUp">
        <div className="bg-white rounded-t-3xl shadow-2xl max-h-[85vh] overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Menu</h2>
              {user && (
                <p className="text-sm text-slate-500 truncate max-w-[200px]">{user.email}</p>
              )}
            </div>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Menu Items */}
          <div className="p-4 space-y-2">
            {menuItems.map(({ view, icon: Icon, label, color, bg }) => (
              <button
                key={view}
                onClick={() => handleNavigation(view)}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 active:scale-[0.98]
                  ${currentView === view 
                    ? `${bg} ${color}` 
                    : 'hover:bg-slate-50 text-slate-700'
                  }
                `}
              >
                <div className={`p-2.5 rounded-xl ${currentView === view ? bg : 'bg-slate-100'}`}>
                  <Icon className={`w-5 h-5 ${currentView === view ? color : 'text-slate-600'}`} />
                </div>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
          
          {/* Divider */}
          <div className="mx-4 border-t border-slate-100" />
          
          {/* Support & Help */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => {
                onContactSupport();
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 text-slate-700 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="p-2.5 rounded-xl bg-green-50">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="font-medium">Suporte via WhatsApp</span>
            </button>
          </div>
          
          {/* Divider */}
          <div className="mx-4 border-t border-slate-100" />
          
          {/* Logout */}
          <div className="p-4 pb-8">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-red-50 text-red-600 transition-all duration-200 active:scale-[0.98]"
            >
              <div className="p-2.5 rounded-xl bg-red-50">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-medium">Sair da Conta</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MoreMenu;

