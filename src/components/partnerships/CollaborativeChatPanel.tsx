import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Mic, MicOff, Play, Pause } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  user_id: string;
  message_type: 'text' | 'audio';
  content: string;
  audio_url?: string;
  created_at: string;
  user_name: string;
  user_color: string;
}

interface CollaborativeChatPanelProps {
  partnershipId: string;
  authors: Record<string, { id: string; name: string; color: string }>;
}

export const CollaborativeChatPanel: React.FC<CollaborativeChatPanelProps> = ({
  partnershipId,
  authors
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load messages and set up real-time subscription
  useEffect(() => {
    if (!partnershipId) return;

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('partnership_messages')
          .select('*')
          .eq('partnership_id', partnershipId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Format messages with author info
        const formattedMessages: Message[] = (data || []).map(msg => ({
          ...msg,
          message_type: msg.message_type as 'text' | 'audio',
          user_name: authors[msg.user_id]?.name || 'Usuário',
          user_color: authors[msg.user_id]?.color || '#f3f4f6'
        }));

        setMessages(formattedMessages);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: 'Erro ao carregar mensagens',
          description: 'Não foi possível carregar o histórico do chat.',
          variant: 'destructive',
        });
      }
    };

    loadMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`partnership_chat_${partnershipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'partnership_messages',
          filter: `partnership_id=eq.${partnershipId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          const formattedMessage: Message = {
            ...newMsg,
            message_type: newMsg.message_type as 'text' | 'audio',
            user_name: authors[newMsg.user_id]?.name || 'Usuário',
            user_color: authors[newMsg.user_id]?.color || '#f3f4f6'
          };
          
          setMessages(prev => [...prev, formattedMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [partnershipId, authors]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendTextMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;

    try {
      const { error } = await supabase
        .from('partnership_messages')
        .insert({
          partnership_id: partnershipId,
          user_id: user.id,
          message_type: 'text',
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await uploadAudioMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
      };

      recorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Erro na gravação',
        description: 'Não foi possível acessar o microfone.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  const uploadAudioMessage = async (audioBlob: Blob) => {
    if (!user?.id) return;

    try {
      // Upload audio file
      const fileName = `partnership_${partnershipId}_${user.id}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio')
        .getPublicUrl(fileName);

      // Save message to database
      const { error } = await supabase
        .from('partnership_messages')
        .insert({
          partnership_id: partnershipId,
          user_id: user.id,
          message_type: 'audio',
          content: 'Mensagem de áudio',
          audio_url: urlData.publicUrl
        });

      if (error) throw error;

      toast({
        title: 'Áudio enviado',
        description: 'Sua mensagem de áudio foi enviada com sucesso.',
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: 'Erro ao enviar áudio',
        description: 'Não foi possível enviar a mensagem de áudio.',
        variant: 'destructive',
      });
    }
  };

  const playAudio = (messageId: string, audioUrl: string) => {
    if (playingMessageId === messageId) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingMessageId(null);
    } else {
      // Start playing
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setPlayingMessageId(messageId);
        
        audioRef.current.onended = () => {
          setPlayingMessageId(null);
        };
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground">Chat da Parceria</h3>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${
                message.user_id === user?.id ? 'flex-row-reverse' : 'flex-row'
              }`}>
                <Avatar className="w-8 h-8 flex-shrink-0">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: message.user_color }}
                  >
                    {message.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-lg p-3 ${
                  message.user_id === user?.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <div className="text-xs opacity-75 mb-1">
                    {message.user_name} • {formatTime(message.created_at)}
                  </div>
                  
                  {message.message_type === 'text' ? (
                    <div className="break-words">{message.content}</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => playAudio(message.id, message.audio_url!)}
                        className="h-8 px-2"
                      >
                        {playingMessageId === message.id ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <span className="text-sm">Mensagem de áudio</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
            className="flex-1"
          />
          
          <Button
            onClick={sendTextMessage}
            disabled={!newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "outline"}
            size="sm"
          >
            {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        
        {isRecording && (
          <div className="mt-2 text-center text-sm text-muted-foreground">
            Gravando... Clique novamente para parar
          </div>
        )}
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
};