import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  RotateCcw, 
  File, 
  Folder, 
  FileText, 
  Music,
  Calendar,
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getTrashItems, restoreItem, cleanupExpiredTrashItems, TrashItem } from '@/services/trashService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Trash: React.FC = () => {
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTrashItems();
  }, []);

  const loadTrashItems = async () => {
    try {
      setLoading(true);
      
      // First, cleanup expired items (older than 7 days)
      const deletedCount = await cleanupExpiredTrashItems();
      if (deletedCount > 0) {
        console.log(`${deletedCount} itens expirados foram removidos permanentemente.`);
      }
      
      // Then load remaining items
      const items = await getTrashItems();
      setTrashItems(items);
    } catch (error) {
      console.error('Erro ao carregar lixeira:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os itens da lixeira.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: TrashItem) => {
    try {
      setRestoringId(item.id);
      await restoreItem(item);
      await loadTrashItems();
      toast({
        title: 'Item restaurado',
        description: `${getItemTypeLabel(item.type)} "${item.title}" foi restaurado com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao restaurar item:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível restaurar o item.',
        variant: 'destructive'
      });
    } finally {
      setRestoringId(null);
    }
  };

  const getItemTypeLabel = (type: TrashItem['type']): string => {
    switch (type) {
      case 'song': return 'Música';
      case 'draft': return 'Rascunho';
      case 'folder': return 'Pasta';
      case 'template': return 'Template';
      case 'music_base': return 'Base Musical';
      default: return 'Item';
    }
  };

  const getItemIcon = (type: TrashItem['type']) => {
    switch (type) {
      case 'song': return <File className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'folder': return <Folder className="h-4 w-4" />;
      case 'template': return <FileText className="h-4 w-4" />;
      case 'music_base': return <Music className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getDaysRemaining = (deletedAt: string): number => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysRemaining);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trash2 className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Lixeira</h1>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-2 sm:p-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Trash2 className="h-5 w-5 sm:h-6 sm:w-6" />
        <h1 className="text-xl sm:text-2xl font-bold">Lixeira</h1>
      </div>

      {trashItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Trash2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Lixeira vazia</h3>
            <p className="text-gray-600">
              Nenhum item foi excluído recentemente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-800 text-sm sm:text-base">Exclusão automática</h4>
              <p className="text-xs sm:text-sm text-yellow-700 mt-1">
                Itens excluídos permanentemente após 7 dias.
              </p>
            </div>
          </div>

          {trashItems.map((item) => {
            const daysRemaining = getDaysRemaining(item.deleted_at);
            return (
              <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2 sm:pb-3">
                  {/* Mobile Layout */}
                  <div className="sm:hidden">
                    <div className="flex items-start gap-2 mb-2">
                      {getItemIcon(item.type)}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{item.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {getItemTypeLabel(item.type)}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="truncate">
                              {formatDistanceToNow(new Date(item.deleted_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      {daysRemaining > 0 ? (
                        <Badge 
                          variant={daysRemaining <= 2 ? "destructive" : "outline"}
                          className="text-xs flex-shrink-0"
                        >
                          {daysRemaining}d
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-xs flex-shrink-0">
                          Expira hoje
                        </Badge>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={restoringId === item.id}
                            className="text-xs px-2 h-8"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Restaurar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="mx-4">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base">Restaurar item</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              Restaurar "{item.title}"? O item voltará para sua localização original.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="text-sm">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestore(item)} className="text-sm">
                              Restaurar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getItemIcon(item.type)}
                        <div>
                          <CardTitle className="text-lg">{item.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {getItemTypeLabel(item.type)}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              Excluído {formatDistanceToNow(new Date(item.deleted_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {daysRemaining > 0 ? (
                          <Badge 
                            variant={daysRemaining <= 2 ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {daysRemaining} dia{daysRemaining !== 1 ? 's' : ''} restante{daysRemaining !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">
                            Expira hoje
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={restoringId === item.id}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Restaurar item</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja restaurar "{item.title}"? 
                                O item será movido de volta para sua localização original.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRestore(item)}>
                                Restaurar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {item.content && (
                  <CardContent className="pt-0">
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {item.content.length > (window.innerWidth < 768 ? 80 : 100)
                          ? `${item.content.substring(0, window.innerWidth < 768 ? 80 : 100)}...` 
                          : item.content
                        }
                      </p>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Trash;