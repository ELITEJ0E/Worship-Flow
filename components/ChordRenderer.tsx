import React from 'react';
import { transposeSongContent, isChordLine } from '../utils/chordUtils';

interface ChordRendererProps {
  content: string;
  transpose: number;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  simplify?: boolean;
}

const ChordRenderer: React.FC<ChordRendererProps> = ({ content, transpose, fontSize = 'base', simplify = false }) => {
  const transposedContent = transposeSongContent(content, transpose, simplify);
  const lines = transposedContent.split('\n');

  const textSizeClass = {
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
  }[fontSize];

  return (
    <div className={`font-mono leading-relaxed whitespace-pre-wrap ${textSizeClass} w-full`}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // 1. Headers (e.g. [Chorus], [Verse 1])
        // We look for lines wrapped in brackets that are NOT just chords
        if (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.includes('][')) {
             // Basic heuristic: Headers usually contain full words like Verse, Chorus
             const headerText = trimmed.slice(1, -1);
             return (
                <div key={lineIdx} className="font-sans font-black text-primary text-2xl uppercase tracking-wider mt-8 mb-4 border-b-2 border-primary/20 pb-1">
                    {headerText}
                </div>
             );
        }

        // 2. Chord Lines (Text Chart Format)
        // If utility says it's a chord line, we style it accent color and bold
        if (isChordLine(line)) {
            return (
                <div key={lineIdx} className="text-accent font-black text-[1.1em] tracking-tight mt-4 mb-0.5">
                    {line || ' '}
                </div>
            );
        }

        // 3. Lyric Lines (mixed with inline chords potentially)
        // If it's empty, render a spacer
        if (!trimmed) {
            return <div key={lineIdx} className="h-4"></div>;
        }

        // Check for inline chords [G] in lyric lines (ChordPro format)
        const parts = line.split(/(\[[^\]]+\])/g);
        
        if (parts.length > 1) {
             return (
                 <div key={lineIdx} className="mb-1 text-slate-800 dark:text-slate-200">
                    {parts.map((part, pIdx) => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                            return <span key={pIdx} className="text-accent font-bold mx-1">{part.slice(1, -1)}</span>
                        }
                        return <span key={pIdx}>{part}</span>
                    })}
                 </div>
             )
        }

        // 4. Plain Lyrics
        return (
            <div key={lineIdx} className="text-slate-800 dark:text-slate-200 font-medium mb-1">
                {line}
            </div>
        );
      })}
    </div>
  );
};

export default ChordRenderer;
