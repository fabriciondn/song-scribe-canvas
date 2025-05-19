
import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Segment {
  text: string;
  authorId: string;
  startOffset: number;
  endOffset: number;
}

interface AuthorInfo {
  id: string;
  name: string;
  color: string;
}

interface CollaborativeEditorProps {
  partnershipId: string;
}

interface CompositionData {
  content?: string;
  author_segments?: Segment[];
}

interface ProfileData {
  id: string;
  name?: string;
  email?: string;
}

// Type definitions for Supabase responses
interface CollaboratorResponse {
  user_id: string;
  profiles: ProfileData;
}

interface PartnershipResponse {
  user_id: string;
  profiles: ProfileData;
}

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ partnershipId }) => {
  const [content, setContent] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({});
  const [lastCursorPosition, setLastCursorPosition] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Color palette for different authors
  const colorPalette = [
    '#F2FCE2', // Soft Green
    '#FEF7CD', // Soft Yellow
    '#FEC6A1', // Soft Orange
    '#E5DEFF', // Soft Purple
    '#FFDEE2', // Soft Pink
    '#FDE1D3', // Soft Peach
    '#D3E4FD', // Soft Blue
    '#F1F0FB', // Soft Gray
  ];
  
  // Load initial content and set up real-time subscription
  useEffect(() => {
    if (!partnershipId || !user?.id) return;
    
    const loadInitialData = async () => {
      try {
        // Load composition content
        const { data: compositionData, error: compositionError } = await supabase
          .from('partnership_compositions')
          .select('content, author_segments')
          .eq('partnership_id', partnershipId)
          .single();
          
        if (compositionError) throw compositionError;
        
        if (compositionData) {
          const typedData = compositionData as CompositionData;
          setContent(typedData.content || '');
          setSegments(typedData.author_segments || []);
        }
        
        // Load collaborators info
        const { data: collaboratorsData, error: collaboratorsError } = await supabase
          .from('partnership_collaborators')
          .select(`
            user_id,
            profiles:user_id (
              id,
              name
            )
          `)
          .eq('partnership_id', partnershipId);
          
        if (collaboratorsError) throw collaboratorsError;
        
        // Also get partnership creator
        const { data: partnershipData, error: partnershipError } = await supabase
          .from('partnerships')
          .select(`
            user_id,
            profiles:user_id (
              id,
              name
            )
          `)
          .eq('id', partnershipId)
          .single();
          
        if (partnershipError) throw partnershipError;
        
        // Create authors map with colors
        const authorsMap: Record<string, AuthorInfo> = {};
        
        // Add partnership creator
        if (partnershipData) {
          // Type casting to access properties safely
          const partnershipInfo = partnershipData as unknown as PartnershipResponse;
          if (partnershipInfo.user_id && partnershipInfo.profiles) {
            const profile = partnershipInfo.profiles;
            authorsMap[partnershipInfo.user_id] = {
              id: partnershipInfo.user_id,
              name: profile.name || 'Criador',
              color: colorPalette[0]
            };
          }
        }
        
        // Add collaborators
        if (collaboratorsData) {
          collaboratorsData.forEach((collab, index) => {
            // Type casting to access properties safely
            const collaboratorInfo = collab as unknown as CollaboratorResponse;
            if (collaboratorInfo.user_id && collaboratorInfo.profiles) {
              // Skip if already added (creator)
              if (authorsMap[collaboratorInfo.user_id]) return;
              
              const profile = collaboratorInfo.profiles;
              authorsMap[collaboratorInfo.user_id] = {
                id: collaboratorInfo.user_id,
                name: profile.name || `Colaborador ${index + 1}`,
                color: colorPalette[(index + 1) % colorPalette.length]
              };
            }
          });
        }
        
        setAuthors(authorsMap);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error loading collaborative editor data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar o conteúdo da composição.',
          variant: 'destructive',
        });
      }
    };
    
    loadInitialData();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`partnership_${partnershipId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'partnership_compositions',
          filter: `partnership_id=eq.${partnershipId}`
        },
        (payload) => {
          const newData = payload.new as any;
          
          // Only update if not from current user
          if (newData.last_modified_by !== user.id) {
            setContent(newData.content);
            setSegments(newData.author_segments || []);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnershipId, user?.id]);
  
  // Handle text changes
  const handleContentChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!user?.id || isInitialLoad) return;
    
    const newContent = e.target.value;
    const currentPosition = e.target.selectionStart;
    
    // Update local state
    setContent(newContent);
    setLastCursorPosition(currentPosition);
    
    // Determine what changed
    const previousContent = content;
    
    // Simple diff detection - in a real app, a more sophisticated diff algorithm should be used
    let changeStart = 0;
    const minLength = Math.min(previousContent.length, newContent.length);
    
    // Find where the text starts to differ
    while (changeStart < minLength && previousContent[changeStart] === newContent[changeStart]) {
      changeStart++;
    }
    
    // If content was added
    if (newContent.length > previousContent.length) {
      const addedText = newContent.slice(changeStart, currentPosition);
      
      // Create a new segment for the added text
      const newSegment: Segment = {
        text: addedText,
        authorId: user.id,
        startOffset: changeStart,
        endOffset: currentPosition
      };
      
      // Adjust existing segments
      const updatedSegments = segments.map(segment => {
        if (segment.startOffset >= changeStart) {
          // Segment starts after the insertion point, move it
          return {
            ...segment,
            startOffset: segment.startOffset + addedText.length,
            endOffset: segment.endOffset + addedText.length
          };
        } else if (segment.endOffset >= changeStart) {
          // Insertion happens within this segment, split it
          return {
            ...segment,
            endOffset: segment.endOffset + addedText.length
          };
        }
        return segment;
      });
      
      // Add the new segment
      const newSegments = [...updatedSegments, newSegment];
      setSegments(newSegments);
      
      // Save to database - usando any para contornar limitação dos tipos
      await supabase
        .from('partnership_compositions' as any)
        .update({
          content: newContent,
          author_segments: newSegments,
          updated_at: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('partnership_id', partnershipId);
    } 
    // If content was deleted
    else if (newContent.length < previousContent.length) {
      const deletionLength = previousContent.length - newContent.length;
      const deletionEnd = changeStart + deletionLength;
      
      // Update segments for deletion
      const updatedSegments = segments
        .map(segment => {
          // Case 1: Segment is completely after deletion
          if (segment.startOffset >= deletionEnd) {
            return {
              ...segment,
              startOffset: segment.startOffset - deletionLength,
              endOffset: segment.endOffset - deletionLength
            };
          }
          // Case 2: Segment is completely before deletion
          else if (segment.endOffset <= changeStart) {
            return segment;
          }
          // Case 3: Segment is completely within deletion
          else if (segment.startOffset >= changeStart && segment.endOffset <= deletionEnd) {
            return null; // Will be filtered out
          }
          // Case 4: Deletion starts within segment
          else if (segment.startOffset < changeStart && segment.endOffset > changeStart) {
            return {
              ...segment,
              endOffset: segment.endOffset - Math.min(deletionLength, segment.endOffset - changeStart)
            };
          }
          // Case 5: Deletion ends within segment
          else if (segment.startOffset < deletionEnd && segment.endOffset > deletionEnd) {
            return {
              ...segment,
              startOffset: changeStart,
              endOffset: segment.endOffset - deletionLength
            };
          }
          // Case 6: Segment spans the entire deletion
          else if (segment.startOffset <= changeStart && segment.endOffset >= deletionEnd) {
            return {
              ...segment,
              endOffset: segment.endOffset - deletionLength
            };
          }
          return segment;
        })
        .filter(Boolean) as Segment[];
      
      setSegments(updatedSegments);
      
      // Save to database - usando any para contornar limitação dos tipos
      await supabase
        .from('partnership_compositions' as any)
        .update({
          content: newContent,
          author_segments: updatedSegments,
          updated_at: new Date().toISOString(),
          last_modified_by: user.id
        })
        .eq('partnership_id', partnershipId);
    }
  };
  
  // Render the content with author highlighting
  const renderHighlightedContent = () => {
    if (!content || segments.length === 0) {
      return content;
    }
    
    // Sort segments by startOffset
    const sortedSegments = [...segments].sort((a, b) => a.startOffset - b.startOffset);
    
    // Create HTML with spans for highlighting
    let html = '';
    let lastIndex = 0;
    
    sortedSegments.forEach(segment => {
      // Add text before this segment
      if (segment.startOffset > lastIndex) {
        html += content.substring(lastIndex, segment.startOffset);
      }
      
      // Get author color
      const authorColor = authors[segment.authorId]?.color || '#ffffff';
      
      // Add the highlighted segment
      const segmentText = content.substring(segment.startOffset, segment.endOffset);
      html += `<span style="background-color: ${authorColor};">${segmentText}</span>`;
      
      lastIndex = segment.endOffset;
    });
    
    // Add any remaining text
    if (lastIndex < content.length) {
      html += content.substring(lastIndex);
    }
    
    return html;
  };
  
  return (
    <div className="collaborative-editor">
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Compositor Colaborativo</h3>
        
        <div className="flex flex-wrap gap-2 mb-3">
          {Object.values(authors).map(author => (
            <div 
              key={author.id}
              className="flex items-center px-2 py-1 rounded text-xs"
              style={{ backgroundColor: author.color }}
            >
              <span className="font-medium">{author.name}</span>
              {author.id === user?.id && <span className="ml-1">(você)</span>}
            </div>
          ))}
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={handleContentChange}
        className="min-h-[400px] font-mono"
        placeholder="Comece a compor colaborativamente..."
      />
    </div>
  );
};
