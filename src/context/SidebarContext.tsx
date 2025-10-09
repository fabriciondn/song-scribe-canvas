import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  setIsSidebarOpen: (value: boolean) => void;
  setIsSidebarCollapsed: (value: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarOpen,
        isSidebarCollapsed,
        setIsSidebarOpen,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};
