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
 * Máscara para Telefone ((00) 00000-0000)
 */
export function maskPhone(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(-\d{4})\d+?$/, "$1");
}
