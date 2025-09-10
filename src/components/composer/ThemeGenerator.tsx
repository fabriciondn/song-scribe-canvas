
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Zap } from 'lucide-react';

export const ThemeGenerator: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedTheme, setGeneratedTheme] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerateTheme = async () => {
    setGenerating(true);
    
    // Simulating API call to an AI service
    try {
      // In a real implementation, this would call an actual API
      setTimeout(() => {
        const themes = [
          "Amor perdido em uma noite chuvosa",
          "Superando desafios e encontrando força interior",
          "Celebrando as pequenas alegrias da vida cotidiana",
          "Memórias de um verão inesquecível",
          "O reencontro após anos de distância"
        ];
        
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        setGeneratedTheme(randomTheme);
        setGenerating(false);
      }, 1500);
    } catch (error) {
      console.error("Error generating theme:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar um tema. Tente novamente mais tarde.",
        variant: "destructive"
      });
      setGenerating(false);
    }
  };

  return (
    <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Zap className="mr-2 h-5 w-5 text-amber-500" />
        Gerador de Temas
      </h3>
      <p className="text-sm text-muted-foreground mb-4 break-words">
        Precisa de inspiração? Gere ideias de temas para sua composição com um clique.
      </p>
      
      {generatedTheme ? (
        <div className="mb-4">
          <Textarea 
            value={generatedTheme}
            readOnly
            className="min-h-[100px] bg-muted/30 font-medium"
          />
          <div className="flex justify-end mt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setGeneratedTheme(null)}
              className="text-xs"
            >
              Limpar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleGenerateTheme}
          disabled={generating}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Gerar Tema
            </>
          )}
        </Button>
      )}
    </div>
  );
};
