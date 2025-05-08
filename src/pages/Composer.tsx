
import React from 'react';
import { Editor } from '../components/composer/Editor';
import '../App.css'; // Import CSS for styling

// Add styles for the editor container
const styles = `
  .container-editor {
    display: grid;
    grid-template-columns: 2.5fr 4fr 2.5fr;
    gap: 24px;
  }

  .section-box {
    background: #ffffff;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.05);
  }

  @media (max-width: 768px) {
    .container-editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
  }
`;

const Composer: React.FC = () => {
  return (
    <div className="max-w-[1400px] mx-auto px-4">
      <style>{styles}</style>
      <Editor />
    </div>
  );
};

export default Composer;
