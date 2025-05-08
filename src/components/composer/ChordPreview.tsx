
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChordPreviewProps {
  content: string;
}

export const ChordPreview: React.FC<ChordPreviewProps> = ({ content }) => {
  // Parse content to render chords
  const renderChordedText = () => {
    if (!content) return null;
    
    // Split content by lines
    return content.split('\n').map((line, lineIndex) => {
      // Check if line has chord markers [chord]
      if (line.includes('[') && line.includes(']')) {
        // Regular expression to find all chords in the format [chord]
        const chordRegex = /\[([^\]]+)\]/g;
        let match;
        let lastIndex = 0;
        const elements = [];
        const chordPositions = [];

        // Find all chord positions
        while ((match = chordRegex.exec(line)) !== null) {
          const chord = match[1];
          const start = match.index;
          const end = start + match[0].length;
          
          // Add the text before the chord
          if (start > lastIndex) {
            elements.push(
              <span key={`text-${lineIndex}-${lastIndex}`}>
                {line.substring(lastIndex, start)}
              </span>
            );
          }
          
          // Add the chord above the position
          chordPositions.push({
            position: elements.length,
            chord
          });
          
          // Add a marker where the chord will be placed in the text
          elements.push(
            <span key={`chord-${lineIndex}-${start}`} className="relative">
              <span className="invisible">{line.substring(start, end)}</span>
              <span 
                className="absolute left-0 -top-5 font-bold text-[#f28b25]"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                {chord}
              </span>
            </span>
          );
          
          lastIndex = end;
        }
        
        // Add the remaining text after the last chord
        if (lastIndex < line.length) {
          elements.push(
            <span key={`text-${lineIndex}-${lastIndex}`}>
              {line.substring(lastIndex)}
            </span>
          );
        }
        
        return (
          <div key={`line-${lineIndex}`} className="relative my-4">
            <div 
              className="font-mono leading-8"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              {elements}
            </div>
          </div>
        );
      } else {
        // If the line doesn't have chords, just return it as is
        return (
          <div 
            key={`line-${lineIndex}`} 
            className="my-1 font-mono"
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {line}
          </div>
        );
      }
    });
  };

  return (
    <div className="rounded-md h-full">
      <h3 className="text-sm font-semibold mb-4">Pré-visualização da Cifra</h3>
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="p-4">{renderChordedText()}</div>
      </ScrollArea>
    </div>
  );
};
