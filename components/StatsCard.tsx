
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  colorClass: string;
  trend?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, colorClass, trend }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100 flex flex-col items-center text-center sm:text-left sm:items-start transition-all hover:shadow-md">
      <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-15 mb-3`}>
        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-sm md:text-xl font-black text-gray-900 truncate">{value}</h3>
        {trend && <p className="text-[9px] text-emerald-600 mt-1 font-bold">{trend}</p>}
      </div>
    </div>
  );
};
