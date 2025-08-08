
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FolderList } from '../components/folders/FolderList';
import { FolderPage } from '../components/folders/FolderPage';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';

const Folders: React.FC = () => {
  return (
    <ProOnlyWrapper featureName="Pastas">
      <Routes>
        <Route path="/" element={<FolderList />} />
        <Route path="/:folderId/*" element={<FolderPage />} />
      </Routes>
    </ProOnlyWrapper>
  );
};

export default Folders;
