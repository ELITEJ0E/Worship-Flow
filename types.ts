export interface Song {
  id: string;
  title: string;
  artist: string;
  originalKey: string;
  bpm: number;
  content: string; // Stored in ChordPro format (e.g., [G]Amazing [C]Grace)
  tags: string[];
  createdAt: number;
}

export interface Setlist {
  id: string;
  name: string;
  date: number;
  songIds: string[];
}

export interface User {
  id: string;
  username: string;
  passwordHash: string; // In a real app, never store plain text, even in local storage mocks
}

export enum ViewMode {
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
  LIVE = 'LIVE',
  SETLISTS = 'SETLISTS'
}
