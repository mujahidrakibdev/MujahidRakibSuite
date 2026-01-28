import React from 'react';
import { Zap, Key } from 'lucide-react';
import { TranscriptProvider } from '../types';

interface UsageStatsProps {
  usage: number;
  provider: TranscriptProvider;
}

export const UsageStats: React.FC<UsageStatsProps> = ({
  usage,
  provider
}) => {
  const isSupadata = provider === 'supadata';
  const limit = isSupadata ? 100 : 20;
  const percentage = Math.min(100, Math.max(0, (usage / limit) * 100));
  
  // Theme configuration based on provider
  const theme = isSupadata ? {
    color: 'text-yellow-400',
    barColor: 'bg-yellow-500',
    glowColor: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]',
  } : {
    color: 'text-blue-400',
    barColor: 'bg-blue-500',
    glowColor: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
  };

  return (
    <div className="w-full flex items-center gap-3 animate-fade-in mt-4 px-1" title={isSupadata ? "Supadata Usage" : "RapidAPI Usage"}>
      {/* Icon */}
      {isSupadata ? <Zap size={14} className={theme.color} /> : <Key size={14} className={theme.color} />}
      
      {/* Minimal Thin Bar */}
      <div className="flex-1 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
         <div 
           className={`h-full ${theme.barColor} transition-all duration-700 ${theme.glowColor}`} 
           style={{ width: `${percentage}%` }} 
         />
      </div>

      {/* Numbers */}
      <div className={`text-xs font-mono font-bold ${theme.color}`}>
         {usage}<span className="text-slate-600">/</span>{limit}
      </div>
    </div>
  );
};