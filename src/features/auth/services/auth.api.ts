import { apiClient }          from '@/lib/api/axios';
import type { LoginFormValues }  from '@/features/auth/schemas/login.schema';
import type { ForgotPasswordFormValues } from '@/features/auth/schemas/forgot-password.schema';
import type { LoginResponse }    from '../types';

export async function loginUser(credentials: LoginFormValues): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    email:    credentials.email,
    password: credentials.password,
  });
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function forgotPassword(
    credentials: ForgotPasswordFormValues
) {
  const response = await apiClient.post('/auth/forgot-password', {
    email: credentials.email,
  });

  return response.data;
}
