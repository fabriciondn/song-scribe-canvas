import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Text, Image as FabricImage, Rect } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Save, 
  Download, 
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface CertificateBuilderProps {
  templateData?: any;
  onSave: (designData: any) => void;
  onCancel: () => void;
}

const CertificateBuilder = ({ templateData, onSave, onCancel }: CertificateBuilderProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [activeColor, setActiveColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(24);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [isGridVisible, setIsGridVisible] = useState(true);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    // Add grid if visible
    if (isGridVisible) {
      addGrid(canvas);
    }

    // Load existing template data if provided
    if (templateData?.design_data) {
      try {
        canvas.loadFromJSON(templateData.design_data, () => {
          canvas.renderAll();
        });
      } catch (error) {
        console.error('Error loading template data:', error);
      }
    }

    // Event handlers
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [templateData, isGridVisible]);

  const addGrid = (canvas: FabricCanvas) => {
    const gridSize = 20;
    const canvasWidth = canvas.getWidth();
    const canvasHeight = canvas.getHeight();

    // Vertical lines
    for (let i = 0; i <= canvasWidth; i += gridSize) {
      const line = new Rect({
        left: i,
        top: 0,
        width: 1,
        height: canvasHeight,
        fill: '#e5e7eb',
        selectable: false,
        evented: false,
        excludeFromExport: true
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvasHeight; i += gridSize) {
      const line = new Rect({
        left: 0,
        top: i,
        width: canvasWidth,
        height: 1,
        fill: '#e5e7eb',
        selectable: false,
        evented: false,
        excludeFromExport: true
      });
      canvas.add(line);
      canvas.sendObjectToBack(line);
    }
  };

  const addText = () => {
    if (!fabricCanvas) return;

    const text = new Text('Texto do certificado', {
      left: 100,
      top: 100,
      fill: activeColor,
      fontSize: fontSize,
      fontFamily: fontFamily,
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.renderAll();
    toast.success('Texto adicionado ao canvas');
  };

  const addRectangle = () => {
    if (!fabricCanvas) return;

    const rect = new Rect({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      fill: activeColor,
      stroke: '#000000',
      strokeWidth: 2
    });

    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();
    toast.success('Retângulo adicionado ao canvas');
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !fabricCanvas) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imgURL = e.target?.result as string;
      
      FabricImage.fromURL(imgURL).then((img) => {
        img.scale(0.5);
        img.set({
          left: 100,
          top: 100
        });
        
        fabricCanvas.add(img);
        fabricCanvas.setActiveObject(img);
        fabricCanvas.renderAll();
        toast.success('Imagem adicionada ao canvas');
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelectedObject = () => {
    if (!fabricCanvas || !selectedObject) return;

    fabricCanvas.remove(selectedObject);
    fabricCanvas.renderAll();
    setSelectedObject(null);
    toast.success('Objeto removido');
  };

  const updateSelectedObjectColor = (color: string) => {
    if (!selectedObject) return;

    if (selectedObject.type === 'text') {
      selectedObject.set('fill', color);
    } else {
      selectedObject.set('fill', color);
    }
    
    fabricCanvas?.renderAll();
  };

  const updateSelectedObjectFont = (property: string, value: any) => {
    if (!selectedObject || selectedObject.type !== 'text') return;

    selectedObject.set(property, value);
    fabricCanvas?.renderAll();
  };

  const exportCanvas = () => {
    if (!fabricCanvas) return null;

    // Hide grid before export
    const gridObjects = fabricCanvas.getObjects().filter(obj => obj.excludeFromExport);
    gridObjects.forEach(obj => obj.set('visible', false));

    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2
    });

    // Show grid again
    gridObjects.forEach(obj => obj.set('visible', true));
    fabricCanvas.renderAll();

    return dataURL;
  };

  const handleSave = () => {
    if (!fabricCanvas) return;

    // Hide grid before saving
    const gridObjects = fabricCanvas.getObjects().filter(obj => obj.excludeFromExport);
    gridObjects.forEach(obj => obj.set('visible', false));

    const designData = fabricCanvas.toJSON();
    
    // Show grid again
    gridObjects.forEach(obj => obj.set('visible', true));
    fabricCanvas.renderAll();

    onSave(designData);
  };

  const downloadImage = () => {
    const dataURL = exportCanvas();
    if (!dataURL) return;

    const link = document.createElement('a');
    link.download = 'certificado.png';
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagem baixada com sucesso');
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    
    if (isGridVisible) {
      addGrid(fabricCanvas);
    }
    
    fabricCanvas.renderAll();
    setSelectedObject(null);
    toast.success('Canvas limpo');
  };

  const toggleGrid = () => {
    if (!fabricCanvas) return;
    
    const newGridState = !isGridVisible;
    setIsGridVisible(newGridState);
    
    // Remove existing grid
    const gridObjects = fabricCanvas.getObjects().filter(obj => obj.excludeFromExport);
    gridObjects.forEach(obj => fabricCanvas.remove(obj));
    
    // Add grid if visible
    if (newGridState) {
      addGrid(fabricCanvas);
    }
    
    fabricCanvas.renderAll();
  };

  return (
    <div className="flex h-screen">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Construtor de Certificado</h2>
          <div className="flex items-center space-x-2">
            <Button onClick={toggleGrid} variant="outline" size="sm">
              {isGridVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Grade
            </Button>
            <Button onClick={downloadImage} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Baixar
            </Button>
            <Button onClick={clearCanvas} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg p-4">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-2">
          <Button onClick={onCancel} variant="outline">
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Template
          </Button>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 p-4 border-l bg-gray-50 overflow-y-auto">
        {/* Tools */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Ferramentas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={addText} className="w-full justify-start">
              <Type className="w-4 h-4 mr-2" />
              Adicionar Texto
            </Button>
            
            <Button onClick={addRectangle} className="w-full justify-start" variant="outline">
              <Square className="w-4 h-4 mr-2" />
              Adicionar Retângulo
            </Button>
            
            <div>
              <Label htmlFor="image-upload" className="cursor-pointer">
                <div className="flex items-center justify-center w-full h-10 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Adicionar Imagem
                </div>
              </Label>
              <Input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Global Properties */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Propriedades Globais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="color-picker">Cor</Label>
              <Input
                id="color-picker"
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="w-full h-10"
              />
            </div>
            
            <div>
              <Label htmlFor="font-size">Tamanho da Fonte</Label>
              <Input
                id="font-size"
                type="number"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                min="8"
                max="72"
              />
            </div>
            
            <div>
              <Label htmlFor="font-family">Família da Fonte</Label>
              <select
                id="font-family"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full p-2 border border-input rounded-md"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Object Properties */}
        {selectedObject && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Objeto Selecionado
                <Badge variant="outline">{selectedObject.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Cor</Label>
                <Input
                  type="color"
                  value={selectedObject.fill || '#000000'}
                  onChange={(e) => updateSelectedObjectColor(e.target.value)}
                  className="w-full h-10"
                />
              </div>
              
              {selectedObject.type === 'text' && (
                <>
                  <div>
                    <Label>Texto</Label>
                    <Input
                      value={selectedObject.text || ''}
                      onChange={(e) => {
                        selectedObject.set('text', e.target.value);
                        fabricCanvas?.renderAll();
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Tamanho da Fonte</Label>
                    <Input
                      type="number"
                      value={selectedObject.fontSize || 24}
                      onChange={(e) => updateSelectedObjectFont('fontSize', parseInt(e.target.value))}
                      min="8"
                      max="72"
                    />
                  </div>
                  
                  <div>
                    <Label>Família da Fonte</Label>
                    <select
                      value={selectedObject.fontFamily || 'Arial'}
                      onChange={(e) => updateSelectedObjectFont('fontFamily', e.target.value)}
                      className="w-full p-2 border border-input rounded-md"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </>
              )}
              
              <Separator />
              
              <Button 
                onClick={deleteSelectedObject} 
                variant="destructive" 
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Objeto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CertificateBuilder;