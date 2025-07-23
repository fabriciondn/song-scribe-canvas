
import React from 'react';
import { Editor } from '../components/composer/Editor';
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
  return (
    <div className="composer-page">
      <style>{styles}</style>
      <Editor />
    </div>
  );
};

export default Composer;
