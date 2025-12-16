import React, { useState, useRef } from 'react';
import { Song } from '../types';
import { Save, X } from 'lucide-react';

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

  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      </div>

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