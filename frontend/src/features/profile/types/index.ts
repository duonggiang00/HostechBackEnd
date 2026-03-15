export interface ProfileType {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  identity_number: string | null;
  date_of_birth: string | null;
  address: string | null;
  avatar_url: string | null;
  two_factor_confirmed_at: string | null;
  roles?: string[];
}

export interface PasswordDataType {
  current_password: string;
  password: string;
  password_confirmation: string;
}
