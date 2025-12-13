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
    <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 border border-gray-100 flex flex-col md:flex-row md:items-start md:justify-between transition-transform">
      <div className="order-2 md:order-1 mt-2 md:mt-0">
        <p className="text-xs md:text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-lg md:text-2xl font-bold text-gray-900 truncate">{value}</h3>
        {trend && <p className="text-[10px] md:text-xs text-green-600 mt-1 font-medium">{trend}</p>}
      </div>
      <div className={`order-1 md:order-2 self-start p-2 md:p-3 rounded-lg ${colorClass} bg-opacity-20`}>
        <Icon className={`w-5 h-5 md:w-6 md:h-6 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
    </div>
  );
};
