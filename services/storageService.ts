import { Song, Setlist } from '../types';

const getSongsKey = (userId: string) => `wf_songs_${userId}`;
const getSetlistsKey = (userId: string) => `wf_setlists_${userId}`;

export const getSongs = (userId: string): Song[] => {
  const data = localStorage.getItem(getSongsKey(userId));
  return data ? JSON.parse(data) : [];
};

export const saveSong = (userId: string, song: Song): void => {
  const songs = getSongs(userId);
  const existingIndex = songs.findIndex(s => s.id === song.id);
  if (existingIndex >= 0) {
    songs[existingIndex] = song;
  } else {
    songs.push(song);
  }
  localStorage.setItem(getSongsKey(userId), JSON.stringify(songs));
};

export const deleteSong = (userId: string, id: string): void => {
  const songs = getSongs(userId).filter(s => s.id !== id);
  localStorage.setItem(getSongsKey(userId), JSON.stringify(songs));
};

export const getSetlists = (userId: string): Setlist[] => {
  const data = localStorage.getItem(getSetlistsKey(userId));
  return data ? JSON.parse(data) : [];
};

export const saveSetlist = (userId: string, setlist: Setlist): void => {
  const setlists = getSetlists(userId);
  const existingIndex = setlists.findIndex(s => s.id === setlist.id);
  if (existingIndex >= 0) {
    setlists[existingIndex] = setlist;
  } else {
    setlists.push(setlist);
  }
  localStorage.setItem(getSetlistsKey(userId), JSON.stringify(setlists));
};

export const deleteSetlist = (userId: string, id: string): void => {
    const setlists = getSetlists(userId).filter(s => s.id !== id);
    localStorage.setItem(getSetlistsKey(userId), JSON.stringify(setlists));
}
