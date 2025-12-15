import React, { useState, useEffect, useRef } from 'react';
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
    CheckSquare,
    Square,
    GripVertical,
    Check
} from 'lucide-react';

const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- MODALS ---

const CreateSetlistModal = ({ onClose, onSave }: { onClose: () => void, onSave: (name: string) => void }) => {
    const [name, setName] = useState('');
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
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

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean, title: string, message: string, onConfirm: () => void, onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">{title}</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{message}</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors font-medium">Cancel</button>
                    <button 
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors shadow-lg shadow-red-500/30"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

const AddToSetlistModal = ({ isOpen, onClose, setlists, onSelect }: { isOpen: boolean, onClose: () => void, setlists: Setlist[], onSelect: (setlistId: string) => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add to Setlist</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={20}/></button>
                </div>
                
                <div className="overflow-y-auto space-y-2 flex-1">
                    {setlists.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-slate-500 mb-2">No setlists found.</p>
                            <button onClick={onClose} className="text-primary font-bold text-sm">Cancel</button>
                        </div>
                    ) : (
                        setlists.map(setlist => (
                            <button
                                key={setlist.id}
                                onClick={() => onSelect(setlist.id)}
                                className="w-full text-left p-4 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                            >
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-primary">
                                     <ListMusic size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{setlist.name}</div>
                                    <div className="text-xs text-slate-500">{setlist.songIds.length} songs</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const SongPickerModal = ({ isOpen, onClose, songs, onAdd, excludeIds = [] }: { isOpen: boolean, onClose: () => void, songs: Song[], onAdd: (songIds: string[]) => void, excludeIds?: string[] }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filteredSongs = songs
        .filter(s => !excludeIds.includes(s.id))
        .filter(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.artist.toLowerCase().includes(search.toLowerCase()));

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Add Songs</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={20}/></button>
                </div>

                <div className="relative mb-4">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                     <input 
                        type="text" 
                        placeholder="Search library..." 
                        className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary w-full outline-none dark:text-white"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                     />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                    {filteredSongs.length === 0 && (
                        <p className="text-center text-slate-500 py-8">No songs found.</p>
                    )}
                    {filteredSongs.map(song => {
                        const isSelected = selectedIds.has(song.id);
                        return (
                            <button
                                key={song.id}
                                onClick={() => toggleSelection(song.id)}
                                className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 border ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700 border-transparent'}`}
                            >
                                <div className={`shrink-0 ${isSelected ? 'text-primary' : 'text-slate-300'}`}>
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{song.title}</div>
                                    <div className="text-xs text-slate-500">{song.artist} • {song.originalKey}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-sm text-slate-500">{selectedIds.size} selected</span>
                    <button 
                        onClick={() => { onAdd(Array.from(selectedIds)); onClose(); }}
                        disabled={selectedIds.size === 0}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-bold transition-colors"
                    >
                        Add Selected
                    </button>
                </div>
             </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const SetlistCard = ({ 
    setlist, 
    allLibrarySongs, 
    onUpdate, 
    onDelete, 
    onStartLive,
    filterTerm 
}: { 
    setlist: Setlist, 
    allLibrarySongs: Song[], 
    onUpdate: (updated: Setlist) => void, 
    onDelete: (id: string) => void,
    onStartLive: (queue: Song[]) => void,
    filterTerm: string
}) => {
    const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
    const [isSongPickerOpen, setIsSongPickerOpen] = useState(false);
    
    // Resolve songs. Filter out nulls if a song was deleted from library but ID remains in setlist.
    const setlistSongs = setlist.songIds.map(id => allLibrarySongs.find(s => s.id === id)).filter(Boolean) as Song[];
    const displaySongs = filterTerm 
        ? setlistSongs.filter(s => s.title.toLowerCase().includes(filterTerm.toLowerCase()) || s.artist.toLowerCase().includes(filterTerm.toLowerCase()))
        : setlistSongs;

    // Drag and Drop Logic
    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndexStr = e.dataTransfer.getData('text/plain');
        if (!dragIndexStr) return;
        
        const dragIndex = parseInt(dragIndexStr, 10);
        if (dragIndex === dropIndex) return;

        // Reorder
        const newIds = [...setlist.songIds];
        const [movedItem] = newIds.splice(dragIndex, 1);
        newIds.splice(dropIndex, 0, movedItem);

        onUpdate({ ...setlist, songIds: newIds });
    };

    const handleAddSongs = (newIds: string[]) => {
        const updatedIds = [...setlist.songIds, ...newIds];
        onUpdate({ ...setlist, songIds: updatedIds });
    };

    const handleBulkDelete = () => {
        if (confirm(`Remove ${selectedSongIds.size} songs from this setlist?`)) {
            const newIds = setlist.songIds.filter(id => !selectedSongIds.has(id));
            onUpdate({ ...setlist, songIds: newIds });
            setSelectedSongIds(new Set());
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedSongIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSongIds(newSet);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newIds = [...setlist.songIds];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex >= 0 && swapIndex < newIds.length) {
            [newIds[index], newIds[swapIndex]] = [newIds[swapIndex], newIds[index]];
            onUpdate({ ...setlist, songIds: newIds });
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <SongPickerModal 
                isOpen={isSongPickerOpen}
                onClose={() => setIsSongPickerOpen(false)}
                songs={allLibrarySongs}
                onAdd={handleAddSongs}
                excludeIds={setlist.songIds}
            />
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                        <Calendar size={20} className="text-primary"/> {setlist.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 font-medium">{setlistSongs.length} Songs • {new Date(setlist.date).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {/* Bulk Actions Toolbar */}
                    {selectedSongIds.size > 0 ? (
                        <button 
                            onClick={handleBulkDelete}
                            className="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-in fade-in"
                        >
                            <Trash2 size={16} /> Remove ({selectedSongIds.size})
                        </button>
                    ) : (
                        <>
                             <button 
                                onClick={() => setIsSongPickerOpen(true)}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-medium transition-colors"
                            >
                                <Plus size={16} /> Add Songs
                            </button>
                            <button 
                                onClick={() => onStartLive(setlistSongs)}
                                disabled={setlistSongs.length === 0}
                                className="bg-primary text-white px-5 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none font-medium transition-all text-sm justify-center"
                            >
                                <PlayCircle size={16} /> Start
                            </button>
                            <button 
                                onClick={() => onDelete(setlist.id)}
                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {displaySongs.map((song, idx) => {
                    // Find original index for reordering to work correctly even when filtered
                    const originalIdx = setlist.songIds.indexOf(song.id);
                    const isSelected = selectedSongIds.has(song.id);
                    
                    return (
                    <div 
                        key={`${setlist.id}-${song.id}-${originalIdx}`} 
                        className={`p-3 flex items-center justify-between transition-colors group ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                        draggable={!filterTerm} // Only drag when not filtering
                        onDragStart={(e) => handleDragStart(e, originalIdx)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, originalIdx)}
                    >
                        <div className="flex items-center gap-3 md:gap-4 flex-1 overflow-hidden">
                            {/* Drag Handle / Checkbox Area */}
                            <div className="flex items-center gap-1">
                                {!filterTerm && (
                                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 p-1">
                                        <GripVertical size={20} />
                                    </div>
                                )}
                                <button onClick={() => toggleSelection(song.id)} className={`p-1 ${isSelected ? 'text-primary' : 'text-slate-300 hover:text-slate-400'}`}>
                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                </button>
                                <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-xs shrink-0 ml-1">{originalIdx + 1}</span>
                            </div>
                            
                            <div className="min-w-0">
                                <div className={`font-bold truncate ${isSelected ? 'text-primary' : 'text-slate-800 dark:text-slate-200'}`}>{song.title}</div>
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{song.artist} • Key: {song.originalKey}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-2">
                            {/* Fallback Reorder Controls */}
                            {!filterTerm && (
                                <div className="flex flex-col md:flex-row gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
                                    <button 
                                        disabled={originalIdx === 0}
                                        onClick={() => moveItem(originalIdx, 'up')}
                                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                    >
                                        <ArrowUp size={14} />
                                    </button>
                                    <button 
                                        disabled={originalIdx === setlist.songIds.length - 1}
                                        onClick={() => moveItem(originalIdx, 'down')}
                                        className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-slate-500 disabled:opacity-30"
                                    >
                                        <ArrowDown size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )})}
                {setlistSongs.length === 0 && (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 italic mb-4">This setlist is empty.</p>
                        <button onClick={() => setIsSongPickerOpen(true)} className="text-primary font-bold text-sm hover:underline bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">Browse Library to Add</button>
                    </div>
                )}
                {setlistSongs.length > 0 && displaySongs.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No songs match your filter.
                        </div>
                )}
            </div>
        </div>
    );
};


// --- APP COMPONENT ---

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
  const [setlistSearchTerm, setSetlistSearchTerm] = useState(''); 
  const [sortOption, setSortOption] = useState<'title' | 'artist' | 'date'>('date');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  // Modals State
  const [showCreateSetlistModal, setShowCreateSetlistModal] = useState(false);
  
  const [addToSetlistState, setAddToSetlistState] = useState<{isOpen: boolean, songId: string | null}>({
      isOpen: false, songId: null
  });

  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
      isOpen: false, title: '', message: '', onConfirm: () => {}
  });

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
      setLiveQueue(prev => prev.map(s => s.id === song.id ? song : s));
  }

  const confirmDeleteSong = (id: string) => {
    setConfirmDialog({
        isOpen: true,
        title: "Delete Song",
        message: "Are you sure you want to delete this song? This action cannot be undone.",
        onConfirm: () => {
            if (!user) return;
            deleteSong(user.id, id);
            setSongs(getSongs(user.id));
            setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const handleUpdateSetlist = (updatedSetlist: Setlist) => {
      if (!user) return;
      saveSetlist(user.id, updatedSetlist);
      setSetlists(getSetlists(user.id));
  };

  const confirmDeleteSetlist = (id: string) => {
      setConfirmDialog({
          isOpen: true,
          title: "Delete Setlist",
          message: "Are you sure you want to delete this setlist? The songs will remain in your library.",
          onConfirm: () => {
              if(!user) return;
              deleteSetlist(user.id, id);
              setSetlists(getSetlists(user.id));
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  }

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
      setShowCreateSetlistModal(false);
  };

  const handleAddToSetlist = (setlistId: string) => {
      if (!user || !addToSetlistState.songId) return;
      const setlist = setlists.find(s => s.id === setlistId);
      if (setlist) {
          if (!setlist.songIds.includes(addToSetlistState.songId)) {
            const updated = { ...setlist, songIds: [...setlist.songIds, addToSetlistState.songId] };
            saveSetlist(user.id, updated);
            setSetlists(getSetlists(user.id));
            // Close modal after success
            setAddToSetlistState({ isOpen: false, songId: null });
          } else {
             alert("Song already in this setlist");
          }
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
        {showCreateSetlistModal && (
            <CreateSetlistModal 
                onClose={() => setShowCreateSetlistModal(false)} 
                onSave={handleCreateSetlist} 
            />
        )}
        
        {addToSetlistState.isOpen && (
            <AddToSetlistModal 
                isOpen={addToSetlistState.isOpen}
                onClose={() => setAddToSetlistState({ isOpen: false, songId: null })}
                setlists={setlists}
                onSelect={handleAddToSetlist}
            />
        )}

        <ConfirmModal 
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />

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
                        onClick={() => setShowCreateSetlistModal(true)}
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
                                                    setAddToSetlistState({ isOpen: true, songId: song.id });
                                                }
                                            }}
                                            className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 hover:text-primary transition-colors hover:shadow-sm"
                                            title="Add to Setlist"
                                        >
                                            <ListMusic size={16} />
                                        </button>
                                    </div>
                                     <button 
                                        onClick={() => confirmDeleteSong(song.id)}
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
                        <div className="sticky top-0 bg-surface dark:bg-slate-950 z-10 py-2 -my-2 flex justify-end">
                            <div className="relative">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                 <input 
                                    type="text" 
                                    placeholder="Filter inside setlists..." 
                                    className="pl-8 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary outline-none w-full md:w-64"
                                    value={setlistSearchTerm}
                                    onChange={(e) => setSetlistSearchTerm(e.target.value)}
                                 />
                            </div>
                        </div>

                        {setlists.length === 0 && (
                            <div className="text-center py-20">
                                <div className="bg-slate-100 dark:bg-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <LayoutList className="text-slate-400" size={48} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No setlists created</h3>
                                <p className="text-slate-500">Create a setlist to organize your songs for a service or performance.</p>
                            </div>
                        )}
                        
                        {setlists.map(setlist => (
                            <SetlistCard 
                                key={setlist.id} 
                                setlist={setlist}
                                allLibrarySongs={songs}
                                onUpdate={handleUpdateSetlist}
                                onDelete={confirmDeleteSetlist}
                                onStartLive={startLiveMode}
                                filterTerm={setlistSearchTerm}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    </div>
  );
};

export default App;