import { useProfile } from './useProfile';

export interface ProfileCompletionStatus {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
}

export const useProfileValidation = (): ProfileCompletionStatus => {
  const { profile } = useProfile();

  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['Perfil não carregado'],
      completionPercentage: 0
    };
  }

  const requiredFields = [
    { field: 'name', label: 'Nome completo' },
    { field: 'cpf', label: 'CPF' },
    { field: 'cellphone', label: 'Telefone' },
    { field: 'birth_date', label: 'Data de nascimento' },
    { field: 'cep', label: 'CEP' },
    { field: 'street', label: 'Endereço' },
    { field: 'city', label: 'Cidade' },
    { field: 'state', label: 'Estado' },
  ];

  const missingFields: string[] = [];

  requiredFields.forEach(({ field, label }) => {
    const value = (profile as any)[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(label);
    }
  });

  const completedFields = requiredFields.length - missingFields.length;
  const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage
  };
};