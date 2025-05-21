
import React from 'react';
import { Editor } from '../components/composer/Editor';
import '../App.css';

// Estilos atualizados para melhor aproveitamento do espaço
const styles = `
  .container-editor {
    display: grid;
    grid-template-columns: 1fr 3fr 1fr;
    gap: 12px;
    height: 100vh;
    width: 100vw;
    max-width: 100%;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  .section-box {
    background: #ffffff;
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.05);
    overflow: auto;
    height: 100%;
  }

  @media (max-width: 768px) {
    .container-editor {
      display: flex;
      flex-direction: column;
      gap: 8px;
      height: auto;
      padding: 8px;
    }
    
    .section-box {
      max-height: 70vh;
    }
    
    .composer-page {
      padding: 0;
      overflow-x: hidden;
      max-width: 100vw;
    }
  }
`;

const Composer: React.FC = () => {
  return (
    <div className="composer-page">
      <style>{styles}</style>
      <Editor />
    </div>
  );
};

export default Composer;
