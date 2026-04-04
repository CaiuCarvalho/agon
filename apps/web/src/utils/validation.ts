/**
 * Valida um CPF (Cadastro de Pessoa Física) brasileiro.
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11 || /^(\d)\1{10}$/.test(cleanCPF)) return false;
  const digits = cleanCPF.split("").map(Number);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i] * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== digits[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i] * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== digits[10]) return false;
  return true;
}

/**
 * Valida CPF ou CNPJ básico (apenas tamanho e CPF checksum).
 */
export function validateTaxId(taxId: string): boolean {
  if (!taxId) return false;
  const clean = taxId.replace(/\D/g, "");
  if (clean.length === 11) return validateCPF(clean);
  // CNPJ validation can be added here if needed, but for Fanfare CPF is the main focus
  return clean.length === 11 || clean.length === 14;
}

/**
 * Máscara para CPF (000.000.000-00)
 */
export function maskCPF(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

/**
 * Máscara para CEP (00000-000)
 */
export function maskCEP(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{3})\d+?$/, "$1");
}

/**
 * Valida um telefone brasileiro (10-11 dígitos).
 * Aceita formatos: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function validatePhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, "");
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

/**
 * Máscara para Telefone ((00) 00000-0000)
 */
export function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}

/**
 * Valida um CEP (Código de Endereçamento Postal) brasileiro.
 * Aceita apenas strings com exatamente 8 dígitos.
 */
export function validateZipCode(zipCode: string): boolean {
  const cleanZipCode = zipCode.replace(/\D/g, "");
  return cleanZipCode.length === 8;
}

/**
 * Valida um código de estado brasileiro (UF).
 * Aceita apenas strings com exatamente 2 caracteres.
 */
export function validateState(state: string): boolean {
  return state.length === 2;
}

/**
 * Valida campos obrigatórios de endereço.
 * Rejeita valores vazios ou apenas com espaços em branco.
 */
export function validateRequiredFields(fields: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}): boolean {
  return !!(
    fields.street?.trim() &&
    fields.number?.trim() &&
    fields.neighborhood?.trim() &&
    fields.city?.trim()
  );
}
