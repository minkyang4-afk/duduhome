import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const colorMap = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon: Icon, color }) => {
  return (
    <div className={`p-6 rounded-xl border backdrop-blur-sm ${colorMap[color]} transition-all duration-300 hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          {change && <p className="text-xs mt-2 opacity-60">{change}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-slate-900/50`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};