
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Search } from 'lucide-react';

export const RhymeAssistant: React.FC = () => {
  const [word, setWord] = useState('');
  const [rhymes, setRhymes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFindRhymes = async () => {
    if (!word.trim()) {
      toast({
        title: "Palavra necessária",
        description: "Digite uma palavra para encontrar rimas.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call for rhymes
    try {
      // In a real implementation, this would call an actual rhyming API
      setTimeout(() => {
        // These are just mock rhymes based on Portuguese word endings
        const getRhymes = (input: string): string[] => {
          const ending = input.slice(-2).toLowerCase();
          
          // Dictionary of common Portuguese rhymes
          const rhymeMap: Record<string, string[]> = {
            'ar': ['amar', 'cantar', 'lugar', 'estar', 'sonhar'],
            'er': ['saber', 'poder', 'viver', 'querer', 'dizer'],
            'ir': ['sentir', 'partir', 'sorrir', 'fugir', 'seguir'],
            'or': ['amor', 'flor', 'calor', 'dor', 'maior'],
            'ur': ['futuro', 'escuro', 'puro', 'muro', 'seguro'],
            'ão': ['coração', 'paixão', 'canção', 'emoção', 'solidão'],
            'ia': ['alegria', 'dia', 'fantasia', 'melodia', 'poesia'],
            'ez': ['vez', 'talvez', 'rapidez', 'timidez', 'altivez'],
            // Removed the duplicate 'ar' key here
            'im': ['assim', 'fim', 'ruim', 'jardim', 'enfim']
          };
          
          // Default rhymes if no specific ending match
          const defaultRhymes = ['amor', 'coração', 'sentimento', 'canção', 'olhar'];
          
          return rhymeMap[ending] || defaultRhymes;
        };
        
        setRhymes(getRhymes(word));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error finding rhymes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível encontrar rimas. Tente novamente mais tarde.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleInsert = (rhyme: string) => {
    // Copy to clipboard
    navigator.clipboard.writeText(rhyme).then(
      () => {
        toast({
          title: "Copiado!",
          description: `"${rhyme}" copiado para a área de transferência.`,
        });
      },
      () => {
        toast({
          title: "Erro",
          description: "Não foi possível copiar a palavra.",
          variant: "destructive"
        });
      }
    );
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Search className="mr-2 h-5 w-5 text-blue-500" />
        Assistente de Rimas
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Encontre a palavra perfeita para completar seu verso com rimas precisas.
      </p>
      
      <div className="flex space-x-2 mb-4">
        <Input
          placeholder="Digite uma palavra"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleFindRhymes();
            }
          }}
        />
        <Button
          onClick={handleFindRhymes}
          disabled={loading}
          variant="secondary"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
        </Button>
      </div>
      
      {rhymes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rhymes.map((rhyme, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleInsert(rhyme)}
            >
              {rhyme}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};
