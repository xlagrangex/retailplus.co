import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { User } from '../types'
import { getUsers } from '../data/mock'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('logplus_current_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = useCallback((email: string, _password: string) => {
    // Mock: any password works, just check email exists
    const users = getUsers()
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())
    if (found) {
      setUser(found)
      localStorage.setItem('logplus_current_user', JSON.stringify(found))
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('logplus_current_user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
