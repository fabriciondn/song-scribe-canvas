import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Video, Trash2, Loader2, ExternalLink } from 'lucide-react';
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

        {/* Info */}
        <div className="bg-gray-800/50 rounded-lg p-4 text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Sobre o Player Customizado:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Autoplay com som (requer interação do usuário para ativar)</li>
            <li>Barra de progresso visual animada (apenas decorativa)</li>
            <li>Vídeo em loop contínuo</li>
            <li>Controles de play/pause ao clicar</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
