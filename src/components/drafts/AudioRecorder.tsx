
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Trash2, Edit, Save, Play, Pause, Music } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ensureAudioBucketExists } from '@/services/storage/storageBuckets';
import { AudioFile } from '@/services/drafts/types';
import { Input } from '@/components/ui/input';
import { generateAudioId } from '@/services/drafts/audioService';

interface AudioRecorderProps {
  onSaveRecordings: (audioFiles: AudioFile[]) => void;
  initialAudioFiles?: AudioFile[];
  isBasePlayingOrSelected?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onSaveRecordings,
  initialAudioFiles = [],
  isBasePlayingOrSelected = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingWithBase, setIsRecordingWithBase] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>(initialAudioFiles);
  const [editName, setEditName] = useState('');
  const [newAudioName, setNewAudioName] = useState('Áudio');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamsRef.current.forEach(stream => {
        stream.getTracks().forEach(track => track.stop());
      });
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Stop all playing audio when another one starts
  const stopAllPlaying = () => {
    Object.values(audioElementsRef.current).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
    setCurrentlyPlaying(null);
  };

  const cleanupStreams = () => {
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    streamsRef.current = [];
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };
  
  const startRecording = async () => {
    try {
      stopAllPlaying();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamsRef.current = [stream];
      
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
        
        cleanupStreams();
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

  const startRecordingWithBase = async () => {
    try {
      stopAllPlaying();
      
      // Request microphone access
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Request tab/screen audio - user needs to select the tab and enable "Share tab audio"
      toast({
        title: 'Selecione a aba',
        description: 'Escolha esta aba e marque "Compartilhar áudio da aba" para gravar com a base.',
      });
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: true // Required by some browsers even if we don't use video
      });
      
      // Check if we got audio track from display
      const displayAudioTracks = displayStream.getAudioTracks();
      if (displayAudioTracks.length === 0) {
        // User didn't share audio, fall back to mic only
        displayStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());
        
        toast({
          title: 'Áudio da aba não compartilhado',
          description: 'Você não marcou "Compartilhar áudio da aba". Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Stop the video track as we don't need it
      displayStream.getVideoTracks().forEach(track => track.stop());
      
      streamsRef.current = [micStream, displayStream];
      
      // Create AudioContext to mix both streams
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create sources for each stream
      const micSource = audioContext.createMediaStreamSource(micStream);
      const displaySource = audioContext.createMediaStreamSource(new MediaStream(displayAudioTracks));
      
      // Create a gain node for each source to control volume if needed
      const micGain = audioContext.createGain();
      const displayGain = audioContext.createGain();
      micGain.gain.value = 1.0;
      displayGain.gain.value = 1.0;
      
      // Create destination for mixing
      const destination = audioContext.createMediaStreamDestination();
      
      // Connect: mic -> gain -> destination
      micSource.connect(micGain);
      micGain.connect(destination);
      
      // Connect: display audio -> gain -> destination
      displaySource.connect(displayGain);
      displayGain.connect(destination);
      
      // Create MediaRecorder with the mixed stream
      const mediaRecorder = new MediaRecorder(destination.stream);
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
        const defaultName = `Prévia ${audioCount}`;
        const audioName = newAudioName ? `${newAudioName} (com base)` : defaultName;
        
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
        
        cleanupStreams();
      };
      
      mediaRecorder.start();
      setIsRecordingWithBase(true);
      
      toast({
        title: 'Gravando com base',
        description: 'Microfone + base musical estão sendo gravados juntos.',
      });
    } catch (error) {
      console.error('Error starting recording with base:', error);
      cleanupStreams();
      
      if ((error as Error).name === 'NotAllowedError') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir o compartilhamento de tela para gravar com a base.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao iniciar gravação',
          description: 'Não foi possível iniciar a gravação com a base. Tente usar a gravação normal.',
          variant: 'destructive',
        });
      }
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && (isRecording || isRecordingWithBase)) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingWithBase(false);
      
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

  const isAnyRecording = isRecording || isRecordingWithBase;

  return (
    <div className="rounded-md border p-4 bg-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Gravação de Áudio</h3>
        
        <div className="flex items-center space-x-2">
          {!isAnyRecording && (
            <div className="flex items-center space-x-2">
              <Input 
                value={newAudioName} 
                onChange={(e) => setNewAudioName(e.target.value)}
                placeholder="Nome do áudio"
                className="h-9 w-40"
              />
            </div>
          )}
          
          {isAnyRecording ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={stopRecording}
            >
              <MicOff className="h-4 w-4 mr-2" />
              Parar
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={startRecording}
              >
                <Mic className="h-4 w-4 mr-2" />
                Gravar
              </Button>
              
              {isBasePlayingOrSelected && (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={startRecordingWithBase}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  title="Grava sua voz junto com o áudio da base musical"
                >
                  <Mic className="h-4 w-4 mr-1" />
                  <Music className="h-4 w-4 mr-2" />
                  Com Base
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {isRecordingWithBase && (
        <div className="mb-4 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
          <p className="text-xs text-green-700 dark:text-green-300 flex items-center">
            <Mic className="h-3 w-3 mr-1 animate-pulse" />
            <Music className="h-3 w-3 mr-1" />
            Gravando voz + base musical juntos...
          </p>
        </div>
      )}
      
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
