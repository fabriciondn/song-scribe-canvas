
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2, Edit, Save, Play, Pause } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ensureAudioBucketExists } from '@/services/storage/storageBuckets';
import { AudioFile } from '@/services/drafts/types';
import { Input } from '@/components/ui/input';
import { generateAudioId } from '@/services/drafts/audioService';

interface AudioRecorderProps {
  onSaveRecordings: (audioFiles: AudioFile[]) => void;
  initialAudioFiles?: AudioFile[];
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onSaveRecordings,
  initialAudioFiles = [] 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(initialAudioFiles);
  const [editName, setEditName] = useState('');
  const [newAudioName, setNewAudioName] = useState('Áudio');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  
  const { toast } = useToast();
  
  // Update audioFiles if initialAudioFiles changes
  useEffect(() => {
    if (initialAudioFiles && initialAudioFiles.length > 0) {
      setAudioFiles(initialAudioFiles);
    }
  }, [initialAudioFiles]);

  // Ensure the audio bucket exists when component mounts
  useEffect(() => {
    ensureAudioBucketExists().catch(error => {
      console.error("Failed to ensure audio bucket exists:", error);
    });
  }, []);

  // Stop all playing audio when another one starts
  const stopAllPlaying = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setCurrentlyPlaying(null);
  };
  
  const startRecording = async () => {
    try {
      stopAllPlaying();
      
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        
        // Determine the name for the new recording
        const audioCount = audioFiles.length + 1;
        const defaultName = `Áudio ${audioCount}`;
        const audioName = newAudioName || defaultName;
        
        // Create a new audio file entry
        const newAudioFile: AudioFile = {
          id: generateAudioId(),
          name: audioName,
          url,
          created_at: new Date().toISOString()
        };
        
        // Add the new audio file to the list
        const updatedAudioFiles = [...audioFiles, newAudioFile];
        setAudioFiles(updatedAudioFiles);
        
        // Reset the audio name input field
        setNewAudioName('');
        
        // Notify the parent component
        onSaveRecordings(updatedAudioFiles);
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
  
  const deleteRecording = (id: string | undefined) => {
    if (!id) return;
    
    const fileToDelete = audioFiles.find(file => file.id === id);
    if (fileToDelete && fileToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToDelete.url);
    }
    
    const updatedFiles = audioFiles.filter(file => file.id !== id);
    setAudioFiles(updatedFiles);
    onSaveRecordings(updatedFiles);
    
    toast({
      title: 'Áudio excluído',
      description: 'O áudio foi removido do rascunho.',
    });
  };
  
  const startEditing = (id: string, name: string) => {
    setIsEditing(id);
    setEditName(name);
  };
  
  const saveEditName = (id: string | undefined) => {
    if (!id) return;
    
    const updatedFiles = audioFiles.map(file => 
      file.id === id ? { ...file, name: editName } : file
    );
    
    setAudioFiles(updatedFiles);
    setIsEditing(null);
    onSaveRecordings(updatedFiles);
    
    toast({
      title: 'Nome alterado',
      description: 'O nome do áudio foi atualizado com sucesso.',
    });
  };
  
  const togglePlayAudio = (id: string, url: string) => {
    if (currentlyPlaying === id) {
      // Already playing this audio, stop it
      const audio = audioElementsRef.current[id];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setCurrentlyPlaying(null);
    } else {
      // Stop any currently playing audio
      stopAllPlaying();
      
      // Start playing this audio
      let audio = audioElementsRef.current[id];
      
      if (!audio) {
        audio = new Audio(url);
        audio.addEventListener('ended', () => {
          setCurrentlyPlaying(null);
        });
        audioElementsRef.current[id] = audio;
      }
      
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: 'Erro ao reproduzir',
          description: 'Não foi possível reproduzir o áudio.',
          variant: 'destructive',
        });
      });
      
      setCurrentlyPlaying(id);
    }
  };

  return (
    <div className="rounded-md border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Gravação de Áudio</h3>
        
        <div className="flex items-center space-x-2">
          {!isRecording && (
            <div className="flex items-center space-x-2">
              <Input 
                value={newAudioName} 
                onChange={(e) => setNewAudioName(e.target.value)}
                placeholder="Nome do áudio"
                className="h-9 w-40"
              />
            </div>
          )}
          
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
              variant="default" 
              size="sm" 
              onClick={startRecording}
            >
              <Mic className="h-4 w-4 mr-2" />
              Gravar
            </Button>
          )}
        </div>
      </div>
      
      {audioFiles.length > 0 && (
        <div className="space-y-3 mt-4">
          {audioFiles.map((file) => (
            <div 
              key={file.id || file.url} 
              className="flex items-center justify-between border rounded-md p-2"
            >
              <div className="flex-1 min-w-0">
                {isEditing === file.id ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => saveEditName(file.id)}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 overflow-hidden">
                    <span className="text-sm font-medium truncate">{file.name}</span>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => startEditing(file.id || '', file.name)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => togglePlayAudio(file.id || file.url, file.url)}
                >
                  {currentlyPlaying === (file.id || file.url) ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => deleteRecording(file.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
