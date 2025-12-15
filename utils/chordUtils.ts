export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const normalizeNote = (note: string): string => {
  const map: Record<string, string> = {
    'Cb': 'B', 'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'E#': 'F', 'B#': 'C'
  };
  return map[note] || note;
};

export const transposeChord = (chord: string, semitones: number): string => {
  // Regex to match root note + modifier (e.g., C#, Bb) + the rest (m, sus4, /G)
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  
  if (!match) return chord;
  
  let [_, root, suffix] = match;
  let normalizedRoot = normalizeNote(root);
  let rootIndex = NOTES.indexOf(normalizedRoot);
  
  if (rootIndex === -1) return chord; // Unknown chord root
  
  let newIndex = (rootIndex + semitones) % 12;
  if (newIndex < 0) newIndex += 12;
  
  const newRoot = NOTES[newIndex];
  
  // Handle slash chords (e.g., C/G)
  if (suffix.includes('/')) {
    const parts = suffix.split('/');
    const bass = parts[1];
    const restOfSuffix = parts[0];
    
    // Transpose bass note
    const bassMatch = bass.match(/^([A-G][#b]?)$/);
    if (bassMatch) {
       const normalizedBass = normalizeNote(bassMatch[1]);
       let bassIndex = NOTES.indexOf(normalizedBass);
       if (bassIndex !== -1) {
          let newBassIndex = (bassIndex + semitones) % 12;
          if (newBassIndex < 0) newBassIndex += 12;
          return `${newRoot}${restOfSuffix}/${NOTES[newBassIndex]}`;
       }
    }
  }
  
  return newRoot + suffix;
};

export const simplifyChord = (chord: string): string => {
  const regex = /^([A-G][#b]?)(.*)$/;
  const match = chord.match(regex);
  if (!match) return chord;

  let [_, root, suffix] = match;
  
  // Substitute Diminished with Dominant 7th (heuristic)
  if (suffix.includes('dim')) {
      const rootNorm = normalizeNote(root);
      const rootIdx = NOTES.indexOf(rootNorm);
      if (rootIdx !== -1) {
          let newRootIdx = (rootIdx - 4);
          if (newRootIdx < 0) newRootIdx += 12;
          return NOTES[newRootIdx] + '7';
      }
  }

  const isMinor = suffix.includes('m') && !suffix.includes('maj') && !suffix.includes('dim');
  let newSuffix = isMinor ? 'm' : '';
  return root + newSuffix;
};

// --- New Logic for Text-Based Charts ---

// Enhanced regex parts
const ROOT = '([A-G][#b]?)';
// Allow more characters in suffix (parens, numbers, symbols)
const SUFFIX = '(?:maj|min|m|dim|aug|sus|add|[0-9]|\\(|\\)|\\-|\\^|\\*|°|\\+)*';
const BASS = '(?:\\/[A-G][#b]?)?';
const FULL_CHORD_REGEX = new RegExp(`^${ROOT}${SUFFIX}${BASS}$`);
const CHORD_SEARCH_REGEX = new RegExp(`${ROOT}${SUFFIX}${BASS}`, 'g');

const isValidChord = (token: string): boolean => {
    return FULL_CHORD_REGEX.test(token);
};

export const isChordLine = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    // Explicit bar lines often used in charts
    if (trimmed.startsWith('|') || trimmed.endsWith('|')) return true;
    
    // Ignore headers handled elsewhere (e.g., [Verse 1])
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
         // If it's just chords in brackets like [C] [G], it's a chord line (mixed format)
         // But usually headers don't look like chords.
         // Heuristic: If it has spaces and no brackets inside, it's a header [Verse 1]
         if (!trimmed.slice(1, -1).includes('[')) return false; 
    }

    const tokens = trimmed.split(/\s+/);
    let chordCount = 0;
    let nonChordCount = 0;

    for (const token of tokens) {
        if(token === '|' || !token) continue;
        
        // Strip common punctuation for check (e.g., "C," or "G.")
        const cleanToken = token.replace(/[,.;:]+$/, '');
        
        if (isValidChord(cleanToken)) {
             chordCount++;
        } else {
             nonChordCount++;
        }
    }
    
    if (chordCount === 0) return false;
    
    // Strict majority to avoid false positives on short lyrics like "A man"
    return chordCount > nonChordCount; 
};

export const transposeLine = (line: string, semitones: number, simplify: boolean): string => {
    const matches = Array.from(line.matchAll(CHORD_SEARCH_REGEX));
    
    // Process matches from right to left to avoid index shifting
    let newLine = line;
    for (let i = matches.length - 1; i >= 0; i--) {
        const match = matches[i];
        const chord = match[0];
        const index = match.index!;
        
        // Transpose/Simplify
        let newChord = chord;
        if (semitones !== 0) newChord = transposeChord(newChord, semitones);
        if (simplify) newChord = simplifyChord(newChord);
        
        // Alignment Adjustment:
        const diff = newChord.length - chord.length;
        const before = newLine.substring(0, index);
        let after = newLine.substring(index + chord.length);
        
        if (diff > 0) {
            // New chord is longer: Try to eat spaces from the immediate right
            const spacesAvailable = after.match(/^\s+/)?.[0].length || 0;
            const spacesToRemove = Math.min(diff, spacesAvailable);
            after = after.substring(spacesToRemove);
        } else if (diff < 0) {
            // New chord is shorter: Add spaces to the immediate right
            after = ' '.repeat(Math.abs(diff)) + after;
        }
        
        newLine = before + newChord + after;
    }
    return newLine;
};

export const transposeSongContent = (content: string, semitones: number, simplify: boolean = false): string => {
  return content.split('\n').map(line => {
    if (isChordLine(line)) {
        return transposeLine(line, semitones, simplify);
    }
    
    // Fallback/Hybrid: Parse inline [C] brackets
    return line.replace(/\[([^\]]+)\]/g, (match, inner) => {
        // Only transpose if the inner content looks like a chord
        if (isValidChord(inner)) {
             let processed = inner;
             if (semitones !== 0) processed = transposeChord(processed, semitones);
             if (simplify) processed = simplifyChord(processed);
             return `[${processed}]`;
        }
        return match;
    });
  }).join('\n');
};