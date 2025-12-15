import React, { useState, useRef } from 'react';
import { Song } from '../types';
import { searchSongAI } from '../services/geminiService';
import { Loader2, Sparkles, Save, X, Globe } from 'lucide-react';

interface SongFormProps {
  initialSong?: Song;
  onSave: (song: Song) => void;
  onCancel: () => void;
}

const SongForm: React.FC<SongFormProps> = ({ initialSong, onSave, onCancel }) => {
  const [title, setTitle] = useState(initialSong?.title || '');
  const [artist, setArtist] = useState(initialSong?.artist || '');
  const [bpm, setBpm] = useState(initialSong?.bpm?.toString() || '');
  const [key, setKey] = useState(initialSong?.originalKey || 'C');
  const [content, setContent] = useState(initialSong?.content || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleAiSearch = async () => {
    if (!title) return;
    setIsAiLoading(true);
    setAiError(null);
    setSources([]);
    try {
      const searchStr = artist ? `${title} by ${artist}` : title;
      const result = await searchSongAI(searchStr);
      
      if (result && result.songData) {
        const { songData, sources } = result;
        setTitle(songData.title || title);
        setArtist(songData.artist || artist);
        setKey(songData.originalKey || 'C');
        setBpm(songData.bpm || '0');
        setContent(songData.content || '');
        setSources(sources);
      } else {
        setAiError("Could not find song details. Try adding 'chords' to the title.");
      }
    } catch (e) {
      setAiError("Failed to fetch song. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newSong: Song = {
      id: initialSong?.id || crypto.randomUUID(),
      title,
      artist,
      bpm: parseInt(bpm) || 0,
      originalKey: key,
      content,
      tags: [],
      createdAt: initialSong?.createdAt || Date.now(),
    };
    onSave(newSong);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{initialSong ? 'Edit Song' : 'Add New Song'}</h2>
        <button type="button" onClick={onCancel} className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={24} />
        </button>
      </div>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Song Title</label>
          <input
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Way Maker"
          />
        </div>
        {!initialSong && (
             <button
             type="button"
             onClick={handleAiSearch}
             disabled={isAiLoading || !title}
             className="bg-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 font-medium transition-all mb-[1px]"
           >
             {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
             Auto-Fill
           </button>
        )}
      </div>

      {aiError && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100">
              {aiError}
          </div>
      )}

      {sources.length > 0 && (
          <div className="bg-blue-50 dark:bg-slate-800 p-4 rounded-xl text-sm border border-blue-100 dark:border-slate-700">
              <p className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2"><Globe size={14}/> Sources found:</p>
              <ul className="space-y-1">
                  {sources.map((source, idx) => (
                      <li key={idx} className="truncate">
                          <a href={source.uri} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2">
                              {source.title || source.uri}
                          </a>
                      </li>
                  ))}
              </ul>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Artist</label>
            <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Artist Name"
            />
        </div>
        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Original Key</label>
            <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g. G"
            />
        </div>
        <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">BPM</label>
            <input
                type="number"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                value={bpm}
                onChange={(e) => setBpm(e.target.value)}
                placeholder="120"
            />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                Content
            </label>
            <span className="text-xs text-slate-400">Supported: Chords over Lyrics or [Bracket] style</span>
        </div>
        
        <textarea
            ref={textareaRef}
            required
            className="w-full h-96 p-4 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"[Verse 1]\n   C        G\nAmazing Grace\n\nOR\n\n[G]Amazing [C]Grace"}
        />
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">
          Cancel
        </button>
        <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 font-bold transition-all">
          <Save size={18} />
          Save Song
        </button>
      </div>
    </form>
  );
};

export default SongForm;