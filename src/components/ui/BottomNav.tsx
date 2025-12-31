'use client';

import React from 'react';
import { ViewState } from '@/types';
import { 
  LayoutDashboard, 
  Users, 
  PlayCircle, 
  BarChart2,
  MoreHorizontal 
} from 'lucide-react';

interface BottomNavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onOpenMore: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onChangeView, onOpenMore }) => {
  const navItems = [
    { view: 'DASHBOARD' as ViewState, icon: LayoutDashboard, label: 'Início' },
    { view: 'TEAMS' as ViewState, icon: Users, label: 'Times' },
    { view: 'SESSION_SETUP' as ViewState, icon: PlayCircle, label: 'Treinar' },
    { view: 'REPORTS' as ViewState, icon: BarChart2, label: 'Relatórios' },
  ];

  const isActiveView = (view: ViewState) => {
    // Handle session views as "Treinar" active
    if (view === 'SESSION_SETUP' && (currentView === 'SESSION_SETUP' || currentView === 'ACTIVE_SESSION')) {
      return true;
    }
    return currentView === view;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = isActiveView(view);
          
          return (
            <button
              key={view}
              onClick={() => onChangeView(view)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full py-2 px-1
                transition-all duration-200 active:scale-95
                ${isActive 
                  ? 'text-emerald-600' 
                  : 'text-slate-500 hover:text-slate-700'
                }
              `}
            >
              <div className={`
                relative p-1.5 rounded-xl transition-all duration-200
                ${isActive ? 'bg-emerald-50' : ''}
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {isActive && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full" />
                )}
              </div>
              <span className={`
                text-[10px] mt-1 font-medium tracking-tight
                ${isActive ? 'text-emerald-700' : ''}
              `}>
                {label}
              </span>
            </button>
          );
        })}
        
        {/* More button */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center flex-1 h-full py-2 px-1 text-slate-500 hover:text-slate-700 transition-all duration-200 active:scale-95"
        >
          <div className="p-1.5 rounded-xl">
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 font-medium tracking-tight">
            Mais
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;

