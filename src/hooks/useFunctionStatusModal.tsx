import { useState } from 'react';

interface FunctionStatusModalState {
  isOpen: boolean;
  status: 'coming_soon' | 'beta' | 'available';
  functionName: string;
  functionDescription?: string;
}

export const useFunctionStatusModal = () => {
  const [modalState, setModalState] = useState<FunctionStatusModalState>({
    isOpen: false,
    status: 'available',
    functionName: '',
    functionDescription: ''
  });

  const showStatusModal = (
    status: 'coming_soon' | 'beta' | 'available',
    functionName: string,
    functionDescription?: string
  ) => {
    if (status === 'available') return;
    
    setModalState({
      isOpen: true,
      status,
      functionName,
      functionDescription
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    modalState,
    showStatusModal,
    closeModal
  };
};