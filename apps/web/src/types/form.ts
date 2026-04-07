// ============================================================
// Form-related types
// ============================================================

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  code: string;
  password: string;
  confirmPassword: string;
}
