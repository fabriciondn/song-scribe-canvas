export const formatCpf = (value: string): string => {
  const onlyNumbers = value.replace(/\D/g, '');
  if (onlyNumbers.length <= 11) {
    return onlyNumbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return onlyNumbers.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const validateCpf = (cpf: string): boolean => {
  const onlyNumbers = cpf.replace(/\D/g, '');
  
  if (onlyNumbers.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(onlyNumbers)) return false;
  
  // Cálculo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(onlyNumbers[i]) * (10 - i);
  }
  let digit1 = 11 - (sum % 11);
  if (digit1 > 9) digit1 = 0;
  
  // Cálculo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(onlyNumbers[i]) * (11 - i);
  }
  let digit2 = 11 - (sum % 11);
  if (digit2 > 9) digit2 = 0;
  
  // Verificar se os dígitos calculados coincidem com os informados
  return parseInt(onlyNumbers[9]) === digit1 && parseInt(onlyNumbers[10]) === digit2;
};

export const getCpfErrorMessage = (cpf: string): string | null => {
  if (!cpf) return null;
  
  const onlyNumbers = cpf.replace(/\D/g, '');
  
  if (onlyNumbers.length < 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  if (!validateCpf(cpf)) {
    return 'CPF inválido';
  }
  
  return null;
};