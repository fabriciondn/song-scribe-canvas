import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Play, Pause, Download, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface AudioRecording {
  id: string;
  file_path: string;
  duration?: number;
  created_at: string;
}

interface AudioRecordingPanelProps {
  partnershipId: string;
  onInsertAudio: (audioInfo: { url: string; duration?: number }) => void;
}

export const AudioRecordingPanel: React.FC<AudioRecordingPanelProps> = ({
  partnershipId,
  onInsertAudio
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  // Load existing recordings
  React.useEffect(() => {
    loadRecordings();
  }, [partnershipId]);

  const loadRecordings = async () => {
    try {
      const { data, error } = await supabase
        .from('partnership_audio_recordings')
        .select('*')
        .eq('partnership_id', partnershipId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecordings(data || []);
    } catch (error) {
      console.error('Error loading recordings:', error);
      toast({
        title: 'Erro ao carregar gravações',
        description: 'Não foi possível carregar suas gravações.',
        variant: 'destructive',
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await saveRecording(audioBlob, recordingTime);
        
        // Stop all tracks and cleanup
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
        setMediaRecorder(null);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      recorder.start();
      
      toast({
        title: 'Gravação iniciada',
        description: 'Sua gravação de áudio começou.',
      });
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

  const saveRecording = async (audioBlob: Blob, duration: number) => {
    if (!user?.id) return;

    try {
      // Upload audio file
      const fileName = `partnership_${partnershipId}_${user.id}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio')
        .upload(fileName, audioBlob);

      if (uploadError) throw uploadError;

      // Save recording metadata to database
      const { data, error } = await supabase
        .from('partnership_audio_recordings')
        .insert({
          partnership_id: partnershipId,
          user_id: user.id,
          file_path: uploadData.path,
          duration
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setRecordings(prev => [data, ...prev]);

      toast({
        title: 'Gravação salva',
        description: 'Sua gravação foi salva com sucesso.',
      });
    } catch (error) {
      console.error('Error saving recording:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a gravação.',
        variant: 'destructive',
      });
    }
  };

  const playRecording = async (recording: AudioRecording) => {
    if (playingId === recording.id) {
      // Stop playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setPlayingId(null);
    } else {
      try {
        // Get public URL for the recording
        const { data } = supabase.storage
          .from('audio')
          .getPublicUrl(recording.file_path);

        if (audioRef.current) {
          audioRef.current.src = data.publicUrl;
          audioRef.current.play();
          setPlayingId(recording.id);
          
          audioRef.current.onended = () => {
            setPlayingId(null);
          };
        }
      } catch (error) {
        console.error('Error playing recording:', error);
        toast({
          title: 'Erro na reprodução',
          description: 'Não foi possível reproduzir a gravação.',
          variant: 'destructive',
        });
      }
    }
  };

  const insertRecording = async (recording: AudioRecording) => {
    try {
      const { data } = supabase.storage
        .from('audio')
        .getPublicUrl(recording.file_path);

      onInsertAudio({
        url: data.publicUrl,
        duration: recording.duration
      });

      toast({
        title: 'Áudio inserido',
        description: 'A gravação foi inserida na composição.',
      });
    } catch (error) {
      console.error('Error inserting recording:', error);
      toast({
        title: 'Erro ao inserir',
        description: 'Não foi possível inserir a gravação.',
        variant: 'destructive',
      });
    }
  };

  const deleteRecording = async (recording: AudioRecording) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('audio')
        .remove([recording.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('partnership_audio_recordings')
        .delete()
        .eq('id', recording.id);

      if (dbError) throw dbError;

      // Remove from local state
      setRecordings(prev => prev.filter(r => r.id !== recording.id));

      toast({
        title: 'Gravação excluída',
        description: 'A gravação foi excluída com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a gravação.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Gravações de Áudio
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Recording controls */}
        <div className="flex flex-col items-center gap-3 p-4 bg-muted rounded-lg">
          {isRecording && (
            <div className="text-center">
              <div className="text-2xl font-mono text-red-600">
                {formatTime(recordingTime)}
              </div>
              <div className="text-sm text-muted-foreground">Gravando...</div>
            </div>
          )}
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className="w-full"
          >
            {isRecording ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Parar Gravação
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Iniciar Gravação
              </>
            )}
          </Button>
        </div>

        {/* Recordings list */}
        {recordings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-card-foreground">Suas Gravações:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recordings.map((recording) => (
                <div 
                  key={recording.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-card-foreground">
                      Gravação - {formatDate(recording.created_at)}
                    </div>
                    {recording.duration && (
                      <div className="text-xs text-muted-foreground">
                        Duração: {formatTime(recording.duration)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playRecording(recording)}
                    >
                      {playingId === recording.id ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertRecording(recording)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecording(recording)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <audio ref={audioRef} className="hidden" />
      </CardContent>
    </Card>
  );
};