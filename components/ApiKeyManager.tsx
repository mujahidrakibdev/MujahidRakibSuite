import React, { useState, useEffect } from 'react';
import { Settings, X, Key, CheckCircle2, Youtube, Zap } from 'lucide-react';

interface ApiKeyManagerProps {
  youtubeApiKey: string;
  setYoutubeApiKey: (key: string) => void;
  rapidApiKey: string;
  setRapidApiKey: (key: string) => void;
}

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  youtubeApiKey, 
  setYoutubeApiKey,
  rapidApiKey,
  setRapidApiKey
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Local state for inputs
  const [ytInput, setYtInput] = useState('');
  const [rapidInput, setRapidInput] = useState('');

  // Helper to mask key
  const maskKey = (key: string) => {
    if (!key || key.length < 8) return '';
    return `••••••••${key.slice(-4)}`;
  };

  // Sync props to local state when opening or when props change
  useEffect(() => {
    setYtInput(maskKey(youtubeApiKey));
    setRapidInput(maskKey(rapidApiKey));
  }, [youtubeApiKey, rapidApiKey]);

  const handleSave = () => {
    const newYtKey = ytInput.startsWith('••••') ? youtubeApiKey : ytInput.trim();
    const newRapidKey = rapidInput.startsWith('••••') ? rapidApiKey : rapidInput.trim();

    if (newYtKey !== youtubeApiKey) setYoutubeApiKey(newYtKey);
    if (newRapidKey !== rapidApiKey) setRapidApiKey(newRapidKey);
    
    setIsOpen(false);
  };
  
  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>, 
    originalKey: string, 
    setter: (val: string) => void
  ) => {
    if (e.target.value.startsWith('••••')) {
      setter(''); 
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    originalKey: string,
    setter: (val: string) => void
  ) => {
    if (!e.target.value.trim() && originalKey) {
       setter(maskKey(originalKey));
    }
  };

  return (
    <>
      {/* Trigger & Status Display in Header */}
      <div className="flex items-center gap-4">
        
        {/* API Status Indicators */}
        <div className="hidden md:flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-800/60 backdrop-blur-sm">
           <div className="flex items-center gap-2" title={youtubeApiKey ? "YouTube API Connected" : "YouTube API Missing"}>
             <Youtube size={16} className={youtubeApiKey ? "text-red-500" : "text-slate-600"} />
             <div className={`w-1.5 h-1.5 rounded-full ${youtubeApiKey ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"}`}></div>
           </div>
           <div className="w-px h-4 bg-slate-700/50"></div>
           <div className="flex items-center gap-2" title={rapidApiKey ? "RapidAPI Connected" : "RapidAPI Missing"}>
             <Zap size={16} className={rapidApiKey ? "text-blue-500" : "text-slate-600"} />
             <div className={`w-1.5 h-1.5 rounded-full ${rapidApiKey ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-slate-700"}`}></div>
           </div>
        </div>

        {/* Settings Button */}
        <button 
          onClick={() => setIsOpen(true)}
          className="p-2.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95 group"
          title="Configure API Keys"
        >
          <Settings size={20} className="group-hover:rotate-45 transition-transform duration-500" />
        </button>
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-0 animate-fade-in">
             
             {/* Modal Header */}
             <div className="bg-slate-950/50 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                   <Settings size={18} className="text-indigo-500" />
                   API Configuration
                </h3>
                <button 
                   onClick={() => setIsOpen(false)}
                   className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                   <X size={20} />
                </button>
             </div>

             {/* Modal Content */}
             <div className="p-6 space-y-6">
                
                {/* YouTube Input */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Youtube size={16} className="text-red-500" />
                        YouTube Data API V3
                      </label>
                      {youtubeApiKey && <CheckCircle2 size={16} className="text-emerald-500" />}
                   </div>
                   <input 
                      type="text" 
                      value={ytInput}
                      onChange={(e) => setYtInput(e.target.value)}
                      onFocus={(e) => handleFocus(e, youtubeApiKey, setYtInput)}
                      onBlur={(e) => handleBlur(e, youtubeApiKey, setYtInput)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-700 font-mono transition-all"
                      placeholder="Paste your AIzaSy... key here"
                   />
                </div>

                {/* Rapid Input */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Zap size={16} className="text-blue-500" />
                        RapidAPI (Veritoolz)
                      </label>
                      {rapidApiKey && <CheckCircle2 size={16} className="text-emerald-500" />}
                   </div>
                   <input 
                      type="text" 
                      value={rapidInput}
                      onChange={(e) => setRapidInput(e.target.value)}
                      onFocus={(e) => handleFocus(e, rapidApiKey, setRapidInput)}
                      onBlur={(e) => handleBlur(e, rapidApiKey, setRapidInput)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none placeholder:text-slate-700 font-mono transition-all"
                      placeholder="Paste your RapidAPI key here"
                   />
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 leading-relaxed">
                   <strong>Note:</strong> Keys are stored locally in your browser for convenience and are never sent to any server other than the respective APIs.
                </div>
             </div>

             {/* Modal Footer */}
             <div className="px-6 py-4 bg-slate-950/30 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={handleSave}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Save Configuration
                </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};