import React, { useState, useEffect, useRef } from 'react';
import { Song } from '../types';
import ChordRenderer from '../components/ChordRenderer';
import { ChevronLeft, ChevronRight, X, Minus, Plus, Music, MousePointer2, ArrowRight } from 'lucide-react';
import { transposeChord, transposeSongContent } from '../utils/chordUtils';

interface LiveSessionProps {
  songs: Song[];
  initialIndex?: number;
  onExit: () => void;
  onSongUpdate: (song: Song) => void;
}

const LiveSession: React.FC<LiveSessionProps> = ({ songs, initialIndex = 0, onExit, onSongUpdate }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  // Capo: Visual shift downwards (e.g. Capo 2 means we see chords 2 semitones lower)
  const [capo, setCapo] = useState(0);
  const [fontSize, setFontSize] = useState<'base' | 'lg' | 'xl'>('lg');
  const [showControls, setShowControls] = useState(true);
  const [simplify, setSimplify] = useState(false);
  
  // Auto Scroll
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 = off
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollAccumulator = useRef(0);

  // Touch Handling
  const touchStartX = useRef<number | null>(null);

  const currentSong = songs[currentIndex];
  const nextSong = songs[currentIndex + 1];

  // Auto Scroll Logic with Accumulator for slow speeds
  useEffect(() => {
    if (autoScrollSpeed > 0) {
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          // Speed logic: 1 is slow, 5 is fast.
          // Pixels per tick. Tick is 20ms (50fps)
          const speedMultiplier = 0.5;
          scrollAccumulator.current += autoScrollSpeed * speedMultiplier;
          
          if (scrollAccumulator.current >= 1) {
              const pixels = Math.floor(scrollAccumulator.current);
              scrollContainerRef.current.scrollTop += pixels;
              scrollAccumulator.current -= pixels;
          }
        }
      }, 20);
    } else {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      scrollAccumulator.current = 0;
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    };
  }, [autoScrollSpeed]);

  const handleNext = () => {
    if (currentIndex < songs.length - 1) {
        setCurrentIndex(p => p + 1);
        setCapo(0); // Reset capo
        setAutoScrollSpeed(0); // Stop scrolling
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
        setCurrentIndex(p => p - 1);
        setCapo(0);
        setAutoScrollSpeed(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleTransposePermanent = (semitones: number) => {
      if (!currentSong) return;
      const newContent = transposeSongContent(currentSong.content, semitones);
      const newKey = transposeChord(currentSong.originalKey, semitones);
      
      onSongUpdate({
          ...currentSong,
          content: newContent,
          originalKey: newKey
      });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - endX;

    // Swipe Threshold
    if (Math.abs(diff) > 75) {
      if (diff > 0) {
        // Swipe Left -> Next
        handleNext();
      } else {
        // Swipe Right -> Prev
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') onExit();
  };

  useEffect(() => {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (!currentSong) return <div className="p-8 text-center text-slate-500 dark:text-slate-400">No songs selected for live session.</div>;

  // Calculate Visuals
  // Sounding Key = stored key
  const soundingKey = currentSong.originalKey;
  // Display Key = Sounding Key - Capo (Visual transpose value)
  const displayKey = transposeChord(currentSong.originalKey, -capo);

  return (
    <div 
        className="fixed inset-0 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 z-50 flex flex-col h-screen overflow-hidden transition-colors duration-300"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
      {/* Top Bar - Sticky */}
      <div 
        className={`flex flex-col border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 z-20 ${!showControls ? '-translate-y-full absolute w-full opacity-0 pointer-events-none' : 'translate-y-0 relative opacity-100'}`}
      >
          <div className="flex items-center justify-between p-3 md:p-4">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 shrink-0"><X size={24} /></button>
                <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                        <h1 className="text-lg md:text-xl font-bold leading-tight text-slate-900 dark:text-white truncate">{currentSong.title}</h1>
                        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap hidden sm:inline-block">({currentIndex + 1} of {songs.length})</span>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium truncate">
                        {currentSong.artist} • {currentSong.bpm} BPM
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {/* Capo Control */}
                 <div className="hidden md:flex flex-col items-center bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1">
                     <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold">Capo</span>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setCapo(c => Math.max(0, c - 1))} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30" disabled={capo === 0}><Minus size={14}/></button>
                        <span className={`font-bold w-4 text-center ${capo > 0 ? 'text-accent' : 'text-slate-300 dark:text-slate-600'}`}>{capo}</span>
                        <button onClick={() => setCapo(c => Math.min(11, c + 1))} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><Plus size={14}/></button>
                     </div>
                 </div>

                {/* Permanent Transpose Controls */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => handleTransposePermanent(-1)} 
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm transition-all text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                        title="Lower Key (Permanent)"
                    >
                        <Minus size={16} />
                    </button>
                    
                    <div className="px-3 flex flex-col items-center justify-center min-w-[3.5rem]">
                        <div className="font-black text-primary text-xl leading-none">{soundingKey}</div>
                        {capo > 0 ? (
                            <div className="flex items-center gap-1 mt-0.5 animate-in fade-in zoom-in">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Play</span>
                                <span className="text-xs font-bold text-accent bg-accent/10 px-1 rounded">{displayKey}</span>
                            </div>
                        ) : (
                             <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">Key</span>
                        )}
                    </div>

                    <button 
                        onClick={() => handleTransposePermanent(1)} 
                        className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded shadow-sm transition-all text-slate-600 dark:text-slate-400 dark:hover:text-slate-200"
                        title="Raise Key (Permanent)"
                    >
                        <Plus size={16} />
                    </button>
                </div>
                
                {/* Simplify Toggle Switch */}
                <button 
                    onClick={() => setSimplify(!simplify)}
                    className="flex flex-col items-center justify-center px-2"
                    title="Toggle Simplified Chords"
                >
                    <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 mb-0.5">Simplify</span>
                    <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${simplify ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${simplify ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </button>

                {/* Font Controls - Mobile Hidden */}
                <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                    <button onClick={() => setFontSize('base')} className={`px-2 py-1 rounded ${fontSize === 'base' ? 'bg-white dark:bg-slate-700 shadow-sm dark:text-white' : 'hover:text-slate-900 dark:hover:text-slate-200'}`}>A</button>
                    <button onClick={() => setFontSize('lg')} className={`px-2 py-1 rounded ${fontSize === 'lg' ? 'bg-white dark:bg-slate-700 shadow-sm dark:text-white' : 'hover:text-slate-900 dark:hover:text-slate-200'}`}>A+</button>
                    <button onClick={() => setFontSize('xl')} className={`px-2 py-1 rounded ${fontSize === 'xl' ? 'bg-white dark:bg-slate-700 shadow-sm dark:text-white' : 'hover:text-slate-900 dark:hover:text-slate-200'}`}>A++</button>
                </div>
            </div>
          </div>
      </div>

      {/* Main Content - Scrollable */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 md:max-w-5xl md:mx-auto w-full pb-48 scroll-smooth" 
        onClick={() => setShowControls(prev => !prev)}
      >
        <div className="sm:hidden mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
             <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl font-black leading-tight text-slate-900 dark:text-white mb-1">{currentSong.title}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">{currentSong.artist}</p>
                 </div>
                 <div className="text-right">
                     <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full">{currentIndex + 1}/{songs.length}</span>
                 </div>
             </div>
             {capo > 0 && (
                <div className="mt-3 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Capo {capo}</span>
                    <ArrowRight size={14} className="text-slate-300 dark:text-slate-600"/>
                    <span className="text-sm font-black text-accent">Play {displayKey}</span>
                </div>
             )}
        </div>

        {/* Note: transpose prop is now visually just -capo because the content itself is permanently transposed */}
        <ChordRenderer content={currentSong.content} transpose={-capo} fontSize={fontSize} simplify={simplify} />
      </div>

      {/* Floating Controls Overlay */}
      <div className={`absolute bottom-6 left-0 right-0 px-4 md:px-8 pointer-events-none transition-opacity duration-300 z-50 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
         <div className="flex items-end justify-between max-w-5xl mx-auto">
             
            {/* Left: Prev Control */}
            <div className="pointer-events-auto">
                {currentIndex > 0 && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 p-4 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700 transform transition-all active:scale-95 flex items-center gap-2 self-start"
                     >
                        <ChevronLeft size={24} />
                        <span className="hidden md:inline font-medium">Prev</span>
                     </button>
                )}
            </div>

            {/* Right: Scroll, Next */}
            <div className="pointer-events-auto flex flex-col items-end gap-3">
                 {/* Auto Scroll Widget */}
                 <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg flex flex-col gap-2 items-end mb-2">
                     <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
                        <MousePointer2 size={10} /> Auto Scroll
                     </div>
                     <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                        {[
                            { label: 'Off', val: 0 },
                            { label: 'Slow', val: 0.5 },
                            { label: 'Med', val: 2 },
                            { label: 'Fast', val: 4 }
                        ].map(opt => (
                            <button
                                key={opt.label}
                                onClick={() => setAutoScrollSpeed(opt.val)}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    autoScrollSpeed === opt.val 
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5 dark:text-white' 
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                     </div>
                 </div>

                 {nextSong && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleNext(); }}
                        className="group flex items-center gap-3 bg-primary text-white pl-4 pr-3 py-2.5 rounded-full shadow-lg hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all"
                    >
                        <div className="flex flex-col items-start mr-1">
                            <span className="text-[10px] uppercase font-bold text-blue-100 leading-none mb-0.5">Next Up</span>
                            <span className="text-sm font-bold max-w-[120px] md:max-w-[200px] truncate leading-tight">{nextSong.title}</span>
                        </div>
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <ChevronRight size={18} />
                        </div>
                    </button>
                 )}
                 
                 {!nextSong && currentIndex < songs.length - 1 && (
                     // Fallback for when there is no next song loaded but index is less
                     <button 
                         onClick={(e) => { e.stopPropagation(); handleNext(); }}
                         className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-blue-600"
                     >
                         <ChevronRight size={24} />
                     </button>
                 )}
            </div>
         </div>
      </div>
    </div>
  );
};

export default LiveSession;