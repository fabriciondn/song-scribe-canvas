
import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CollaborativeChatPanel } from '@/components/partnerships/CollaborativeChatPanel';
import { SegmentApprovalSystem } from '@/components/partnerships/SegmentApprovalSystem';
import { AudioRecordingPanel } from '@/components/partnerships/AudioRecordingPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

export const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ partnershipId }) => {
  const [content, setContent] = useState('');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({});
  const [lastCursorPosition, setLastCursorPosition] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [selectedSegmentId, setSelectedSegmentId] = useState('');
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Color palette for different authors
  const colorPalette = [
    '#F2FCE2', '#FEF7CD', '#FEC6A1', '#E5DEFF', 
    '#FFDEE2', '#FDE1D3', '#D3E4FD', '#F1F0FB'
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
          const content = compositionData.content as string || '';
          
          // Convert Json to Segment[] with proper type casting
          let parsedSegments: Segment[] = [];
          if (compositionData.author_segments) {
            const jsonSegments = compositionData.author_segments as any[];
            parsedSegments = jsonSegments.filter(segment => 
              typeof segment === 'object' && 
              'text' in segment && 
              'authorId' in segment && 
              'startOffset' in segment && 
              'endOffset' in segment
            ).map(segment => ({
              text: String(segment.text),
              authorId: String(segment.authorId),
              startOffset: Number(segment.startOffset),
              endOffset: Number(segment.endOffset)
            }));
          }
          
          setContent(content);
          setSegments(parsedSegments);
        }
        
        // Load collaborators info
        const { data: collaboratorsData, error: collaboratorsError } = await supabase
          .from('partnership_collaborators')
          .select(`
            user_id,
            public_profiles:user_id (
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
            public_profiles:user_id (
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
          const partnershipInfo = partnershipData as any;
          if (partnershipInfo.user_id && partnershipInfo.public_profiles) {
            const profile = partnershipInfo.public_profiles as ProfileData;
            authorsMap[partnershipInfo.user_id] = {
              id: partnershipInfo.user_id,
              name: profile.name || 'Criador',
              color: colorPalette[0]
            };
          }
        }
        
        // Add collaborators
        if (collaboratorsData) {
          (collaboratorsData as any[]).forEach((collab, index) => {
            if (collab.user_id && collab.public_profiles) {
              if (authorsMap[collab.user_id]) return;
              
              const profile = collab.public_profiles as ProfileData;
              authorsMap[collab.user_id] = {
                id: collab.user_id,
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
            setContent(newData.content || '');
            
            // Handle author_segments with proper type casting
            if (newData.author_segments) {
              try {
                const jsonSegments = newData.author_segments as any[];
                const parsedSegments = jsonSegments
                  .filter(segment => 
                    typeof segment === 'object' && 
                    'text' in segment && 
                    'authorId' in segment && 
                    'startOffset' in segment && 
                    'endOffset' in segment
                  )
                  .map(segment => ({
                    text: String(segment.text),
                    authorId: String(segment.authorId),
                    startOffset: Number(segment.startOffset),
                    endOffset: Number(segment.endOffset)
                  }));
                  
                setSegments(parsedSegments);
              } catch (error) {
                console.error('Error parsing segments from real-time update:', error);
                setSegments([]);
              }
            } else {
              setSegments([]);
            }
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
    
    setContent(newContent);
    setLastCursorPosition(currentPosition);
    
    // Determine what changed
    const previousContent = content;
    
    // Simple diff detection
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
          return {
            ...segment,
            startOffset: segment.startOffset + addedText.length,
            endOffset: segment.endOffset + addedText.length
          };
        } else if (segment.endOffset >= changeStart) {
          return {
            ...segment,
            endOffset: segment.endOffset + addedText.length
          };
        }
        return segment;
      });
      
      const newSegments = [...updatedSegments, newSegment];
      setSegments(newSegments);
      
      // Save to database
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
          if (segment.startOffset >= deletionEnd) {
            return {
              ...segment,
              startOffset: segment.startOffset - deletionLength,
              endOffset: segment.endOffset - deletionLength
            };
          } else if (segment.endOffset <= changeStart) {
            return segment;
          } else if (segment.startOffset >= changeStart && segment.endOffset <= deletionEnd) {
            return null;
          } else if (segment.startOffset < changeStart && segment.endOffset > changeStart) {
            return {
              ...segment,
              endOffset: segment.endOffset - Math.min(deletionLength, segment.endOffset - changeStart)
            };
          } else if (segment.startOffset < deletionEnd && segment.endOffset > deletionEnd) {
            return {
              ...segment,
              startOffset: changeStart,
              endOffset: segment.endOffset - deletionLength
            };
          } else if (segment.startOffset <= changeStart && segment.endOffset >= deletionEnd) {
            return {
              ...segment,
              endOffset: segment.endOffset - deletionLength
            };
          }
          return segment;
        })
        .filter(Boolean) as Segment[];
      
      setSegments(updatedSegments);
      
      // Save to database
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

  const handleTextSelection = () => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;

    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      setSelectedSegmentId(`segment_${start}_${end}`);
      setShowApprovalPanel(true);
    }
  };

  const handleInsertAudio = (audioInfo: { url: string; duration?: number }) => {
    const audioMarker = `[ÁUDIO: ${audioInfo.duration ? `${audioInfo.duration}s` : 'gravação'}](${audioInfo.url})`;
    
    if (textareaRef.current) {
      const cursorPosition = textareaRef.current.selectionStart;
      const newContent = content.slice(0, cursorPosition) + audioMarker + content.slice(cursorPosition);
      
      // Simulate typing the audio marker
      const event = {
        target: {
          value: newContent,
          selectionStart: cursorPosition + audioMarker.length
        }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      
      handleContentChange(event);
    }
  };
  
  return (
    <div className="h-full flex gap-4">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex-1">
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
            onMouseUp={handleTextSelection}
            className="min-h-[500px] font-mono resize-none"
            placeholder="Comece a compor colaborativamente... Selecione o texto para aprovar ou comentar."
          />
        </div>

        {/* Approval panel */}
        {showApprovalPanel && (
          <SegmentApprovalSystem
            partnershipId={partnershipId}
            selectedText={selectedText}
            segmentId={selectedSegmentId}
            onClose={() => setShowApprovalPanel(false)}
            authors={authors}
          />
        )}
      </div>

      {/* Side panel with tabs */}
      <div className="w-80 flex-shrink-0">
        <Tabs defaultValue="chat" className="h-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="h-[calc(100%-40px)]">
            <CollaborativeChatPanel
              partnershipId={partnershipId}
              authors={authors}
            />
          </TabsContent>
          
          <TabsContent value="audio" className="h-[calc(100%-40px)] overflow-y-auto">
            <AudioRecordingPanel
              partnershipId={partnershipId}
              onInsertAudio={handleInsertAudio}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
