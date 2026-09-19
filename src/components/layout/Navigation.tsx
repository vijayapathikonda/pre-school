import React from 'react';
import { ClipboardList, Users, BarChart3, FileText } from 'lucide-react';

export type TabType = 'observation' | 'summary' | 'roster' | 'reports';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  completedCount: number;
  totalCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  completedCount,
  totalCount,
}) => {
  const tabs = [
    {
      id: 'observation' as TabType,
      label: 'Observe',
      icon: ClipboardList,
      badge: `${completedCount}/${totalCount}`,
    },
    {
      id: 'summary' as TabType,
      label: 'Daily Summary',
      icon: BarChart3,
    },
    {
      id: 'roster' as TabType,
      label: 'Students',
      icon: Users,
      badge: totalCount > 0 ? `${totalCount}` : undefined,
    },
    {
      id: 'reports' as TabType,
      label: 'Parent Slips',
      icon: FileText,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-lg md:relative md:border-t-0 md:bg-transparent">
      <div className="max-w-md md:max-w-5xl mx-auto px-3">
        <div className="flex justify-around items-center h-14 md:h-12 md:justify-start md:space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col md:flex-row items-center justify-center py-1 px-2.5 rounded-lg transition-all relative ${
                  isActive
                    ? 'text-indigo-400 font-bold md:bg-slate-800/80'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 md:mr-1.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {tab.badge && (
                    <span className="md:hidden absolute -top-1.5 -right-3 px-1 py-0.2 bg-indigo-600 text-white rounded-full text-[9px] font-bold">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[11px] md:text-xs mt-0.5 md:mt-0 tracking-tight">
                  {tab.label}
                </span>
                {tab.badge && (
                  <span className="hidden md:inline-block ml-2 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-semibold border border-slate-700">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
