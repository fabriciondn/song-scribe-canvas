import React, { useState, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CollaborativeChatPanel } from '../partnerships/CollaborativeChatPanel';
import { AudioRecordingPanel } from '../partnerships/AudioRecordingPanel';
import { SegmentApprovalSystem } from '../partnerships/SegmentApprovalSystem';
import { MusicPartSelector, type MusicPartType } from '../partnerships/MusicPartSelector';
import { PendingPartCard } from '../partnerships/PendingPartCard';

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
  const [selectedPart, setSelectedPart] = useState<MusicPartType>('verse');
  const [pendingParts, setPendingParts] = useState([]);
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [isPartnershipOwner, setIsPartnershipOwner] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (!partnershipId) return;

    const loadInitialData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setCurrentUserId(user.id);

        // Check if current user is partnership owner
        const { data: partnershipData } = await supabase
          .from('partnerships')
          .select('user_id')
          .eq('id', partnershipId)
          .single();

        setIsPartnershipOwner(partnershipData?.user_id === user.id);

        // Load partnership composition
        const { data: composition, error: compError } = await supabase
          .from('partnership_compositions')
          .select('content, author_segments')
          .eq('partnership_id', partnershipId)
          .single();

        if (compError && compError.code !== 'PGRST116') {
          console.error('Error loading composition:', compError);
          return;
        }

        // Load collaborators
        const { data: collaboratorsData, error: collabError } = await supabase
          .from('partnership_collaborators')
          .select('user_id')
          .eq('partnership_id', partnershipId);

        if (collabError) {
          console.error('Error loading collaborators:', collabError);
          return;
        }

        // Combine all user IDs (owner + collaborators)
        const allUserIds = [
          partnershipData?.user_id,
          ...(collaboratorsData?.map(c => c.user_id) || [])
        ].filter(Boolean);

        // Load user profiles for all participants
        if (allUserIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', allUserIds);

          if (profilesError) {
            console.error('Error loading profiles:', profilesError);
          } else {
            const profilesMap = profilesData?.reduce((acc, profile: ProfileData) => {
              const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
              acc[profile.id] = {
                id: profile.id,
                name: profile.id === user.id ? 'Você' : (profile.name || profile.email || 'Usuário'),
                color: colors[Object.keys(acc).length % colors.length]
              };
              return acc;
            }, {} as Record<string, AuthorInfo>) || {};
            
            setAuthors(profilesMap);
          }
        }

        // Set initial content and segments from composition
        if (composition?.content) {
          setContent(composition.content);
        }
        
        if (composition?.author_segments) {
          setSegments(composition.author_segments as any as Segment[]);
        }

        // Load pending parts
        loadPendingParts();

        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error in loadInitialData:', error);
        toast({
          title: "Erro ao carregar dados",
          description: "Erro ao carregar dados da parceria",
          variant: "destructive",
        });
      }
    };

    loadInitialData();

    // Set up real-time subscription
    const channel = supabase
      .channel(`partnership-${partnershipId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partnership_compositions',
          filter: `partnership_id=eq.${partnershipId}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const newData = payload.new as CompositionData;
            if (newData.content !== undefined) {
              setContent(newData.content);
            }
            if (newData.author_segments) {
              setSegments(newData.author_segments as Segment[]);
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partnership_parts'
        },
        () => {
          loadPendingParts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnershipId, toast]);

  const handleContentChange = useCallback(async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isInitialLoad) return;

    const newContent = e.target.value;
    const currentPosition = e.target.selectionStart;
    
    setContent(newContent);
    setLastCursorPosition(currentPosition);

    // Simple save to database without complex segment tracking for now
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

          await supabase
        .from('partnership_compositions')
        .upsert({
          partnership_id: partnershipId,
          content: newContent,
          author_segments: segments as any,
          last_modified_by: user.id
        });
    } catch (error) {
      console.error('Error saving content:', error);
    }
  }, [partnershipId, segments, isInitialLoad]);

  const handleTextSelection = useCallback(() => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = content.substring(start, end);
      setSelectedText(selected);
      setSelectedSegmentId(`segment_${start}_${end}`);
      setShowPartSelector(true);
    }
  }, [content]);

  const handleInsertAudio = useCallback((audioUrl: string, duration: number) => {
    const audioMarker = `[ÁUDIO: ${duration}s](${audioUrl})`;
    const newContent = content + '\n\n' + audioMarker;
    setContent(newContent);
    handleContentChange({ target: { value: newContent } } as React.ChangeEvent<HTMLTextAreaElement>);
  }, [content, handleContentChange]);

  const loadPendingParts = async () => {
    try {
      const { data, error } = await supabase
        .from('partnership_parts')
        .select(`
          *,
          profiles(name)
        `)
        .eq('partnership_id', partnershipId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingParts(data || []);
    } catch (error) {
      console.error('Error loading pending parts:', error);
    }
  };

  const handleSavePart = async () => {
    if (!selectedText.trim()) {
      toast({
        title: "Erro",
        description: "Selecione um texto para salvar como parte",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('partnership_parts')
        .insert({
          partnership_id: partnershipId,
          user_id: user.id,
          part_type: selectedPart,
          content: selectedText,
          status: isPartnershipOwner ? 'approved' : 'pending'
        });

      if (error) throw error;

      if (isPartnershipOwner) {
        // Owner's parts are auto-approved, update main content
        handleContentChange({ target: { value: content } } as React.ChangeEvent<HTMLTextAreaElement>);
      }

      setSelectedText('');
      setShowPartSelector(false);
      
      toast({
        title: "Sucesso",
        description: isPartnershipOwner 
          ? "Parte adicionada com sucesso" 
          : "Parte enviada para aprovação",
      });
    } catch (error) {
      console.error('Error saving part:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar parte",
        variant: "destructive",
      });
    }
  };

  const handleApprovePart = async (partId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('partnership_parts')
        .update({ status: 'approved', approved_by: user.id })
        .eq('id', partId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Parte aprovada com sucesso",
      });
    } catch (error) {
      console.error('Error approving part:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar parte",
        variant: "destructive",
      });
    }
  };

  const handleCommentPart = (partId: string) => {
    // This will be handled by the chat system
    toast({
      title: "Comentário",
      description: "Use o chat para deixar seu comentário sobre esta parte",
    });
  };

  const handleSaveComposition = async () => {
    try {
      const { error } = await supabase
        .from('partnership_compositions')
        .upsert({
          partnership_id: partnershipId,
          content,
          author_segments: segments as any,
          last_modified_by: currentUserId
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Composição salva com sucesso",
      });
    } catch (error) {
      console.error('Error saving composition:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar composição",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full">
      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="border-b p-4 bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Wrench className="h-4 w-4 mr-2" />
                Ferramentas
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveComposition}>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>

        <Textarea
          value={content}
          onChange={handleContentChange}
          onSelect={handleTextSelection}
          placeholder="Escreva sua composição aqui..."
          className="flex-1 min-h-0 resize-none border-none focus:ring-0 text-base leading-relaxed"
        />
        
        {/* Author information */}
        <div className="border-t p-4 bg-muted/50">
          <h4 className="text-sm font-medium mb-2">Autores:</h4>
          <div className="flex flex-wrap gap-2">
            {Object.values(authors).map((author) => (
              <div
                key={author.id}
                className="flex items-center gap-2 text-xs bg-background rounded-full px-3 py-1"
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: author.color }}
                />
                <span>{author.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="w-96 border-l bg-background flex flex-col">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="audio">Áudio</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0 p-4 space-y-4 overflow-y-auto">
            {/* Pending parts section */}
            {pendingParts.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Partes Pendentes</h3>
                {pendingParts.map((part: any) => (
                  <PendingPartCard
                    key={part.id}
                    part={{
                      ...part,
                      user_name: part.profiles?.name || 'Usuário'
                    }}
                    onApprove={handleApprovePart}
                    onComment={handleCommentPart}
                    currentUserId={currentUserId}
                  />
                ))}
              </div>
            )}
            
            <CollaborativeChatPanel
              partnershipId={partnershipId}
              authors={authors}
            />
          </TabsContent>
          <TabsContent value="audio" className="flex-1 min-h-0">
            <AudioRecordingPanel
              partnershipId={partnershipId}
              onInsertAudio={(audioInfo) => handleInsertAudio(audioInfo.url, audioInfo.duration || 0)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Part selector modal */}
      {showPartSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-96">
            <h3 className="text-lg font-medium mb-4">Adicionar Parte Musical</h3>
            <MusicPartSelector value={selectedPart} onChange={setSelectedPart} />
            <div className="bg-muted p-3 rounded-md mt-4 mb-4">
              <p className="text-sm">{selectedText}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPartSelector(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePart}>
                {isPartnershipOwner ? 'Adicionar' : 'Enviar para Aprovação'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Segment approval system */}
      {selectedText && !showPartSelector && (
        <SegmentApprovalSystem
          partnershipId={partnershipId}
          selectedText={selectedText}
          segmentId={selectedSegmentId}
          onClose={() => {
            setSelectedText('');
            setSelectedSegmentId('');
          }}
          authors={authors}
        />
      )}
    </div>
  );
};