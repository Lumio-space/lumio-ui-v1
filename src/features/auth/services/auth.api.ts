import { apiClient }          from '@/lib/api/axios';
import type { LoginFormValues }  from '@/features/auth/schemas/login.schema';
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

