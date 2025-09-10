import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThumbsUp, MessageCircle, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SegmentApproval {
  id: string;
  segment_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  user_name: string;
}

interface SegmentComment {
  id: string;
  segment_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  user_name: string;
}

interface SegmentApprovalSystemProps {
  partnershipId: string;
  selectedText: string;
  segmentId: string;
  onClose: () => void;
  authors: Record<string, { id: string; name: string; color: string }>;
}

export const SegmentApprovalSystem: React.FC<SegmentApprovalSystemProps> = ({
  partnershipId,
  selectedText,
  segmentId,
  onClose,
  authors
}) => {
  const [approvals, setApprovals] = useState<SegmentApproval[]>([]);
  const [comments, setComments] = useState<SegmentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [userApprovalStatus, setUserApprovalStatus] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load approvals and comments
  useEffect(() => {
    if (!segmentId) return;

    const loadData = async () => {
      try {
        // Load approvals
        const { data: approvalsData, error: approvalsError } = await supabase
          .from('segment_approvals')
          .select('*')
          .eq('partnership_id', partnershipId)
          .eq('segment_id', segmentId);

        if (approvalsError) throw approvalsError;

        // Format approvals with author names
        const formattedApprovals: SegmentApproval[] = (approvalsData || []).map(approval => ({
          ...approval,
          status: approval.status as 'pending' | 'approved' | 'rejected',
          user_name: authors[approval.user_id]?.name || 'Usuário'
        }));

        setApprovals(formattedApprovals);

        // Find current user's approval status
        const userApproval = formattedApprovals.find(a => a.user_id === user?.id);
        setUserApprovalStatus(userApproval?.status || null);

        // Load comments
        const { data: commentsData, error: commentsError } = await supabase
          .from('segment_comments')
          .select('*')
          .eq('partnership_id', partnershipId)
          .eq('segment_id', segmentId)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;

        // Format comments with author names
        const formattedComments: SegmentComment[] = (commentsData || []).map(comment => ({
          ...comment,
          user_name: authors[comment.user_id]?.name || 'Usuário'
        }));

        setComments(formattedComments);
      } catch (error) {
        console.error('Error loading segment data:', error);
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as aprovações e comentários.',
          variant: 'destructive',
        });
      }
    };

    loadData();
  }, [partnershipId, segmentId, user?.id, authors]);

  const handleApproval = async (status: 'approved' | 'rejected') => {
    if (!user?.id) return;

    try {
      // Check if user already has an approval for this segment
      const existingApproval = approvals.find(a => a.user_id === user.id);

      if (existingApproval) {
        // Update existing approval
        const { error } = await supabase
          .from('segment_approvals')
          .update({
            status,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingApproval.id);

        if (error) throw error;
      } else {
        // Create new approval
        const { error } = await supabase
          .from('segment_approvals')
          .insert({
            partnership_id: partnershipId,
            segment_id: segmentId,
            user_id: user.id,
            status
          });

        if (error) throw error;
      }

      setUserApprovalStatus(status);
      
      // Update local approvals state
      setApprovals(prev => {
        const filtered = prev.filter(a => a.user_id !== user.id);
        return [...filtered, {
          id: existingApproval?.id || 'temp',
          segment_id: segmentId,
          user_id: user.id,
          status,
          user_name: authors[user.id]?.name || 'Você'
        }];
      });

      toast({
        title: status === 'approved' ? 'Trecho aprovado' : 'Trecho rejeitado',
        description: `Você ${status === 'approved' ? 'aprovou' : 'rejeitou'} este trecho.`,
      });
    } catch (error) {
      console.error('Error handling approval:', error);
      toast({
        title: 'Erro na aprovação',
        description: 'Não foi possível registrar sua aprovação.',
        variant: 'destructive',
      });
    }
  };

  const submitComment = async () => {
    if (!newComment.trim() || !user?.id) return;

    try {
      const { error } = await supabase
        .from('segment_comments')
        .insert({
          partnership_id: partnershipId,
          segment_id: segmentId,
          user_id: user.id,
          comment: newComment.trim()
        });

      if (error) throw error;

      // Add to local state
      const newCommentObj: SegmentComment = {
        id: 'temp-' + Date.now(),
        segment_id: segmentId,
        user_id: user.id,
        comment: newComment.trim(),
        created_at: new Date().toISOString(),
        user_name: authors[user.id]?.name || 'Você'
      };

      setComments(prev => [...prev, newCommentObj]);
      setNewComment('');
      setIsCommentDialogOpen(false);

      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi adicionado com sucesso.',
      });
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Erro ao comentar',
        description: 'Não foi possível adicionar seu comentário.',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <X className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-card-foreground">Aprovação do Trecho</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Selected text */}
      <div className="bg-muted p-3 rounded-md">
        <p className="text-sm font-medium text-muted-foreground mb-1">Trecho selecionado:</p>
        <p className="text-card-foreground italic">"{selectedText}"</p>
      </div>

      {/* User action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleApproval('approved')}
          variant={userApprovalStatus === 'approved' ? 'default' : 'outline'}
          size="sm"
          className="flex-1"
        >
          <ThumbsUp className="h-4 w-4 mr-2" />
          {userApprovalStatus === 'approved' ? 'Aprovado' : 'Aprovar'}
        </Button>
        
        <Button
          onClick={() => handleApproval('rejected')}
          variant={userApprovalStatus === 'rejected' ? 'destructive' : 'outline'}
          size="sm"
          className="flex-1"
        >
          <X className="h-4 w-4 mr-2" />
          {userApprovalStatus === 'rejected' ? 'Rejeitado' : 'Rejeitar'}
        </Button>
        
        <Button
          onClick={() => setIsCommentDialogOpen(true)}
          variant="outline"
          size="sm"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Opinar
        </Button>
      </div>

      {/* Approvals list */}
      {approvals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-card-foreground">Aprovações:</h4>
          <div className="space-y-1">
            {approvals.map((approval) => (
              <div key={approval.id} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{approval.user_name}</span>
                <Badge className={`text-xs ${getStatusColor(approval.status)}`}>
                  {getStatusIcon(approval.status)}
                  <span className="ml-1">
                    {approval.status === 'approved' ? 'Aprovado' : 
                     approval.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                  </span>
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-card-foreground">Comentários:</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-muted p-2 rounded text-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-muted-foreground">{comment.user_name}</span>
                  <span className="text-xs text-muted-foreground">{formatTime(comment.created_at)}</span>
                </div>
                <p className="text-card-foreground break-words">{comment.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comment dialog */}
      <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
            <DialogDescription>
              Compartilhe sua opinião sobre este trecho da composição.
            </DialogDescription>
          </DialogHeader>
          
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Digite seu comentário..."
            className="min-h-[100px]"
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submitComment} disabled={!newComment.trim()}>
              Enviar Comentário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};