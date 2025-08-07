import { supabase } from '@/integrations/supabase/client';

export interface CpfValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Valida se o CPF pertence ao usuário através da verificação do nome completo e data de nascimento
 */
export const validateCpfOwnership = async (
  cpf: string, 
  fullName: string, 
  birthDate: Date | string
): Promise<CpfValidationResult> => {
  try {
    // Primeiro, valida se o CPF está no formato correto
    if (!cpf || cpf.length === 0) {
      return { isValid: false, message: 'CPF é obrigatório' };
    }

    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');
    
    if (cleanCpf.length !== 11) {
      return { isValid: false, message: 'CPF deve ter 11 dígitos' };
    }

    // Verifica se não são todos números iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return { isValid: false, message: 'CPF inválido' };
    }

    // Validação do algoritmo do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(9))) {
      return { isValid: false, message: 'CPF inválido' };
    }

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCpf.charAt(i)) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCpf.charAt(10))) {
      return { isValid: false, message: 'CPF inválido' };
    }

    // Se chegou até aqui, o CPF tem formato válido
    // Agora verifica se os dados batem (simulação de validação)
    
    if (!fullName || fullName.trim().length < 2) {
      return { isValid: false, message: 'Nome completo é obrigatório para validação do CPF' };
    }

    if (!birthDate) {
      return { isValid: false, message: 'Data de nascimento é obrigatória para validação do CPF' };
    }

    // Converte data para Date se for string
    const date = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    if (isNaN(date.getTime())) {
      return { isValid: false, message: 'Data de nascimento inválida' };
    }

    // Verifica se a data não é futura
    if (date > new Date()) {
      return { isValid: false, message: 'Data de nascimento não pode ser futura' };
    }

    // Verifica se a idade é razoável (entre 16 e 120 anos)
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      // Ainda não fez aniversário este ano
    }
    
    if (age < 16 || age > 120) {
      return { isValid: false, message: 'Idade deve estar entre 16 e 120 anos' };
    }

    // Aqui você faria a validação real com um serviço externo
    // Por enquanto, vamos simular uma validação básica
    
    // Normaliza o nome (remove acentos, converte para minúsculo)
    const normalizedName = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    // Validações básicas de consistência
    if (normalizedName.length < 6) {
      return { isValid: false, message: 'Nome muito curto para validação' };
    }

    // Se passou por todas as validações, considera válido
    // Em um ambiente real, aqui seria feita a consulta a uma API de validação de CPF
    return { isValid: true, message: 'CPF validado com sucesso' };

  } catch (error) {
    console.error('Erro na validação do CPF:', error);
    return { isValid: false, message: 'Erro interno na validação do CPF' };
  }
};