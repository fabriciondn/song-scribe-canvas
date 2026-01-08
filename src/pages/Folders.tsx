import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FolderList } from '../components/folders/FolderList';
import { FolderPage } from '../components/folders/FolderPage';
import { MobileDraftsPage } from '../components/mobile/MobileDraftsPage';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';
import { useIsMobile } from '@/hooks/use-mobile';

const Folders: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <ProOnlyWrapper featureName="Pastas">
      <Routes>
        <Route path="/" element={isMobile ? <MobileDraftsPage /> : <FolderList />} />
        <Route path="/:folderId/*" element={<FolderPage />} />
      </Routes>
    </ProOnlyWrapper>
  );
};

export default Folders;
