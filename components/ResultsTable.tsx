import React, { useState } from 'react';
import { VideoData, ScrapeMode, VideoType } from '../types';
import { ExternalLink, Clock, Eye, FileText, Download, CheckCircle, XCircle, Loader2, FileWarning, ThumbsUp, MessageSquare, Tag, Hash, TrendingUp, Trophy, Calendar, Copy, Check, BarChart, Save, Ban, RefreshCw } from 'lucide-react';
import { parseDurationToSeconds } from '../services/youtubeService';

interface ResultsTableProps {
  data: VideoData[];
  mode: ScrapeMode;
  videoType: VideoType;
  onCancelVideo?: (id: string) => void;
  onRetryVideo?: (id: string) => void;
  isLoading?: boolean;
}

// Helper: Copy Button Component
const CopyButton: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all border shadow-sm z-10 ${
        copied 
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
          : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white hover:border-slate-600'
      } ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

// Helper to calculate exact days ago
const getDaysDiff = (dateString: string): number => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// Format large numbers (e.g. 1.2M)
const formatNumber = (numStr?: string) => {
  if(!numStr) return '0';
  const num = parseInt(numStr);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
};

// Format standard numbers with commas
const formatStandard = (numStr?: string) => {
    if(!numStr) return '0';
    return parseInt(numStr).toLocaleString();
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data, mode, videoType, onCancelVideo, onRetryVideo, isLoading }) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filename, setFilename] = useState('');

  const generateDefaultFilename = () => {
    const sanitize = (str: string) => str.replace(/[^a-z0-9\s-_]/gi, '').trim().replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().slice(0, 10);
    let name = `export_${dateStr}.csv`;

    if (mode === 'single-channel' && data.length > 0) {
      const channelName = sanitize(data[0].channelTitle || 'Channel');
      name = `${channelName}_scraped_${dateStr}.csv`;
    } else if (mode.includes('analyze')) {
        name = `analysis_report_${dateStr}.csv`;
    }
    return name;
  };

  const handleExportClick = () => {
      if (data.length === 0) return;
      setFilename(generateDefaultFilename());
      setIsModalOpen(true);
  };

  const executeDownload = () => {
    // Define Headers based on mode
    let headers = [
      "Serial Number",
      "Video Title",
      "Video Link",
      "View Count",
      "Like Count",
      "Comment Count",
      "Age (Days)",
      "Duration (Seconds)",
      "Virality Score",
      "Tags",
      "Description"
    ];

    if (mode === 'single-video' || mode === 'multi-channel' || mode === 'single-channel') {
        // Simplify for transcript modes
        headers = ["Serial Number", "Title", "Link", "Views", "Age (Days)", "Duration (Sec)", "Transcript"];
    }

    // Map data to rows
    const rows = data.map((video, index) => {
      const daysAge = getDaysDiff(video.publishedAt);
      const durationSeconds = parseDurationToSeconds(video.duration);
      
      if (mode === 'analyze-single' || mode === 'analyze-multi') {
        return [
            index + 1,
            `"${video.title.replace(/"/g, '""')}"`,
            video.url,
            video.viewCount,
            video.likeCount || '0',
            video.commentCount || '0',
            daysAge,
            durationSeconds,
            video.viralityScore?.toFixed(2) || '0',
            `"${(video.tags || []).join(', ')}"`,
            `"${(video.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
        ];
      }

      return [
        index + 1,
        `"${video.title.replace(/"/g, '""')}"`, // Escape double quotes
        video.url,
        video.viewCount,
        daysAge,
        durationSeconds,
        `"${video.transcript || ''}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Use user provided filename or fallback
    const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;

    // Create a Blob and download with BOM for UTF-8 support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setIsModalOpen(false);
  };

  if (data.length === 0) return null;

  // --- SINGLE VIDEO ANALYSIS VIEW ---
  if (mode === 'analyze-single' && data.length > 0) {
      const video = data[0];
      const daysAge = getDaysDiff(video.publishedAt);
      
      return (
        <div className="w-full mt-8 animate-fade-in pb-12 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                    <TrendingUp className="text-indigo-400" />
                    Deep Analysis Report
                </h2>
                <button onClick={handleExportClick} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors border border-slate-700 text-slate-300">
                    Download Report
                </button>
            </div>

            {/* Top Card: Main Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 lg:col-span-2 bg-slate-900/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                     
                     <div className="flex gap-5 relative z-10">
                        <img src={video.thumbnail} className="w-32 h-32 sm:w-48 sm:h-auto object-cover rounded-xl shadow-lg border border-slate-700/50" alt="Thumb" />
                        <div className="flex flex-col justify-between py-1">
                            <div>
                                <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight mb-2">{video.title}</h3>
                                <p className="text-indigo-400 font-medium flex items-center gap-2">
                                    {video.channelTitle}
                                    <ExternalLink size={14} className="cursor-pointer hover:text-white" onClick={() => window.open(video.url, '_blank')} />
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4">
                                <div className="bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                                    <Calendar size={14} /> {new Date(video.publishedAt).toLocaleDateString()}
                                </div>
                                <div className="bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                                    <Clock size={14} /> {daysAge} days old
                                </div>
                                <div className="bg-slate-950/50 px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                                    <BarChart size={14} /> Duration: {video.duration.replace('PT','').replace('H','h ').replace('M','m ').replace('S','s')}
                                </div>
                            </div>
                        </div>
                     </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                        <Eye size={24} className="text-blue-400 mb-2" />
                        <div className="text-2xl font-black text-white">{formatNumber(video.viewCount)}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Views</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                        <ThumbsUp size={24} className="text-emerald-400 mb-2" />
                        <div className="text-2xl font-black text-white">{formatNumber(video.likeCount)}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Likes</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                        <MessageSquare size={24} className="text-violet-400 mb-2" />
                        <div className="text-2xl font-black text-white">{formatNumber(video.commentCount)}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Comments</div>
                    </div>
                    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                        <TrendingUp size={24} className="text-amber-400 mb-2 relative z-10" />
                        <div className="text-2xl font-black text-white relative z-10">{(parseInt(video.viewCount) / (daysAge || 1)).toFixed(0)}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold tracking-wider relative z-10">Views/Day</div>
                    </div>
                </div>
            </div>

            {/* Description and Tags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-lg h-96 flex flex-col relative">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} /> Description
                        </h4>
                        <CopyButton text={video.description || ''} />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar text-sm text-slate-300 whitespace-pre-wrap leading-relaxed pr-2">
                        {video.description || "No description provided."}
                    </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 shadow-lg h-96 flex flex-col">
                     <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Tag size={16} /> Video Tags
                        </h4>
                        <CopyButton text={(video.tags || []).join(', ')} />
                     </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex flex-wrap gap-2">
                            {video.tags && video.tags.length > 0 ? (
                                video.tags.map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-slate-800/80 text-slate-300 text-xs rounded-full border border-slate-700 flex items-center gap-1">
                                        <Hash size={10} className="text-indigo-500" /> {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-slate-500 italic">No tags found.</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

             {/* Save As Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Save size={18} className="text-emerald-500" /> Save Report As
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 block mb-1.5">Filename</label>
                                <input 
                                    type="text" 
                                    value={filename}
                                    onChange={(e) => setFilename(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setIsModalOpen(false)} className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors">Cancel</button>
                                <button onClick={executeDownload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20">Download CSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- MULTI VIDEO RANKING VIEW ---
  const isAnalysisMode = mode === 'analyze-multi';

  return (
    <>
    <div className="w-full mt-8 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            {isAnalysisMode ? <Trophy className="text-amber-400 w-6 h-6" /> : <FileText className="text-indigo-400 w-6 h-6" />}
          </div>
          {isAnalysisMode ? "Ranked Performance Analysis" : "MujahidRakib Data"} 
          <span className="text-base font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {data.length} items
          </span>
        </h2>
        
        <button 
          onClick={handleExportClick}
          className="group flex items-center gap-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 hover:border-emerald-500/40 px-6 py-2.5 rounded-xl transition-all duration-300 cursor-pointer shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/30 hover:scale-105 active:scale-95"
        >
          <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
          <span className="font-semibold text-sm">Export CSV</span>
        </button>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-slate-700/60 shadow-2xl bg-slate-900/60 backdrop-blur-md">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider font-semibold backdrop-blur-sm">
              <tr>
                <th className="p-4 border-b border-slate-700 w-16 text-center">{isAnalysisMode ? "Rank" : "#"}</th>
                <th className="p-4 border-b border-slate-700 min-w-[300px]">Video Details</th>
                <th className="p-4 border-b border-slate-700 w-32">Views</th>
                
                {isAnalysisMode && <th className="p-4 border-b border-slate-700 w-32">Views/Day</th>}
                {isAnalysisMode && <th className="p-4 border-b border-slate-700 w-32">Likes</th>}
                {isAnalysisMode && <th className="p-4 border-b border-slate-700 w-32">Comments</th>}
                
                <th className="p-4 border-b border-slate-700 w-32">Age</th>
                
                <th className="p-4 border-b border-slate-700 w-64 text-center">
                    {isAnalysisMode ? "Virality Score" : "Transcript"}
                </th>
              </tr>
            </thead>
            <tbody className="text-slate-300 text-sm divide-y divide-slate-800/60">
              {data.map((video, index) => {
                const transcript = video.transcript || '';
                const isCancelled = transcript === 'Cancelled';
                const isPending = transcript === '' && !isCancelled;
                
                // Safe string conversion before checking startsWith to prevent TypeError
                const transcriptStr = String(transcript || '');
                const isError = transcriptStr.startsWith("Error") || transcriptStr.startsWith("API Error") || transcriptStr.startsWith("Request Failed");
                
                const daysAge = getDaysDiff(video.publishedAt);
                const viewsPerDay = (parseInt(video.viewCount) / Math.max(1, daysAge)).toFixed(0);

                // Content Logic for Last Column
                let displayContent;
                if (isAnalysisMode) {
                    // Show Virality Score
                    displayContent = (
                        <div className="flex flex-col items-center">
                            <div className="text-lg font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                                {video.viralityScore?.toFixed(0) || '0'}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Points</div>
                        </div>
                    )
                } else {
                    // Show Transcript Status
                    if (isPending) {
                        displayContent = (
                            <div className="flex items-center gap-2 justify-center">
                                <div className="flex items-center gap-2 text-amber-500 text-xs font-medium bg-amber-500/5 px-2 py-1 rounded-full border border-amber-500/10">
                                    <Loader2 size={12} className="animate-spin" /> Pending...
                                </div>
                                {onCancelVideo && (
                                    <button 
                                        onClick={() => onCancelVideo(video.id)}
                                        className="p-1 rounded-full bg-slate-800/50 hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/30"
                                        title="Cancel Transcription"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    } else if (isCancelled) {
                         displayContent = (
                             <div className="flex items-center justify-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wide bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-700/50 w-fit mx-auto">
                                <Ban size={12} /> Cancelled
                             </div>
                         );
                    } else if (isError) {
                        displayContent = (
                            <div className="flex items-center justify-center gap-2">
                                <div className="relative group/cell w-full max-w-[150px]">
                                    <div className="flex items-start gap-2 text-red-400 text-xs bg-red-500/5 px-2 py-1 rounded-md border border-red-500/10 pr-6">
                                        <FileWarning size={14} className="shrink-0 mt-0.5" />
                                        <span className="break-words line-clamp-2 text-left" title={transcript}>{transcript}</span>
                                    </div>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/cell:opacity-100 transition-opacity z-20">
                                        <CopyButton text={transcript} className="bg-slate-900 shadow-md" />
                                    </div>
                                </div>
                                
                                {onRetryVideo && (
                                    <button 
                                        onClick={() => onRetryVideo(video.id)}
                                        disabled={isLoading}
                                        className={`p-1.5 rounded-lg border transition-all ${isLoading ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 'bg-slate-800/50 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 border-slate-700 hover:border-indigo-500/50'}`}
                                        title={isLoading ? "Please wait for current batch" : "Retry Transcription"}
                                    >
                                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                                    </button>
                                )}
                            </div>
                        );
                    } else {
                        // Success case
                        displayContent = (
                            <div className="relative group/cell flex flex-col gap-2">
                                <div className="text-slate-400 text-xs line-clamp-3 leading-relaxed italic bg-slate-950/30 p-2 rounded border border-slate-800/50 relative">
                                    "{transcript}"
                                    <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                        <CopyButton text={transcript} className="bg-slate-900/90 shadow-md scale-90" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-bold uppercase tracking-wide mx-auto">
                                    <CheckCircle size={10} /> Transcribed
                                </div>
                            </div>
                        );
                    }
                }

                return (
                  <tr key={video.id} className={`hover:bg-slate-800/40 transition-colors group duration-300 ${isAnalysisMode && index === 0 ? 'bg-amber-500/5 border-l-2 border-amber-500' : ''} ${isCancelled ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <td className="p-4 text-center font-mono text-slate-500 group-hover:text-slate-400">
                      {isAnalysisMode && index === 0 ? <Trophy size={18} className="text-amber-500 mx-auto" /> : (index + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="relative shrink-0 overflow-hidden rounded-lg border border-slate-700/50 w-32 aspect-video group-hover:border-indigo-500/40 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] transition-all duration-300">
                          <img 
                            src={video.thumbnail} 
                            alt="thumb" 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-medium text-base text-slate-200 hover:text-indigo-400 transition-colors line-clamp-2 leading-snug cursor-pointer group-hover:translate-x-1 duration-300"
                            title={video.title}
                          >
                            {video.title}
                          </a>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                             <span className="font-medium text-slate-400 group-hover:text-slate-300 transition-colors">{video.channelTitle}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 font-medium text-slate-200 bg-slate-800/30 py-1.5 px-3 rounded-lg border border-slate-700/30 w-fit">
                        <Eye size={14} className="text-emerald-500" />
                        {formatNumber(video.viewCount)}
                      </div>
                    </td>
                    
                    {isAnalysisMode && (
                        <>
                        <td className="p-4 text-slate-300">
                             <div className="flex items-center gap-2">
                                <TrendingUp size={14} className="text-amber-500" /> {formatStandard(viewsPerDay)}
                            </div>
                        </td>
                        <td className="p-4 text-slate-300">
                            <div className="flex items-center gap-2">
                                <ThumbsUp size={14} className="text-blue-500" /> {formatNumber(video.likeCount)}
                            </div>
                        </td>
                        <td className="p-4 text-slate-300">
                             <div className="flex items-center gap-2">
                                <MessageSquare size={14} className="text-violet-500" /> {formatNumber(video.commentCount)}
                            </div>
                        </td>
                        </>
                    )}

                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} />
                        {daysAge} days
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center">
                       {displayContent}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    {/* Save As Modal for Main Table */}
    {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            <div className="relative bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Save size={18} className="text-emerald-500" /> Save Report As
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400 block mb-1.5">Filename</label>
                        <input 
                            type="text" 
                            value={filename}
                            onChange={(e) => setFilename(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setIsModalOpen(false)} className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors">Cancel</button>
                        <button onClick={executeDownload} className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-900/20">Download CSV</button>
                    </div>
                </div>
            </div>
        </div>
    )}
    </>
  );
};