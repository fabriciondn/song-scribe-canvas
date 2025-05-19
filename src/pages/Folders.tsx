
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FolderList } from '../components/folders/FolderList';
import { FolderPage } from '../components/folders/FolderPage';

const Folders: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<FolderList />} />
      <Route path="/:folderId/*" element={<FolderPage />} />
    </Routes>
  );
};

export default Folders;
