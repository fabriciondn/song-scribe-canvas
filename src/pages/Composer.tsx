
import React from 'react';
import { Editor } from '../components/composer/Editor';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import '../App.css';

// Mobile-first responsive styles
const styles = `
  @media (max-width: 768px) {
    .composer-page {
      padding: 0;
      overflow-x: hidden;
      max-width: 100vw;
      background: hsl(var(--background));
    }
  }
  
  @media (min-width: 769px) {
    .composer-page {
      height: 100vh;
      overflow: hidden;
    }
  }
`;

const Composer: React.FC = () => {
  const handleToolsRequest = () => {
    console.log('Tools request received');
  };

  return (
    <ProOnlyWrapper featureName="Compor">
      <div className="composer-page">
        <style>{styles}</style>
        <Editor onToolsRequest={handleToolsRequest} />
      </div>
    </ProOnlyWrapper>
  );
};

export default Composer;
