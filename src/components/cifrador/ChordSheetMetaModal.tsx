import React from 'react';

type ChordSheetMetaModalProps = {
  onClose: () => void;
};

export const ChordSheetMetaModal: React.FC<ChordSheetMetaModalProps> = ({ onClose }) => {
  // TODO: Formulário de metadados (título, artista, tonalidade, capo, BPM, privacidade)
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 min-w-[320px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-4">Salvar Cifra</h2>
        {/* Campos de metadados aqui */}
        <button className="btn mt-4" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
};
