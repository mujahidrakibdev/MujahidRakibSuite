import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Download, Loader2, ChevronDown, Check, AlertCircle, Search, Clock, Sliders, RotateCcw, Volume2, Globe, FileAudio, LayoutList, Settings2, History } from 'lucide-react';
import { fetchVoices, fetchModels, generateAudio, Voice, Model } from '../services/elevenLabsService';

interface ElevenLabsToolProps {
  onBack: () => void;
}

interface GeneratedAudio {
  id: string;
  text: string;
  voiceName: string;
  url: string;
  createdAt: string;
  duration?: string;
}

type Tab = 'settings' | 'history';

export const ElevenLabsTool: React.FC<ElevenLabsToolProps> = ({ onBack }) => {
  // Config State
  const [apiKey, setApiKey] = useState('');
  
  // Data State
  const [voices, setVoices] = useState<Voice[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [history, setHistory] = useState<GeneratedAudio[]>([]);
  
  // Selection State
  const [text, setText] = useState('This is why cheating is useless. Because during this race, this guy was so fast that everyone knew he was going to win.');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('eleven_multilingual_v2');
  
  // Voice Settings State
  const [stability, setStability] = useState(0.5);
  const [similarity, setSimilarity] = useState(0.75);
  const [style, setStyle] = useState(0.0);
  const [speakerBoost, setSpeakerBoost] = useState(true);
  
  // UI State
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  
  // Refs
  const voiceDropdownRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize
  useEffect(() => {
    const key = localStorage.getItem('elevenlabs_api_key');
    if (key) {
      setApiKey(key);
      initData(key);
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (voiceDropdownRef.current && !voiceDropdownRef.current.contains(event.target as Node)) {
        setShowVoiceDropdown(false);
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);

  const initData = async (key: string) => {
    setLoading(true);
    try {
      const [v, m] = await Promise.all([fetchVoices(key), fetchModels(key)]);
      setVoices(v);
      setModels(m);
      if (v.length > 0 && !selectedVoiceId) setSelectedVoiceId(v[0].voice_id);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApiKeySave = () => {
    localStorage.setItem('elevenlabs_api_key', apiKey);
    initData(apiKey);
  };

  const handleGenerate = async () => {
    if (!text || !selectedVoiceId || !apiKey) return;
    setGenerating(true);
    setError(null);
    try {
      const blob = await generateAudio(
        text, 
        selectedVoiceId, 
        apiKey, 
        selectedModelId,
        {
            stability,
            similarity_boost: similarity,
            style,
            use_speaker_boost: speakerBoost
        }
      );
      const url = URL.createObjectURL(blob);
      const voiceName = voices.find(v => v.voice_id === selectedVoiceId)?.name || 'Unknown Voice';
      
      const newItem: GeneratedAudio = {
        id: Date.now().toString(),
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        voiceName,
        url,
        createdAt: "Just now",
      };
      
      setHistory(prev => [newItem, ...prev]);
      setActiveTab('history'); // Switch to history to see result
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const getSelectedVoice = () => voices.find(v => v.voice_id === selectedVoiceId);
  const getSelectedModel = () => models.find(m => m.model_id === selectedModelId);

  // Custom Slider Component
  const Slider = ({ label, value, min = 0, max = 1, step = 0.01, onChange, leftLabel, rightLabel }: any) => (
    <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center text-[13px] font-medium text-slate-300">
            <span>{label}</span>
        </div>
        <div className="relative flex items-center w-full h-5 group">
            <input 
                type="range" 
                min={min} max={max} step={step}
                value={value} 
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="absolute w-full h-1 bg-slate-700 rounded-full appearance-none cursor-pointer z-10 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
            />
             <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-white rounded-full pointer-events-none" style={{ width: `${((value - min) / (max - min)) * 100}%` }}></div>
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-medium px-0.5">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#0B0F19] text-slate-200 font-sans z-50 flex flex-col">
       
       {/* Top Navigation Bar */}
       <div className="h-14 border-b border-slate-800/60 bg-[#0B0F19] flex items-center justify-between px-4 shrink-0">
           <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Back to Dashboard"
              >
                  <ArrowLeft size={18} />
              </button>
              <div className="h-6 w-[1px] bg-slate-800"></div>
              <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-slate-300">Text to Speech</span>
                 <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">Multi-lingual</span>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 gap-2">
                 <input 
                   type="password"
                   value={apiKey}
                   onChange={(e) => setApiKey(e.target.value)}
                   className="bg-transparent text-xs text-slate-300 outline-none w-32 placeholder:text-slate-600"
                   placeholder="API Key..."
                 />
                 <button onClick={handleApiKeySave} className="text-slate-500 hover:text-white">
                    <Check size={14} />
                 </button>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white border-2 border-[#0B0F19] outline outline-1 outline-slate-800">
                  MR
              </div>
           </div>
       </div>

       {/* Main Layout */}
       <div className="flex flex-1 overflow-hidden">
           
           {/* Left Column: Editor */}
           <div className="flex-1 flex flex-col relative bg-[#0B0F19]">
                {/* Editor Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-12 flex flex-col items-center justify-center min-h-0">
                     <div className="w-full max-w-3xl relative">
                        <textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            className="w-full bg-transparent border-none text-white text-lg md:text-xl leading-relaxed resize-none outline-none text-center placeholder:text-slate-700 min-h-[200px]"
                            placeholder="Type something here to generate speech..."
                            spellCheck={false}
                        />
                        {/* Fake Grammarly Icon */}
                        <div className="absolute bottom-2 right-0 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                            <div className="w-6 h-6 rounded-full bg-[#15C39A] text-white flex items-center justify-center text-xs font-bold border-2 border-[#0B0F19]">G</div>
                        </div>
                     </div>
                </div>

                {/* Bottom Bar */}
                <div className="h-20 border-t border-slate-800/40 bg-[#0B0F19] flex items-center justify-between px-8 shrink-0">
                    <div className="flex items-center gap-6 text-xs font-medium text-slate-500">
                        {/* Placeholder Credits */}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                            9,479 credits remaining
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-medium">
                            {text.length} / 5,000 characters
                        </span>
                        
                        <div className="h-8 w-[1px] bg-slate-800 mx-2"></div>

                        <button className="p-2.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                            <Download size={18} />
                        </button>

                        <button 
                            onClick={handleGenerate}
                            disabled={generating || !text || !apiKey}
                            className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all flex items-center gap-2 ${
                                generating 
                                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                                : 'bg-white text-black hover:bg-slate-200'
                            }`}
                        >
                            {generating ? <Loader2 size={16} className="animate-spin" /> : null}
                            {generating ? 'Generating...' : 'Generate speech'}
                        </button>
                    </div>
                </div>
           </div>

           {/* Right Column: Sidebar */}
           <div className="w-[360px] border-l border-slate-800/60 bg-[#0F131F] flex flex-col shrink-0">
               
               {/* Tabs */}
               <div className="flex border-b border-slate-800/60">
                   <button 
                     onClick={() => setActiveTab('settings')}
                     className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings' ? 'text-white border-white' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                   >
                     Settings
                   </button>
                   <button 
                     onClick={() => setActiveTab('history')}
                     className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'text-white border-white' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                   >
                     History
                   </button>
               </div>

               {/* Tab Content */}
               <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
                   
                   {activeTab === 'settings' && (
                       <>
                       {/* Voice Selector */}
                       <div className="space-y-2">
                           <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Voice</label>
                           <div className="relative" ref={voiceDropdownRef}>
                               <button 
                                 onClick={() => !loading && setShowVoiceDropdown(!showVoiceDropdown)}
                                 className="w-full bg-[#181E2E] hover:bg-[#1E2536] border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-colors text-left group"
                               >
                                   <div className="flex items-center gap-3 overflow-hidden">
                                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 shrink-0"></div>
                                       <div className="truncate">
                                           <div className="text-sm font-medium text-white truncate">
                                                {getSelectedVoice()?.name || (loading ? "Loading..." : "Select Voice")}
                                           </div>
                                           <div className="text-[11px] text-slate-500 truncate">
                                                {getSelectedVoice()?.labels?.accent || 'American'} • {getSelectedVoice()?.labels?.description || 'Deep, Narration'}
                                           </div>
                                       </div>
                                   </div>
                                   <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                               </button>

                               {showVoiceDropdown && (
                                   <div className="absolute top-full left-0 w-full mt-2 bg-[#181E2E] border border-slate-700 rounded-xl shadow-2xl z-20 max-h-80 overflow-y-auto custom-scrollbar p-1">
                                       <div className="sticky top-0 bg-[#181E2E] p-2 border-b border-slate-700/50 mb-1">
                                            <div className="relative">
                                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                                <input type="text" placeholder="Search voices..." className="w-full bg-[#0F131F] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 border border-slate-700 outline-none focus:border-slate-500" />
                                            </div>
                                       </div>
                                       {voices.map(voice => (
                                           <button 
                                                key={voice.voice_id}
                                                onClick={() => { setSelectedVoiceId(voice.voice_id); setShowVoiceDropdown(false); }}
                                                className={`w-full text-left p-2 rounded-lg flex items-center gap-3 hover:bg-[#252D40] transition-colors ${selectedVoiceId === voice.voice_id ? 'bg-[#252D40]' : ''}`}
                                           >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 shrink-0 opacity-80"></div>
                                                <div className="truncate flex-1">
                                                    <div className="text-sm text-slate-200">{voice.name}</div>
                                                    <div className="text-[10px] text-slate-500">{voice.labels?.accent || 'American'} • {voice.category || 'generated'}</div>
                                                </div>
                                                {selectedVoiceId === voice.voice_id && <Check size={14} className="text-white" />}
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>
                       </div>

                       {/* Model Selector */}
                       <div className="space-y-2">
                           <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Model</label>
                           <div className="relative" ref={modelDropdownRef}>
                               <button 
                                 onClick={() => !loading && setShowModelDropdown(!showModelDropdown)}
                                 className="w-full bg-[#181E2E] hover:bg-[#1E2536] border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-colors text-left group"
                               >
                                   <div>
                                       <div className="flex items-center gap-2">
                                           <div className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">V2</div>
                                           <span className="text-sm font-medium text-white">{getSelectedModel()?.name || 'Eleven Multilingual v2'}</span>
                                       </div>
                                       <div className="text-[11px] text-slate-500 mt-0.5 ml-9">
                                           {getSelectedModel()?.description || 'Best for lifelike speech'}
                                       </div>
                                   </div>
                                   <ChevronDown size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                               </button>
                               
                               {showModelDropdown && (
                                   <div className="absolute top-full left-0 w-full mt-2 bg-[#181E2E] border border-slate-700 rounded-xl shadow-2xl z-20 overflow-hidden p-1">
                                       {models.map(model => (
                                           <button 
                                                key={model.model_id}
                                                onClick={() => { setSelectedModelId(model.model_id); setShowModelDropdown(false); }}
                                                className={`w-full text-left p-2.5 rounded-lg flex flex-col hover:bg-[#252D40] transition-colors ${selectedModelId === model.model_id ? 'bg-[#252D40]' : ''}`}
                                           >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-slate-200 font-medium">{model.name}</span>
                                                    {selectedModelId === model.model_id && <Check size={14} className="text-white" />}
                                                </div>
                                                <span className="text-[10px] text-slate-500">{model.description}</span>
                                           </button>
                                       ))}
                                   </div>
                               )}
                           </div>
                           <div className="w-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-0.5 mt-2 cursor-pointer opacity-90 hover:opacity-100">
                               <div className="bg-[#0F131F] rounded-md px-3 py-2 flex items-center justify-between">
                                   <span className="text-xs font-medium text-white">The most expressive Text to Speech</span>
                                   <span className="text-[10px] font-bold bg-white text-black px-2 py-0.5 rounded-full">Try v3 (alpha)</span>
                               </div>
                           </div>
                       </div>

                       {/* Sliders Area */}
                       <div className="pt-2 space-y-6">
                           <Slider 
                                label="Speed" 
                                value={1.0} // Placeholder, need service update to support speed properly
                                min={0.5} max={2.0} 
                                onChange={() => {}} 
                                leftLabel="Slower" 
                                rightLabel="Faster" 
                           />
                           
                           <Slider 
                                label="Stability" 
                                value={stability} 
                                min={0} max={1} 
                                onChange={setStability} 
                                leftLabel="More variable" 
                                rightLabel="More stable" 
                           />

                           <Slider 
                                label="Similarity" 
                                value={similarity} 
                                min={0} max={1} 
                                onChange={setSimilarity} 
                                leftLabel="Low" 
                                rightLabel="High" 
                           />

                           <Slider 
                                label="Style Exaggeration" 
                                value={style} 
                                min={0} max={1} 
                                onChange={setStyle} 
                                leftLabel="None" 
                                rightLabel="Exaggerated" 
                           />
                           
                           {/* Toggles */}
                           <div className="flex items-center justify-between pt-2">
                               <label className="text-[13px] font-medium text-slate-300">Speaker boost</label>
                               <button 
                                 onClick={() => setSpeakerBoost(!speakerBoost)}
                                 className={`w-10 h-5 rounded-full relative transition-colors ${speakerBoost ? 'bg-white' : 'bg-slate-700'}`}
                               >
                                   <div className={`absolute top-1 w-3 h-3 rounded-full transition-all shadow-sm ${speakerBoost ? 'right-1 bg-black' : 'left-1 bg-slate-400'}`}></div>
                               </button>
                           </div>
                           
                           <div className="flex items-center justify-end gap-2 pt-2 cursor-pointer hover:text-white text-slate-500 transition-colors">
                               <RotateCcw size={12} />
                               <span className="text-[11px] font-medium">Reset values</span>
                           </div>
                       </div>
                       </>
                   )}

                   {activeTab === 'history' && (
                       <div className="space-y-4">
                           {/* History Search */}
                           <div className="relative">
                               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                               <input 
                                 type="text" 
                                 placeholder="Search history..." 
                                 className="w-full bg-[#181E2E] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-300 outline-none focus:border-slate-600"
                               />
                               <LayoutList size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-white" />
                           </div>
                           
                           {/* Filter Chips */}
                           <div className="flex gap-2">
                               <button className="px-3 py-1 bg-[#181E2E] border border-slate-800 rounded-full text-[10px] text-slate-400 hover:text-white hover:border-slate-600 transition-colors">+ Voice</button>
                               <button className="px-3 py-1 bg-[#181E2E] border border-slate-800 rounded-full text-[10px] text-slate-400 hover:text-white hover:border-slate-600 transition-colors">+ Model</button>
                               <button className="px-3 py-1 bg-[#181E2E] border border-slate-800 rounded-full text-[10px] text-slate-400 hover:text-white hover:border-slate-600 transition-colors">+ Date</button>
                           </div>

                           <div className="flex items-center justify-center my-4">
                               <span className="px-3 py-1 bg-[#181E2E] rounded-full text-[10px] font-bold text-slate-500">Yesterday</span>
                           </div>

                           {/* History Items */}
                           <div className="space-y-4">
                                {history.length === 0 ? (
                                    <div className="text-center py-10 text-slate-600 text-xs italic">
                                        No history found. Generate something!
                                    </div>
                                ) : (
                                    history.map(item => (
                                        <div key={item.id} className="group">
                                            <div className="text-[13px] text-slate-200 font-medium line-clamp-2 leading-relaxed mb-2">
                                                {item.text}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400"></div>
                                                    <span>{item.voiceName}</span>
                                                </div>
                                                <span>•</span>
                                                <span>{item.createdAt}</span>
                                            </div>
                                            <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181E2E] hover:bg-white hover:text-black rounded-full text-[11px] font-medium text-slate-300 transition-colors">
                                                    <Play size={10} /> Play
                                                </button>
                                                <a href={item.url} download className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181E2E] hover:bg-white hover:text-black rounded-full text-[11px] font-medium text-slate-300 transition-colors">
                                                    <Download size={10} />
                                                </a>
                                            </div>
                                        </div>
                                    ))
                                )}
                           </div>
                       </div>
                   )}

               </div>
           </div>
       </div>

       {/* Error Toast */}
       {error && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 text-sm font-medium z-50 animate-fade-in">
                <AlertCircle size={18} />
                {error}
                <button onClick={() => setError(null)} className="ml-2 opacity-80 hover:opacity-100">✕</button>
            </div>
       )}
    </div>
  );
};