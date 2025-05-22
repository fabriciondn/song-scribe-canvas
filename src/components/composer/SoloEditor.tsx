
import React, { useRef } from 'react';
import { SectionButtons } from './SectionButtons';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface SoloEditorProps {
  title: string;
  content: string;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSectionClick: (sectionText: string) => void;
  onTextAreaDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export const SoloEditor: React.FC<SoloEditorProps> = ({
  title,
  content,
  onTitleChange,
  onContentChange,
  onSectionClick,
  onTextAreaDrop,
  textareaRef
}) => {
  return (
    <>
      <div className="mb-3">
        <Label htmlFor="song-title" className="text-sm font-medium">Título da Composição</Label>
        <Input 
          id="song-title" 
          value={title} 
          onChange={onTitleChange} 
          placeholder="Digite o título da sua música" 
          className="mt-1" 
        />
      </div>
      
      <SectionButtons onSectionClick={onSectionClick} />
      
      <div className="flex-1 flex flex-col">
        <Label htmlFor="song-content" className="text-sm font-medium mt-2">Letra</Label>
        <Textarea 
          id="song-content" 
          value={content} 
          onChange={onContentChange} 
          placeholder="Comece a compor sua letra aqui..." 
          className="editor-content flex-1 min-h-[450px] font-mono mt-1"
          ref={textareaRef}
          onDrop={onTextAreaDrop}
          onDragOver={(e) => e.preventDefault()}
        />
      </div>
    </>
  );
};
