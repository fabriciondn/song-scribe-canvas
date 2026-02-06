import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Upload, Video, Trash2, Loader2, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const AdminOfferVideo: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch current video URL
  const { data: videoUrl, isLoading } = useQuery({
    queryKey: ['offer-video-url'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_page_settings')
        .select('setting_value')
        .eq('setting_key', 'video_url')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data?.setting_value || null;
    }
  });

  // Fetch player settings
  const { data: playerSettings } = useQuery({
    queryKey: ['offer-player-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('offer_page_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['use_sound_overlay', 'progress_bar_height']);
      
      if (error) throw error;
      
      const settings: { useSoundOverlay: boolean; progressBarHeight: number } = {
        useSoundOverlay: true,
        progressBarHeight: 6
      };
      
      data?.forEach(item => {
        if (item.setting_key === 'use_sound_overlay') {
          settings.useSoundOverlay = item.setting_value === 'true';
        }
        if (item.setting_key === 'progress_bar_height') {
          settings.progressBarHeight = parseInt(item.setting_value || '6', 10);
        }
      });
      
      return settings;
    }
  });

  // Update video URL mutation
  const updateVideoUrl = useMutation({
    mutationFn: async (url: string | null) => {
      const { error } = await supabase
        .from('offer_page_settings')
        .upsert({
          setting_key: 'video_url',
          setting_value: url,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-video-url'] });
      toast.success('URL do vídeo atualizada!');
    },
    onError: (error) => {
      console.error('Error updating video URL:', error);
      toast.error('Erro ao atualizar URL do vídeo');
    }
  });

  // Update player settings mutation
  const updatePlayerSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('offer_page_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-player-settings'] });
      toast.success('Configuração salva!');
    },
    onError: (error) => {
      console.error('Error updating player setting:', error);
      toast.error('Erro ao salvar configuração');
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Por favor, selecione um arquivo de vídeo');
      return;
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // Validate allowed formats (must match bucket allowed_mime_types)
    const allowedMimeTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
      'video/x-m4v',
    ];
    const allowedExtensions = ['mp4', 'webm', 'mov', 'avi', 'm4v'];

    // Some browsers may provide an empty mime type; validate by extension as a fallback.
    if (file.type && !allowedMimeTypes.includes(file.type)) {
      toast.error(`Formato não permitido (${file.type}). Use MP4, WebM, MOV, AVI ou M4V.`);
      return;
    }

    if (!file.type && fileExt && !allowedExtensions.includes(fileExt)) {
      toast.error(`Extensão não permitida (.${fileExt}). Use MP4, WebM, MOV, AVI ou M4V.`);
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('O vídeo deve ter no máximo 100MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const safeExt = fileExt && allowedExtensions.includes(fileExt) ? fileExt : 'mp4';
      const fileName = `offer-video-${Date.now()}.${safeExt}`;

      // Delete old video if exists
      if (videoUrl) {
        const oldPath = videoUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('offer-videos').remove([oldPath]);
        }
      }

      // Upload new video
      const { data, error } = await supabase.storage
        .from('offer-videos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('offer-videos')
        .getPublicUrl(data.path);

      // Update settings with new URL
      await updateVideoUrl.mutateAsync(urlData.publicUrl);

      toast.success('Vídeo enviado com sucesso!');
    } catch (error) {
      // Mostrar o erro real do Supabase (status/message), para diagnosticar corretamente
      const err: any = error;
      const status = err?.statusCode || err?.status || err?.code;
      const message = err?.message || err?.error_description || err?.error || 'Erro desconhecido';
      const details = status ? `(${status}) ${message}` : message;

      console.error('Upload error (offer video):', error);

      // Dica específica para o erro mais comum: limite imposto pelo gateway/limite de gastos do Storage
      const isPayloadTooLarge =
        status === 413 ||
        (typeof message === 'string' &&
          message.toLowerCase().includes('exceeded the maximum allowed size'));

      if (isPayloadTooLarge) {
        toast.error(
          'Upload bloqueado pelo limite do Storage (413). No Supabase, desative o “limite de gastos”/spend cap ou aumente o limite global de upload e tente novamente.'
        );
        return;
      }

      toast.error(`Erro ao enviar vídeo: ${details}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteVideo = async () => {
    if (!videoUrl) return;

    try {
      const fileName = videoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage.from('offer-videos').remove([fileName]);
      }
      await updateVideoUrl.mutateAsync(null);
      toast.success('Vídeo removido!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Vídeo da Página de Oferta
        </CardTitle>
        <CardDescription>
          Faça upload de um vídeo MP4 (máx. 100MB) para exibir na página /oferta com player customizado
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Video Preview */}
        {videoUrl && (
          <div className="space-y-4">
            <Label>Vídeo Atual</Label>
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-gray-700">
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(videoUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteVideo}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover vídeo
              </Button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-4">
          <Label>Upload de Novo Vídeo</Label>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isUploading ? 'border-primary bg-primary/5' : 'border-gray-700 hover:border-gray-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="hidden"
              id="video-upload"
            />
            
            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-gray-400">Enviando vídeo...</p>
              </div>
            ) : (
              <label htmlFor="video-upload" className="cursor-pointer space-y-4 block">
                <Upload className="h-12 w-12 mx-auto text-gray-500" />
                <div>
                  <p className="text-gray-300">Clique para selecionar um vídeo</p>
                  <p className="text-sm text-gray-500 mt-1">MP4, WebM ou MOV • Máximo 100MB</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Player Customization */}
        {videoUrl && (
          <div className="space-y-6 border-t border-gray-700 pt-6">
            <Label className="text-base font-semibold">Personalização do Player</Label>
            
            {/* Sound Overlay Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {playerSettings?.useSoundOverlay ? (
                    <VolumeX className="h-5 w-5 text-primary" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">Overlay "Clique para ativar som"</p>
                  <p className="text-sm text-muted-foreground">
                    Exibe tela amarela pedindo para o usuário clicar e ativar o som
                  </p>
                </div>
              </div>
              <Switch
                checked={playerSettings?.useSoundOverlay ?? true}
                onCheckedChange={(checked) => 
                  updatePlayerSetting.mutate({ key: 'use_sound_overlay', value: String(checked) })
                }
              />
            </div>
            
            {/* Progress Bar Height */}
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Altura da Barra de Progresso</p>
                  <p className="text-sm text-muted-foreground">
                    Barra decorativa na parte inferior do player
                  </p>
                </div>
                <span className="text-sm font-mono bg-background px-2 py-1 rounded">
                  {playerSettings?.progressBarHeight ?? 6}px
                </span>
              </div>
              <Slider
                value={[playerSettings?.progressBarHeight ?? 6]}
                onValueCommit={(value) => 
                  updatePlayerSetting.mutate({ key: 'progress_bar_height', value: String(value[0]) })
                }
                min={2}
                max={16}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fina (2px)</span>
                <span>Grossa (16px)</span>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Sobre o Player Customizado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Autoplay mutado ao carregar (navegadores exigem)</li>
            <li>Com overlay: usuário clica para ativar som e reiniciar vídeo</li>
            <li>Sem overlay: vídeo toca direto mutado, usuário ativa som manualmente</li>
            <li>Barra de progresso decorativa em loop contínuo</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
