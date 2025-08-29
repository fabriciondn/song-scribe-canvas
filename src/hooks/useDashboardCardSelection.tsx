
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'dashboard-card-selection';

export const useDashboardCardSelection = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['compositions', 'partnerships', 'registeredWorks', 'folders']);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setExpandedSections(parsed);
      } catch (error) {
        console.error('Erro ao carregar seleção de cards:', error);
      }
    }
  }, []);

  const handleToggleSection = (section: string) => {
    const newSections = expandedSections.includes(section) 
      ? expandedSections.filter(s => s !== section)
      : [...expandedSections, section];
    
    setExpandedSections(newSections);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSections));
  };

  const isCardVisible = (section: string) => 
    expandedSections.includes(section);

  const isExpanded = (section: string) => 
    expandedSections.includes('all') || expandedSections.includes(section);

  return {
    expandedSections,
    handleToggleSection,
    isExpanded,
    isCardVisible
  };
};
