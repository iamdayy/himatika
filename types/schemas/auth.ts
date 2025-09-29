export interface LoginSchema {
  username: string;
  email: string;
  password: string;
}
export interface VerifyNIMSchema {
  NIM: number;
}
export interface RegisterSchema {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
}
export interface ResetPasswordSchema {
  email: string;
  NIM: number;
}
export interface ChangePasswordSchema {
  old_password: string;
  password: string;
  password_confirmation: string;
}
export interface RstPasswordSchema {
  password: string;
  password_confirmation: string;
}

export interface ChangeEmailSchema {
  NIM: number;
  username: string;
  email: string;
}
