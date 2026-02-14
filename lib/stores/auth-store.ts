import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'sonner';
import { authApi, User, SignupData, LoginData } from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  signup: (data: SignupData) => Promise<boolean>;
  login: (data: LoginData) => Promise<boolean>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      signup: async (data: SignupData) => {
        set({ isLoading: true, error: null });

        const response = await authApi.signup(data);

        if (response.success && response.data) {
          const { user, token } = response.data;

          localStorage.setItem('auth_token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success(`Welcome, ${user.name}!`);
          return true;
        }

        const errorMsg = response.message || 'Signup failed';
        set({
          isLoading: false,
          error: errorMsg,
        });
        toast.error(errorMsg);

        return false;
      },

      login: async (data: LoginData) => {
        set({ isLoading: true, error: null });

        const response = await authApi.login(data);

        if (response.success && response.data) {
          const { user, token } = response.data;

          localStorage.setItem('auth_token', token);

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success(`Welcome back, ${user.name}!`);
          return true;
        }

        const errorMsg = response.message || 'Login failed';
        set({
          isLoading: false,
          error: errorMsg,
        });
        toast.error(errorMsg);

        return false;
      },

      logout: () => {
        localStorage.removeItem('auth_token');

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      fetchProfile: async () => {
        const { token } = get();

        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });

        const response = await authApi.getProfile();

        if (response.success && response.data) {
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
