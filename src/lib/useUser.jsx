import { createContext, useContext, useEffect, useState } from 'react'
import api from './axiosInstance'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('lumen_token')
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const res = await api.get('/auth/me')
        setUser({
          id: res.data.data.id,
          name: res.data.data.nama_lengkap,
          email: res.data.data.email,
          role: res.data.data.role,
          level: res.data.data.current_level
        })
      } catch (error) {
        localStorage.clear()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}