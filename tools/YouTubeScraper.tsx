import React, { useState, useEffect, useRef } from 'react';
import { ApiKeyManager } from '../components/ApiKeyManager';
import { UsageStats } from '../components/UsageStats';
import { ResultsTable } from '../components/ResultsTable';
import { VideoData, ScrapeMode, VideoType, TranscriptProvider } from '../types';
import { fetchChannelVideos, fetchBatchVideos, extractVideoId, fetchTranscript } from '../services/youtubeService';
import { Terminal, Search, Film, Layers, FileText, Activity, Loader2, Link2, Minus, Plus, AlertCircle, ChevronUp, ChevronDown, CheckCircle, ArrowLeft, TrendingUp, Sparkles } from 'lucide-react';

interface YouTubeScraperProps {
  onBack: () => void;
  toolType: 'transcript' | 'analysis';
}

export const YouTubeScraper: React.FC<YouTubeScraperProps> = ({ onBack, toolType }) => {
  // --- THEME CONFIGURATION ---
  const isTranscript = toolType === 'transcript';
  
  // Explicitly define classes to ensure Tailwind detects them (no dynamic string construction)
  const theme = isTranscript ? {
      name: 'Indigo',
      // UI Component Classes
      activeTab: 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]',
      activeTypeBtn: 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50',
      mainBtn: 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-indigo-500/20 hover:shadow-indigo-600/40',
      secondaryBtn: 'border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10',
      
      // Accents & Utilities
      gradient: 'from-indigo-600 to-violet-600',
      shadow: 'shadow-indigo-500/20',
      bgGlow: 'bg-indigo-500/20',
      borderFocus: 'focus:border-indigo-500',
      ringFocus: 'focus:ring-indigo-500',
      text: 'text-indigo-400',
      textLight: 'text-indigo-300',
      bgLight: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
      containerHover: 'hover:border-indigo-500/30',
      icon: <FileText className="w-6 h-6 text-white" />
  } : {
      name: 'Emerald',
      // UI Component Classes
      activeTab: 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-[1.02]',
      activeTypeBtn: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50',
      mainBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-600/40',
      secondaryBtn: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10',

      // Accents & Utilities
      gradient: 'from-emerald-600 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      bgGlow: 'bg-emerald-500/20',
      borderFocus: 'focus:border-emerald-500',
      ringFocus: 'focus:ring-emerald-500',
      text: 'text-emerald-400',
      textLight: 'text-emerald-300',
      bgLight: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      containerHover: 'hover:border-emerald-500/30',
      icon: <TrendingUp className="w-6 h-6 text-white" />
  };

  // State
  const [youtubeApiKey, setYoutubeApiKey] = useState<string>('');
  const [rapidApiKey, setRapidApiKey] = useState<string>('');
  const [supadataApiKey, setSupadataApiKey] = useState<string>('');
  const [transcriptProvider, setTranscriptProvider] = useState<TranscriptProvider>('supadata');
  
  // Usage Tracking State
  const [supadataUsage, setSupadataUsage] = useState<number>(0);
  const [rapidApiUsage, setRapidApiUsage] = useState<number>(0);

  // Default mode depends on toolType
  const [mode, setMode] = useState<ScrapeMode>(isTranscript ? 'single-video' : 'analyze-single');
  const [input, setInput] = useState<string>('');
  const [videoType, setVideoType] = useState<VideoType>('video');
  const [limit, setLimit] = useState<number>(5);
  const [results, setResults] = useState<VideoData[]>([]);
  
  // Loading & Progress State
  const [loading, setLoading] = useState<boolean>(false);
  const [isProcessComplete, setIsProcessComplete] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState<boolean>(false);
  
  // Refs
  const logsEndRef = useRef<HTMLDivElement>(null);
  const consoleContainerRef = useRef<HTMLDivElement>(null);
  const cancelledIdsRef = useRef<Set<string>>(new Set());

  // Load Keys
  useEffect(() => {
    const storedYtKey = localStorage.getItem('youtube_api_key');
    const storedRapidKey = localStorage.getItem('rapid_api_key');
    const storedSupadataKey = localStorage.getItem('supadata_api_key');
    const storedProvider = localStorage.getItem('transcript_provider');
    const storedSupadataUsage = localStorage.getItem('supadata_usage');
    const storedRapidUsage = localStorage.getItem('rapid_usage');
    
    if (storedYtKey) setYoutubeApiKey(storedYtKey);
    if (storedRapidKey) setRapidApiKey(storedRapidKey);
    if (storedSupadataKey) setSupadataApiKey(storedSupadataKey);
    if (storedProvider === 'rapid-api' || storedProvider === 'supadata') {
        setTranscriptProvider(storedProvider as TranscriptProvider);
    }
    if (storedSupadataUsage) setSupadataUsage(parseInt(storedSupadataUsage));
    if (storedRapidUsage) setRapidApiUsage(parseInt(storedRapidUsage));
  }, []);

  // Reset state when toolType changes
  useEffect(() => {
      setInput('');
      setResults([]);
      setLogs([]);
      setProgress(0);
      setError(null);
      setIsProcessComplete(false);
      setMode(isTranscript ? 'single-video' : 'analyze-single');
  }, [toolType, isTranscript]);

  // Key Handlers
  const handleYoutubeKeyChange = (key: string) => {
    setYoutubeApiKey(key);
    localStorage.setItem('youtube_api_key', key);
  };
  const handleRapidKeyChange = (key: string) => {
    setRapidApiKey(key);
    localStorage.setItem('rapid_api_key', key);
  };
  const handleSupadataKeyChange = (key: string) => {
    setSupadataApiKey(key);
    localStorage.setItem('supadata_api_key', key);
  };
  const handleProviderChange = (provider: TranscriptProvider) => {
      setTranscriptProvider(provider);
      localStorage.setItem('transcript_provider', provider);
  };
  const handleSupadataUsageChange = (val: number) => {
      setSupadataUsage(val);
      localStorage.setItem('supadata_usage', val.toString());
  };
  const handleRapidUsageChange = (val: number) => {
      setRapidApiUsage(val);
      localStorage.setItem('rapid_usage', val.toString());
  };

  // Console Logic
  useEffect(() => {
    if (logsEndRef.current && isConsoleOpen) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isConsoleOpen]);

  const toggleConsole = () => setIsConsoleOpen(prev => !prev);
  const addLog = (message: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);

  // Actions
  const handleCancelVideo = (videoId: string) => {
    cancelledIdsRef.current.add(videoId);
    setResults(prev => prev.map(v => v.id === videoId ? { ...v, transcript: 'Cancelled' } : v));
    addLog(`Cancelled transcription for video ID: ${videoId}`);
  };

  const handleRetryVideo = async (videoId: string) => {
    if (loading) return; 
    const videoIndex = results.findIndex(v => v.id === videoId);
    if (videoIndex === -1) return;
    const videoToRetry = results[videoIndex];
    const currentApiKey = transcriptProvider === 'rapid-api' ? rapidApiKey : supadataApiKey;
    const tempResults = [...results];
    tempResults[videoIndex] = { ...videoToRetry, transcript: '' }; 
    setResults(tempResults);

    try {
        let transcript = await fetchTranscript(videoId, transcriptProvider, currentApiKey);
        if (!transcript.startsWith("Error") && !transcript.startsWith("API Error") && !transcript.startsWith("Request Failed")) {
             let currentUsageCount = transcriptProvider === 'supadata' ? supadataUsage : rapidApiUsage;
             currentUsageCount++;
             if (transcriptProvider === 'supadata') handleSupadataUsageChange(Math.min(100, currentUsageCount));
             else handleRapidUsageChange(Math.min(20, currentUsageCount));
        }
        setResults(prev => prev.map(v => v.id === videoId ? { ...v, transcript } : v));
    } catch (err: any) {
        setResults(prev => prev.map(v => v.id === videoId ? { ...v, transcript: `Error: ${err.message}` } : v));
    }
  };

  const switchMode = (newMode: ScrapeMode) => {
      setMode(newMode);
      setInput('');
      setError(null);
      setResults([]);
      setProgress(0);
      setLogs([]);
      setIsProcessComplete(false);
  };

  const handleStartAgain = () => setIsProcessComplete(false);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeApiKey) {
      setError("Please enter a YouTube Data API Key in the settings.");
      return;
    }
    if (!input.trim()) {
      setError("Please provide the required input.");
      return;
    }

    if (isTranscript) {
        if (transcriptProvider === 'rapid-api' && !rapidApiKey) {
            setError("Please enter a RapidAPI Key in settings to use the RapidAPI service.");
            return;
        }
        if (transcriptProvider === 'supadata' && !supadataApiKey) {
            setError("Please enter a Supadata API Key in settings to use the Supadata service.");
            return;
        }
        if (transcriptProvider === 'supadata' && supadataUsage >= 100) {
            setError("Supadata usage limit (100) reached. Reset count in settings or upgrade.");
            return;
        }
        if (transcriptProvider === 'rapid-api' && rapidApiUsage >= 20) {
            setError("RapidAPI usage limit (20) reached. Reset count in settings or upgrade.");
            return;
        }
    }

    setLoading(true);
    setIsProcessComplete(false);
    setError(null);
    setResults([]);
    setLogs([]);
    setProgress(5);
    setIsConsoleOpen(true);
    cancelledIdsRef.current.clear();
    
    addLog("Starting process...");

    try {
      let metadataVideos: VideoData[] = [];
      addLog("PHASE 1: Fetching Video Metadata...");
      
      const onMetadataProgress = (msg: string) => {
        addLog(msg);
        const maxMetadataProgress = (mode.includes('analyze')) ? 50 : 10;
        setProgress(prev => Math.min(prev + 5, maxMetadataProgress));
      };

      if (mode === 'single-channel') {
        addLog(`Mode: Single Channel. Target: ${input}`);
        setProgress(5);
        metadataVideos = await fetchChannelVideos(input, limit, videoType, youtubeApiKey, onMetadataProgress);
      } else if (mode === 'multi-channel' || mode === 'analyze-multi') {
        addLog("Mode: Batch processing.");
        const urls = input.split(/[\n,]+/).map(u => u.trim()).filter(u => u.length > 0);
        if (urls.length === 0) throw new Error("No URLs provided.");
        addLog(`Found ${urls.length} raw input lines.`);
        setProgress(5);
        metadataVideos = await fetchBatchVideos(urls, youtubeApiKey, onMetadataProgress);
      } else if (mode === 'single-video' || mode === 'analyze-single') {
        addLog("Mode: Single Video.");
        const id = extractVideoId(input);
        if (!id) throw new Error("Invalid Video URL format.");
        addLog(`Video ID extracted: ${id}`);
        setProgress(5);
        metadataVideos = await fetchBatchVideos([input], youtubeApiKey, (msg) => addLog(msg));
      }

      if (metadataVideos.length === 0) throw new Error("No videos found matching your criteria.");

      if (mode === 'analyze-multi' || mode === 'analyze-single') {
         addLog("Analyzing video metrics...");
         const now = new Date();
         metadataVideos = metadataVideos.map(video => {
            const published = new Date(video.publishedAt);
            const hoursAge = Math.max(1, (now.getTime() - published.getTime()) / (1000 * 60 * 60));
            const views = parseInt(video.viewCount) || 0;
            const likes = parseInt(video.likeCount || '0') || 0;
            const comments = parseInt(video.commentCount || '0') || 0;
            const engagementWeight = (likes * 5) + (comments * 10);
            const rawScore = (views + engagementWeight) / hoursAge;
            return { ...video, viralityScore: rawScore };
         });
         metadataVideos.sort((a, b) => (b.viralityScore || 0) - (a.viralityScore || 0));
         addLog("Analysis complete. Videos ranked by viral potential.");
      }

      addLog(`Data acquired for ${metadataVideos.length} videos.`);
      setResults(metadataVideos);

      if (isTranscript) {
          setProgress(10);
          const currentApiKey = transcriptProvider === 'rapid-api' ? rapidApiKey : supadataApiKey;
          let currentUsageCount = transcriptProvider === 'supadata' ? supadataUsage : rapidApiUsage;
          const updatedVideos = [...metadataVideos];

          for (let i = 0; i < updatedVideos.length; i++) {
            const video = updatedVideos[i];
            const itemLabel = `Video ${i + 1}/${updatedVideos.length}`;

            if (cancelledIdsRef.current.has(video.id)) {
                updatedVideos[i] = { ...video, transcript: 'Cancelled' };
                setResults([...updatedVideos]); 
                addLog(`${itemLabel}: Skipped (Cancelled)`);
                setProgress(10 + Math.floor(((i + 1) / updatedVideos.length) * 90));
                continue;
            }

            addLog(`${itemLabel}: Fetching transcript...`);
            await new Promise(r => setTimeout(r, 500));
            let transcript = await fetchTranscript(video.id, transcriptProvider, currentApiKey);
            if (typeof transcript !== 'string') transcript = String(transcript || '');
            
            if (cancelledIdsRef.current.has(video.id)) {
                updatedVideos[i] = { ...video, transcript: 'Cancelled' };
                setResults([...updatedVideos]); 
                addLog(`${itemLabel}: Result discarded (Cancelled)`);
                setProgress(10 + Math.floor(((i + 1) / updatedVideos.length) * 90));
                continue;
            }

            const isError = transcript.startsWith("Error") || transcript.startsWith("API Error") || transcript.startsWith("Request Failed");
            if (isError) {
              addLog(`${itemLabel}: Failed - ${transcript.replace(/^Error:\s*/, '')}`);
            } else {
              addLog(`${itemLabel}: Success`);
              currentUsageCount++;
              if (transcriptProvider === 'supadata') handleSupadataUsageChange(Math.min(100, currentUsageCount));
              else handleRapidUsageChange(Math.min(20, currentUsageCount));
            }

            updatedVideos[i] = { ...video, transcript: transcript };
            setResults([...updatedVideos]);
            setProgress(10 + Math.floor(((i + 1) / updatedVideos.length) * 90));
          }
      } else {
          setProgress(100);
      }

      addLog(`Success! Process complete.`);
      setIsProcessComplete(true);
      setIsConsoleOpen(false);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      addLog(`ERROR: ${err.message}`);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) setLimit(Math.min(50, Math.max(1, val)));
    else setLimit(1);
  };
  const incrementLimit = () => setLimit(prev => Math.min(50, prev + 1));
  const decrementLimit = () => setLimit(prev => Math.max(1, prev - 1));
  const linkCount = (mode === 'multi-channel' || mode === 'analyze-multi') ? input.split(/[\n,]+/).filter(line => line.trim().length > 0).length : 0;
  
  const getTabClass = (targetMode: ScrapeMode) => {
      const isActive = mode === targetMode;
      const activeStyles = theme.activeTab;
      const inactiveStyles = 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800';

      return `flex items-center justify-center gap-3 p-3 md:p-4 rounded-2xl border transition-all duration-300 cursor-pointer group w-full ${isActive ? activeStyles : inactiveStyles}`;
  };

  const isInputValid = input.trim().length > 0;
  const successful = results.filter(r => r.transcript && !r.transcript.startsWith("Error") && !r.transcript.startsWith("API Error") && r.transcript !== "Cancelled").length;
  const failedVideos = results.filter(r => r.transcript && (r.transcript.startsWith("Error") || r.transcript.startsWith("API Error")));
  const failed = failedVideos.length;

  return (
    <div className="w-full animate-fade-in">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/40">
           {/* Left: Branding */}
           <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white transition-all"
                title="Back to Dashboard"
              >
                  <ArrowLeft size={20} />
              </button>
              <div className="flex items-center gap-3 select-none">
                  <div className={`p-2.5 rounded-2xl shadow-lg bg-gradient-to-br ${theme.gradient} ${theme.shadow}`}>
                      {theme.icon}
                  </div>
                  <div>
                      <h1 className="text-xl font-bold text-white leading-none">YouTube {isTranscript ? 'Transcriptor' : 'Analytics'}</h1>
                      <span className={`text-xs font-medium ${theme.text} tracking-wide`}>{isTranscript ? 'Extract Data & Transcripts' : 'Deep Metrics & Ranking'}</span>
                  </div>
              </div>
           </div>
           
           {/* Right: Usage & Config */}
           <div className="flex items-center gap-3">
              <ApiKeyManager 
                youtubeApiKey={youtubeApiKey} 
                setYoutubeApiKey={handleYoutubeKeyChange}
                rapidApiKey={rapidApiKey}
                setRapidApiKey={handleRapidKeyChange}
                supadataApiKey={supadataApiKey}
                setSupadataApiKey={handleSupadataKeyChange}
                transcriptProvider={transcriptProvider}
                setTranscriptProvider={handleProviderChange}
                supadataUsage={supadataUsage}
                setSupadataUsage={handleSupadataUsageChange}
                rapidApiUsage={rapidApiUsage}
                setRapidApiUsage={handleRapidUsageChange}
              />
           </div>
        </div>

        {/* Control Panel */}
        <div className={`backdrop-blur-xl bg-slate-900/60 border border-slate-700/50 rounded-[2rem] p-6 md:p-10 shadow-2xl relative overflow-hidden ring-1 ring-white/5 mb-8 ${theme.containerHover} transition-colors duration-500`}>
          {/* Theme Lighting Effects */}
          <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgLight} to-transparent pointer-events-none opacity-50`} />
          <div className={`absolute -right-20 -top-20 w-80 h-80 ${theme.bgGlow} blur-3xl rounded-full pointer-events-none`} />
          <div className={`absolute -left-20 -bottom-20 w-60 h-60 ${theme.bgGlow} blur-3xl rounded-full pointer-events-none`} />

          {!loading && !isProcessComplete && (
          <div className="mb-8 relative z-10 animate-fade-in">
              {isTranscript && (
                  <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={() => switchMode('single-video')} className={getTabClass('single-video')}>
                      <div className={`p-2 rounded-lg ${mode === 'single-video' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                        <Search size={18} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">Single Video</div>
                        <div className="text-[10px] opacity-75">Get transcript</div>
                      </div>
                    </button>
                    <button onClick={() => switchMode('multi-channel')} className={getTabClass('multi-channel')}>
                       <div className={`p-2 rounded-lg ${mode === 'multi-channel' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                         <Film size={18} />
                       </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">Batch Links</div>
                        <div className="text-[10px] opacity-75">Bulk transcript</div>
                      </div>
                    </button>
                    <button onClick={() => switchMode('single-channel')} className={getTabClass('single-channel')}>
                      <div className={`p-2 rounded-lg ${mode === 'single-channel' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                        <Layers size={18} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-sm">Channel Scraper</div>
                        <div className="text-[10px] opacity-75">Top videos</div>
                      </div>
                    </button>
                  </div>
                  <div className="max-w-4xl mx-auto px-1">
                     <UsageStats 
                        usage={transcriptProvider === 'supadata' ? supadataUsage : rapidApiUsage}
                        provider={transcriptProvider}
                     />
                  </div>
                  </>
              )}

              {!isTranscript && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
                        <button onClick={() => switchMode('analyze-single')} className={getTabClass('analyze-single')}>
                            <div className={`p-2 rounded-lg ${mode === 'analyze-single' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                                <Activity size={18} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-sm">Single Video Analyzer</div>
                                <div className="text-[10px] opacity-75">Deep dive metrics & tags</div>
                            </div>
                        </button>
                        <button onClick={() => switchMode('analyze-multi')} className={getTabClass('analyze-multi')}>
                            <div className={`p-2 rounded-lg ${mode === 'analyze-multi' ? 'bg-white/20' : 'bg-slate-700/50 group-hover:bg-slate-700'}`}>
                                <Layers size={18} />
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-sm">Multi-Video Ranker</div>
                                <div className="text-[10px] opacity-75">Rank by viral potential</div>
                            </div>
                        </button>
                   </div>
              )}
          </div>
          )}

          {!isProcessComplete ? (
            <form onSubmit={handleScrape} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-semibold text-slate-300 ml-1">
                    {mode === 'single-channel' && "Channel URL or Handle (e.g. @MrBeast)"}
                    {(mode === 'multi-channel' || mode === 'analyze-multi') && "Paste Video URLs (one per line)"}
                    {(mode === 'single-video' || mode === 'analyze-single') && "YouTube Video URL"}
                  </label>
                  {(mode === 'multi-channel' || mode === 'analyze-multi') && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.bgLight} border ${theme.border} text-xs font-medium ${theme.text}`}>
                      <Link2 size={12} />
                      <span>{linkCount} Links Detected</span>
                    </div>
                  )}
                </div>
                {(mode === 'multi-channel' || mode === 'analyze-multi') ? (
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://youtube.com/shorts/...\nhttps://youtube.com/watch?v=..."
                    className={`w-full h-32 bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 text-slate-200 focus:ring-2 ${theme.ringFocus} ${theme.borderFocus} outline-none transition-all resize-y font-mono text-sm placeholder:text-slate-600 shadow-inner custom-scrollbar`}
                    required
                  />
                ) : (
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={mode === 'single-channel' ? "https://youtube.com/@handle" : "https://youtube.com/watch?v=..."}
                    className={`w-full bg-slate-950/50 border border-slate-700/80 rounded-2xl p-4 text-slate-200 focus:ring-2 ${theme.ringFocus} ${theme.borderFocus} outline-none transition-all placeholder:text-slate-600 shadow-inner`}
                    required
                  />
                )}
              </div>
              {mode === 'single-channel' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-400">Content Type</label>
                    <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800/80 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setVideoType('video')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${videoType === 'video' ? theme.activeTypeBtn : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                      >
                        Long Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setVideoType('short')}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${videoType === 'short' ? theme.activeTypeBtn : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                      >
                        Shorts
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-400">Quantity (Max 50)</label>
                    <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-hidden h-[46px] w-full shadow-inner">
                      <button 
                        type="button"
                        onClick={decrementLimit}
                        className="h-full w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer border-r border-slate-800"
                      >
                        <Minus size={18} />
                      </button>
                      <input
                        type="number"
                        value={limit}
                        onChange={handleLimitChange}
                        className="flex-1 bg-transparent text-center font-mono text-lg text-slate-200 font-bold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button 
                        type="button"
                        onClick={incrementLimit}
                        className="h-full w-14 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition-colors cursor-pointer border-l border-slate-800"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-shake shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                  <AlertCircle size={20} className="shrink-0" />
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !isInputValid}
                className={`w-full py-5 rounded-2xl font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer group relative overflow-hidden ${
                  loading || !isInputValid
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : `${theme.mainBtn} text-white hover:scale-[1.01] active:scale-[0.99]`
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" /> Processing Data...
                  </>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-2">
                        <Sparkles size={18} />
                        {isTranscript ? "Start Transcript" : "Start Analysis"}
                    </span>
                    <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                  </>
                )}
              </button>
            </form>
          ) : (
             <div className="animate-fade-in relative z-10 space-y-8">
                 <div className="text-center space-y-4">
                     <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                         <CheckCircle className="w-8 h-8 text-emerald-500" />
                     </div>
                     <h2 className="text-2xl font-bold text-white">
                         {isTranscript ? 'Transcribing Complete' : 'Analysis Complete'}
                     </h2>
                     {isTranscript && (
                         <div className="flex justify-center gap-8 text-sm">
                             <div className="flex flex-col items-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 min-w-[100px]">
                                 <span className="text-2xl font-bold text-emerald-400">{successful}</span>
                                 <span className="text-slate-500 font-medium">Successful</span>
                             </div>
                             <div className="flex flex-col items-center p-3 bg-red-500/5 rounded-xl border border-red-500/10 min-w-[100px]">
                                 <span className="text-2xl font-bold text-red-400">{failed}</span>
                                 <span className="text-slate-500 font-medium">Failed</span>
                             </div>
                         </div>
                     )}
                 </div>

                 {failed > 0 && isTranscript && (
                     <div className="bg-slate-950/50 rounded-xl border border-red-900/20 overflow-hidden">
                         <div className="bg-red-900/10 px-4 py-2 border-b border-red-900/20 flex items-center gap-2">
                             <AlertCircle size={14} className="text-red-400" />
                             <span className="text-xs font-bold text-red-300 uppercase tracking-wide">Failed Items</span>
                         </div>
                         <div className="max-h-60 overflow-y-auto custom-scrollbar">
                             <table className="w-full text-left text-xs">
                                 <thead className="bg-slate-900 text-slate-500 font-medium sticky top-0">
                                     <tr>
                                         <th className="p-3 w-16 text-center">#</th>
                                         <th className="p-3">Video URL</th>
                                         <th className="p-3">Error Message</th>
                                     </tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-800/50 text-slate-300">
                                     {failedVideos.map((video, idx) => (
                                         <tr key={video.id} className="hover:bg-slate-800/30">
                                             <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                                             <td className="p-3 truncate max-w-[200px] text-blue-400 hover:underline">
                                                 <a href={video.url} target="_blank" rel="noreferrer">{video.url}</a>
                                             </td>
                                             <td className="p-3 text-red-400">{video.transcript}</td>
                                         </tr>
                                     ))}
                                 </tbody>
                             </table>
                         </div>
                     </div>
                 )}

                 <button
                    onClick={handleStartAgain}
                    className={`w-full py-4 rounded-2xl font-bold text-lg border bg-transparent transition-all flex items-center justify-center gap-2 ${theme.secondaryBtn}`}
                 >
                    <ArrowLeft size={18} /> Start Again / New Batch
                 </button>
             </div>
          )}

          {(loading || logs.length > 0) && (
            <div ref={consoleContainerRef} className="mt-10 border-t border-slate-800/60 pt-8 animate-fade-in scroll-mt-6">
              <div 
                onClick={toggleConsole}
                className="group cursor-pointer"
              >
                 <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span className={`flex items-center gap-2 ${theme.text}`}>
                      <Terminal size={14} />
                      Live Process Console
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-slate-200 transition-colors">
                      {isConsoleOpen ? 'Hide Logs' : 'Show Logs'}
                      {isConsoleOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                 </div>
                 <div className="h-4 w-full bg-slate-950/50 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                   <div 
                      className={`h-full bg-gradient-to-r ${theme.gradient} transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]`}
                      style={{ width: `${progress}%` }}
                   ></div>
                 </div>
              </div>
              {isConsoleOpen && (
                <div className="mt-5 p-5 bg-black/40 rounded-xl border border-slate-800/50 font-mono text-xs text-slate-300 h-56 overflow-y-auto shadow-inner custom-scrollbar backdrop-blur-sm">
                  {logs.length === 0 && <span className="text-slate-600 opacity-50 italic">Waiting for process start...</span>}
                  {logs.map((log, idx) => (
                    <div key={idx} className="mb-1.5 border-b border-white/5 pb-1 last:border-0 last:pb-0 flex">
                      <span className={`mr-3 w-20 shrink-0 opacity-60 ${theme.text}`}>{log.split(']')[0]}]</span>
                      <span className={`${log.toLowerCase().includes('failed') || log.toLowerCase().includes('error') ? 'text-red-400 font-semibold' : log.toLowerCase().includes('success') ? 'text-emerald-400 font-medium' : 'text-slate-300'}`}>
                        {log.split(']')[1]}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}
        </div>
        <ResultsTable 
            data={results} 
            mode={mode} 
            videoType={videoType} 
            onCancelVideo={handleCancelVideo}
            onRetryVideo={handleRetryVideo}
            isLoading={loading}
        />
    </div>
  );
};