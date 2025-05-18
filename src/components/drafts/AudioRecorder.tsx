
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ensureAudioBucketExists } from '@/services/storage/storageBuckets';

interface AudioRecorderProps {
  onSaveRecording: (audioUrl: string, audioBlob: Blob) => void;
  initialAudioUrl?: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onSaveRecording, initialAudioUrl }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(initialAudioUrl || null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const { toast } = useToast();
  
  // Update audioURL if initialAudioUrl changes
  useEffect(() => {
    if (initialAudioUrl) {
      setAudioURL(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  // Ensure the audio bucket exists when component mounts
  useEffect(() => {
    ensureAudioBucketExists().catch(error => {
      console.error("Failed to ensure audio bucket exists:", error);
    });
  }, []);
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onSaveRecording(url, audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: 'Gravação iniciada',
        description: 'Seu áudio está sendo gravado agora.',
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Erro ao acessar microfone',
        description: 'Verifique se seu navegador tem permissão para usar o microfone.',
        variant: 'destructive',
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      toast({
        title: 'Gravação finalizada',
        description: 'Seu áudio foi gravado com sucesso.',
      });
    }
  };
  
  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      
      // Call onSaveRecording with null values to indicate deletion
      onSaveRecording('', new Blob());
      
      toast({
        title: 'Gravação excluída',
        description: 'Sua gravação de áudio foi excluída.',
      });
    }
  };

  return (
    <div className="rounded-md border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Gravação de Áudio</h3>
        
        <div className="flex space-x-2">
          {isRecording ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
            >
              <MicOff className="h-4 w-4 mr-2" />
              Parar
            </Button>
          ) : (
            <Button 
              variant={audioURL ? "outline" : "default"} 
              size="sm" 
              onClick={startRecording}
            >
              <Mic className="h-4 w-4 mr-2" />
              Gravar
            </Button>
          )}
          
          {audioURL && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={deleteRecording}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {audioURL && (
        <div className="mt-2">
          <audio controls src={audioURL} className="w-full" />
        </div>
      )}
    </div>
  );
};
