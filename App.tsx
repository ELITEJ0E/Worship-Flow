import React, { useState, useEffect } from 'react';
import { Song, Setlist, User } from './types';
import { getSongs, saveSong, deleteSong, getSetlists, saveSetlist, deleteSetlist } from './services/storageService';
import { getCurrentUser, logoutUser } from './services/authService';
import SongForm from './components/SongForm';
import LiveSession from './pages/LiveSession';
import AuthForm from './components/AuthForm';
import { 
    Library, 
    ListMusic, 
    Plus, 
    Search, 
    PlayCircle, 
    Edit2, 
    Trash2, 
    Music2, 
    Menu,
    X,
    LayoutList,
    Moon,
    Sun,
    Calendar,
    LogOut,
    UserCircle,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
    Filter
} from 'lucide-react';

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Simple Modal Component for creating setlists
const CreateSetlistModal = ({ onClose, onSave }: { onClose: () => void, onSave: (name: string) => void }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">New Setlist</h3>
                <input 
                    autoFocus
                    type="text" 
                    placeholder="Setlist Name (e.g. Sunday Service)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 mb-6 focus:ring-2 focus:ring-primary outline-none dark:text-white"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if(e.key === 'Enter' && name) onSave(name); }}
                />
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
                    <button 
                        onClick={() => { if(name) onSave(name); }}
                        disabled={!name}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-bold transition-colors"
                    >
                        Create
                    </button>
                </div>
            </div>
        </div>
    );
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [view, setView] = useState<'library' | 'editor' | 'live' | 'setlists'>('library');
  
  // State for Editor
  const [editingSong, setEditingSong] = useState<Song | undefined>(undefined);

  // State for Live Mode
  const [liveQueue, setLiveQueue] = useState<Song[]>([]);
  const [liveStartIndex, setLiveStartIndex] = useState(0);

  // State for UI
  const [searchTerm, setSearchTerm] = useState('');
  const [setlistSearchTerm, setSetlistSearchTerm] = useState(''); // New state for setlist search
  const [sortOption, setSortOption] = useState<'title' | 'artist' | 'date'>('date');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Modals
  const [showSetlistModal, setShowSetlistModal] = useState(false);

  // Initialize
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
        setUser(currentUser);
        setSongs(getSongs(currentUser.id));
        setSetlists(getSetlists(currentUser.id));
    }
    
    // Check system preference for dark mode
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
    }
  }, []);

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [darkMode]);

  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setSongs(getSongs(loggedInUser.id));
      setSetlists(getSetlists(loggedInUser.id));
      setView('library');
  };

  const handleLogout = () => {
      logoutUser();
      setUser(null);
      setSongs([]);
      setSetlists([]);
  };

  // Actions
  const handleSaveSong = (song: Song) => {
    if (!user) return;
    saveSong(user.id, song);
    setSongs(getSongs(user.id));
    // Check if we need to update the live queue if currently active (though view changes usually)
    setLiveQueue(prev => prev.map(s => s.id === song.id ? song : s));
    
    if (view === 'editor') {
        setView('library');
        setEditingSong(undefined);
    }
  };

  const handleUpdateSong = (song: Song) => {
      if (!user) return;
      saveSong(user.id, song);
      setSongs(getSongs(user.id));
      // Also update live queue in place to reflect changes immediately without reloading view
      setLiveQueue(prev => prev.map(s => s.id === song.id ? song : s));
  }

  const handleDeleteSong = (id: string) => {
    if (!user) return;
    if (confirm("Delete this song?")) {
        deleteSong(user.id, id);
        setSongs(getSongs(user.id));
    }
  };

  const handleCreateSetlist = (name: string) => {
      if (!user) return;
      const newSet: Setlist = {
          id: generateId(),
          name,
          date: Date.now(),
          songIds: []
      };
      saveSetlist(user.id, newSet);
      setSetlists(getSetlists(user.id));
      setShowSetlistModal(false);
  };

  const handleAddToSetlist = (songId: string, setlistId: string) => {
      if (!user) return;
      const setlist = setlists.find(s => s.id === setlistId);
      if (setlist && !setlist.songIds.includes(songId)) {
          const updated = { ...setlist, songIds: [...setlist.songIds, songId] };
          saveSetlist(user.id, updated);
          setSetlists(getSetlists(user.id));
          alert(`Added to ${setlist.name}`);
      }
  };

  const handleReorderSetlist = (setlist: Setlist, index: number, direction: 'up' | 'down') => {
      if (!user) return;
      const newIds = [...setlist.songIds];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (swapIndex >= 0 && swapIndex < newIds.length) {
          [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
          saveSetlist(user.id, { ...setlist, songIds: newIds });
          setSetlists(getSetlists(user.id));
      }
  };

  const startLiveMode = (songQueue: Song[], index = 0) => {
      setLiveQueue(songQueue);
      setLiveStartIndex(index);
      setView('live');
  };

  const filteredSongs = songs
    .filter(s => 
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
        if (sortOption === 'title') return a.title.localeCompare(b.title);
        if (sortOption === 'artist') return a.artist.localeCompare(b.artist);
        // Date: Newest first
        return b.createdAt - a.createdAt;
    });

  // --- RENDERERS ---

  if (!user) {
      return <AuthForm onLogin={handleLogin} />;
  }

  if (view === 'live') {
      return (
        <LiveSession 
            songs={liveQueue} 
            initialIndex={liveStartIndex} 
            onExit={() => setView('library')} 
            onSongUpdate={handleUpdateSong}
        />
      );
  }

  if (view === 'editor') {
      return (
          <div className="min-h-screen bg-surface dark:bg-slate-900 p-4">
              <SongForm 
                initialSong={editingSong} 
                onSave={handleSaveSong} 
                onCancel={() => { setView('library'); setEditingSong(undefined); }} 
              />
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row transition-colors duration-300">
        {/* Modals */}
        {showSetlistModal && (
            <CreateSetlistModal 
                onClose={() => setShowSetlistModal(false)} 
                onSave={handleCreateSetlist} 
            />
        )}

        {/* Sidebar Navigation */}
        <aside className={`fixed md:relative z-20 w-64 bg-white dark:bg-slate-900 h-full shadow-2xl md:shadow-none border-r dark:border-slate-800 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-200 flex flex-col`}>
            <div className="p-6 border-b dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                    <Music2 className="text-primary" /> WorshipFlow
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden"><X /></button>
            </div>
            
            <div className="p-4 flex items-center gap-3 bg-blue-50 dark:bg-slate-800 mx-4 mt-4 rounded-xl border border-blue-100 dark:border-slate-700">
                <div className="bg-primary text-white p-2 rounded-full">
                    <UserCircle size={20} />
                </div>
                <div className="overflow-hidden">
                    <p className="font-bold text-sm truncate text-slate-700 dark:text-slate-200">{user.username}</p>
                    <p className="text-xs text-primary font-medium">Musician</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                <button 
                    onClick={() => { setView('library'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'library' ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                    <Library size={20} /> Library
                </button>
                <button 
                    onClick={() => { setView('setlists'); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${view === 'setlists' ? 'bg-primary text-white shadow-lg shadow-blue-500/30' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                >
                    <LayoutList size={20} /> Setlists
                </button>
            </nav>

            <div className="p-4 border-t dark:border-slate-800 space-y-2">
                <button 
                    onClick={() => setDarkMode(!darkMode)}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                >
                    {darkMode ? <><Sun size={18}/> Light Mode</> : <><Moon size={18}/> Dark Mode</>}
                </button>
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium text-sm"
                >
                    <LogOut size={18} /> Log Out
                </button>
            </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-hidden flex flex-col bg-surface dark:bg-slate-950">
            {/* Header */}
            <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b dark:border-slate-800 flex items-center px-4 justify-between md:px-8 z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2"><Menu /></button>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                        {view === 'library' ? 'Song Library' : 'Setlists'}
                    </h2>
                </div>

                {view === 'library' && (
                     <div className="flex items-center gap-3">
                         <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2 border border-slate-200 dark:border-slate-700">
                            <span className="text-xs font-bold uppercase text-slate-400 px-2 flex gap-1"><ArrowUpDown size={12}/> Sort</span>
                            <select 
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as any)}
                                className="bg-transparent text-sm font-medium text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
                            >
                                <option value="date">Newest</option>
                                <option value="title">Title (A-Z)</option>
                                <option value="artist">Artist (A-Z)</option>
                            </select>
                         </div>
                         <div className="relative hidden md:block">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                             <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-10 pr-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-primary outline-none w-64 transition-all shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                             />
                         </div>
                         <button 
                            onClick={() => { setEditingSong(undefined); setView('editor'); }}
                            className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md font-medium"
                        >
                            <Plus size={18} /> <span className="hidden md:inline">Add Song</span>
                         </button>
                     </div>
                )}
                 {view === 'setlists' && (
                     <button 
                        onClick={() => setShowSetlistModal(true)}
                        className="bg-primary hover:bg-blue-700 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-md font-medium"
                    >
                        <Plus size={18} /> New Setlist
                    </button>
                 )}
            </header>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
                
                {view === 'library' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSongs.length === 0 && (
                            <div className="col-span-full text-center py-20">
                                <div className="bg-slate-100 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Music2 className="text-slate-400" size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No songs found</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Get started by adding a new song manually or use our smart search to find lyrics and chords instantly.</p>
                            </div>
                        )}

                        {filteredSongs.map(song => (
                            <div key={song.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group flex flex-col relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="p-6 flex-1 cursor-pointer" onClick={() => startLiveMode(filteredSongs, filteredSongs.indexOf(song))}>
                                    <h3 className="font-bold text-xl mb-1 text-slate-800 dark:text-white group-hover:text-primary transition-colors">{song.title}</h3>
                                    <p className="text-slate-500 font-medium mb-4">{song.artist}</p>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">Key: {song.originalKey}</span>
                                        <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">{song.bpm} BPM</span>
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex gap-1">
                                         <button 
                                            onClick={() => { setEditingSong(song); setView('editor'); }}
                                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition-colors hover:shadow-sm"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(setlists.length === 0) alert("Create a setlist first!");
                                                else {
                                                    const text = "Select Setlist Number:\n" + setlists.map((s,i) => `${i+1}. ${s.name}`).join("\n");
                                                    // Use Timeout to prevent blocking logic issues in some views
                                                    setTimeout(() => {
                                                        const choice = prompt(text);
                                                        if(choice && setlists[parseInt(choice)-1]) {
                                                            handleAddToSetlist(song.id, setlists[parseInt(choice)-1].id);
                                                        }
                                                    }, 50);
                                                }
                                            }}
                                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition-colors hover:shadow-sm"
                                            title="Add to Setlist"
                                        >
                                            <ListMusic size={16} />
                                        </button>
                                    </div>
                                     <button 
                                        onClick={() => handleDeleteSong(song.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'setlists' && (
                    <div className="space-y-8 max-w-5xl mx-auto">
                        {setlists.length === 0 && (
                            <div className="text-center py-20">
                                <div className="bg-slate-100 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LayoutList className="text-slate-400" size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No setlists created</h3>
                                <p className="text-slate-500">Create a setlist to organize your songs for a service or performance.</p>
                            </div>
                        )}
                        {setlists.map(setlist => {
                            // Filter logic for songs inside setlist
                            const allSetlistSongs = setlist.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
                            const displaySetlistSongs = setlistSearchTerm 
                                ? allSetlistSongs.filter(s => s.title.toLowerCase().includes(setlistSearchTerm.toLowerCase()) || s.artist.toLowerCase().includes(setlistSearchTerm.toLowerCase()))
                                : allSetlistSongs;
                            
                            return (
                                <div key={setlist.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                                        <div>
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                                                <Calendar size={20} className="text-primary"/> {setlist.name}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1 font-medium">{allSetlistSongs.length} Songs • {new Date(setlist.date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                             {/* Search within setlist */}
                                             <div className="relative">
                                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                 <input 
                                                    type="text" 
                                                    placeholder="Filter setlist..." 
                                                    className="pl-8 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary outline-none w-full md:w-48"
                                                    value={setlistSearchTerm}
                                                    onChange={(e) => setSetlistSearchTerm(e.target.value)}
                                                 />
                                             </div>
                                             
                                             <div className="flex gap-2">
                                                <button 
                                                    onClick={() => startLiveMode(allSetlistSongs)}
                                                    disabled={allSetlistSongs.length === 0}
                                                    className="bg-primary text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none font-medium transition-all text-sm whitespace-nowrap justify-center"
                                                >
                                                    <PlayCircle size={16} /> Add all to queue & Start
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        if(confirm("Delete setlist?")) {
                                                            deleteSetlist(user!.id, setlist.id);
                                                            setSetlists(getSetlists(user!.id));
                                                        }
                                                    }}
                                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                             </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {displaySetlistSongs.map((song, idx) => {
                                            // Find original index for reordering buttons to work correctly even when filtered
                                            const originalIdx = setlist.songIds.indexOf(song.id);
                                            
                                            return (
                                            <div key={`${setlist.id}-${song.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="flex items-center gap-5">
                                                    <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-sm">{originalIdx + 1}</span>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{song.title}</div>
                                                        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{song.artist} • Key: {song.originalKey}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {/* Reorder Controls - Only show if not filtering, to avoid confusion */}
                                                    {!setlistSearchTerm && (
                                                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                                                            <button 
                                                                disabled={originalIdx === 0}
                                                                onClick={() => handleReorderSetlist(setlist, originalIdx, 'up')}
                                                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                                            >
                                                                <ArrowUp size={14} />
                                                            </button>
                                                            <button 
                                                                disabled={originalIdx === allSetlistSongs.length - 1}
                                                                onClick={() => handleReorderSetlist(setlist, originalIdx, 'down')}
                                                                className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                                            >
                                                                <ArrowDown size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    <button 
                                                        onClick={() => {
                                                            const newIds = [...setlist.songIds];
                                                            newIds.splice(originalIdx, 1);
                                                            saveSetlist(user!.id, {...setlist, songIds: newIds});
                                                            setSetlists(getSetlists(user!.id));
                                                        }}
                                                        className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        )})}
                                        {allSetlistSongs.length === 0 && (
                                            <div className="p-12 text-center">
                                                <p className="text-slate-400 italic mb-2">This setlist is empty.</p>
                                                <button onClick={() => setView('library')} className="text-primary font-bold text-sm hover:underline">Go to Library to add songs</button>
                                            </div>
                                        )}
                                        {allSetlistSongs.length > 0 && displaySetlistSongs.length === 0 && (
                                             <div className="p-8 text-center text-slate-500">
                                                 No songs match your filter.
                                             </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default App;