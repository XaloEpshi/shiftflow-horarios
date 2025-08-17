"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { app } from '@/lib/firebase'; // Asegúrate que firebase.ts exporta 'app'

// Aquí puedes definir los correos de los administradores
// RECUERDA: Cambia 'admin@example.com' por el correo real del administrador.
const ADMIN_EMAILS = ['admin@example.com'];

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email || '') : false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);
  
  const logout = async () => {
    await signOut(auth);
    // La redirección se maneja en HomePageView
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
