import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  // User info
  role: 'free' | 'paid' | 'admin'
  token: string | null
  userId: string | null
  
  // Derived flags
  isPaid: boolean
  isAdmin: boolean
  
  // Actions
  setAuth: (role: string, token: string, userId: string) => void
  clearAuth: () => void
  updateRole: (role: string) => void
}

const initialState = {
  role: 'free' as const,
  token: null,
  userId: null,
  isPaid: false,
  isAdmin: false,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      setAuth: (role, token, userId) => {
        const isPaid = role === 'paid' || role === 'admin'
        const isAdmin = role === 'admin'
        
        set({
          role: role as 'free' | 'paid' | 'admin',
          token,
          userId,
          isPaid,
          isAdmin,
        })
      },
      
      clearAuth: () => set(initialState),
      
      updateRole: (role) => {
        const isPaid = role === 'paid' || role === 'admin'
        const isAdmin = role === 'admin'
        
        set({
          role: role as 'free' | 'paid' | 'admin',
          isPaid,
          isAdmin,
        })
      },
    }),
    {
      name: 'fossesnotes-auth-storage',
      partialize: (state) => ({
        role: state.role,
        token: state.token,
        userId: state.userId,
      }),
    }
  )
)



