
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { ChordPositioner } from '@/components/cifrador/ChordPositioner';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';

const Cifrador: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [textWithChords, setTextWithChords] = useState<string>('');
  const [tonalidade, setTonalidade] = useState<string>('C');
  const [novaTonalidadeValue, setNovaTonalidadeValue] = useState<string>('C');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const tonalidades = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const acordes = {
    'C': ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bº'],
    'C#': ['C#', 'D#m', 'Fm', 'F#', 'G#', 'A#m', 'Cº'],
    'D': ['D', 'Em', 'F#m', 'G', 'A', 'Bm', 'C#º'],
    'D#': ['D#', 'Fm', 'Gm', 'G#', 'A#', 'Cm', 'Dº'],
    'E': ['E', 'F#m', 'G#m', 'A', 'B', 'C#m', 'D#º'],
    'F': ['F', 'Gm', 'Am', 'A#', 'C', 'Dm', 'Eº'],
    'F#': ['F#', 'G#m', 'A#m', 'B', 'C#', 'D#m', 'Fº'],
    'G': ['G', 'Am', 'Bm', 'C', 'D', 'Em', 'F#º'],
    'G#': ['G#', 'A#m', 'Cm', 'C#', 'D#', 'Fm', 'Gº'],
    'A': ['A', 'Bm', 'C#m', 'D', 'E', 'F#m', 'G#º'],
    'A#': ['A#', 'Cm', 'Dm', 'D#', 'F', 'Gm', 'Aº'],
    'B': ['B', 'C#m', 'D#m', 'E', 'F#', 'G#m', 'A#º'],
  };

  const tranposerAcordes = (de: string, para: string, texto: string): string => {
    if (de === para) return texto;
    
    const deIndex = tonalidades.indexOf(de);
    const paraIndex = tonalidades.indexOf(para);
    
    if (deIndex === -1 || paraIndex === -1) return texto;
    
    const diferenca = (paraIndex - deIndex + 12) % 12;
    
    // Padrão para encontrar acordes
    const acordeRegex = /\b([A-G][#b]?)([Mm]|dim|aug|maj|sus|[0-9]|º)?\b/g;
    
    return texto.replace(acordeRegex, (match, nota, tipo) => {
      const notaIndex = tonalidades.indexOf(nota);
      if (notaIndex !== -1) {
        const novaNota = tonalidades[(notaIndex + diferenca) % 12];
        return novaNota + (tipo || '');
      }
      return match;
    });
  };

  const handleTranspose = () => {
    const textToTranspose = textWithChords || inputText;
    
    if (!textToTranspose.trim()) {
      toast({
        title: "Texto vazio",
        description: "Por favor, insira algum texto com acordes para cifrar.",
        variant: "destructive"
      });
      return;
    }

    const resultado = tranposerAcordes(tonalidade, novaTonalidadeValue, textToTranspose);
    setOutputText(resultado);
    
    toast({
      title: "Cifra transposta",
      description: `A cifra foi transposta de ${tonalidade} para ${novaTonalidadeValue}.`
    });
  };

  const handleCopy = () => {
    if (!outputText.trim()) {
      toast({
        title: "Nada para copiar",
        description: "Transponha alguma cifra antes de copiar.",
        variant: "destructive"
      });
      return;
    }

    navigator.clipboard.writeText(outputText);
    toast({
      title: "Copiado!",
      description: "A cifra foi copiada para a área de transferência."
    });
  };

  return (
    <ProOnlyWrapper featureName="Cifrador">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Cifrador de Músicas</h1>
      
      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="simple">Modo Simples</TabsTrigger>
          <TabsTrigger value="advanced">Posicionamento Visual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="simple" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="input-text" className="mb-2 block">Texto com acordes</Label>
              <Textarea 
                id="input-text"
                ref={textareaRef}
                className="min-h-[300px] font-mono"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui a letra da música com acordes..."
              />
            </div>
            
            <div>
              <Label htmlFor="output-text" className="mb-2 block">Texto transposto</Label>
              <Textarea 
                id="output-text"
                className="min-h-[300px] font-mono"
                value={outputText}
                readOnly
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="base-text" className="mb-2 block">Letra da música (sem acordes)</Label>
              <Textarea 
                className="min-h-[200px] font-mono"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite a letra da música aqui..."
              />
            </div>
            
            <div>
              <Label className="mb-2 block">Resultado final</Label>
              <Textarea 
                className="min-h-[200px] font-mono"
                value={outputText || textWithChords}
                readOnly
              />
            </div>
          </div>
          
          <ChordPositioner 
            text={inputText} 
            onTextWithChordsChange={setTextWithChords}
          />
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 p-4 bg-muted/40 rounded-md">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <Label htmlFor="tonalidade-atual" className="mb-2 block">Tonalidade Atual</Label>
            <Select value={tonalidade} onValueChange={setTonalidade}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {tonalidades.map(tom => (
                  <SelectItem key={tom} value={tom}>{tom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="nova-tonalidade" className="mb-2 block">Nova Tonalidade</Label>
            <Select value={novaTonalidadeValue} onValueChange={setNovaTonalidadeValue}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {tonalidades.map(tom => (
                  <SelectItem key={tom} value={tom}>{tom}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleTranspose} className="bg-violet-600 hover:bg-violet-700">
            Transpor Acordes
          </Button>
          
          <Button onClick={handleCopy} variant="outline" className="ml-auto">
            Copiar Resultado
          </Button>
        </div>
        </div>
      </div>
    </ProOnlyWrapper>
  );
};

export default Cifrador;
