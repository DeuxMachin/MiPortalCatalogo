'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '@/src/shared/types/common';
import { LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS } from '@/src/shared/config/constants';

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    attemptsLeft: number;
    lockedUntil: number | null;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        attemptsLeft: LOGIN_MAX_ATTEMPTS,
        lockedUntil: null,
    });

    const login = useCallback(async (email: string, password: string) => {
        // --- Medida de seguridad: bloqueo por intentos fallidos ---
        const now = Date.now();
        if (state.lockedUntil && now < state.lockedUntil) {
            const secsLeft = Math.ceil((state.lockedUntil - now) / 1000);
            setState((s) => ({
                ...s,
                error: `Cuenta bloqueada. Intenta de nuevo en ${secsLeft} segundos.`,
            }));
            return;
        }

        // --- Medida de seguridad: validación básica de inputs ---
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !password) {
            setState((s) => ({ ...s, error: 'Completa todos los campos.' }));
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setState((s) => ({ ...s, error: 'Ingresa un correo válido.' }));
            return;
        }

        if (password.length < 6) {
            setState((s) => ({ ...s, error: 'La contraseña debe tener al menos 6 caracteres.' }));
            return;
        }

        setState((s) => ({ ...s, isLoading: true, error: null }));

        // Simulación de login (se reemplazará con Supabase)
        await new Promise((resolve) => setTimeout(resolve, 1200));

        // Mock: cualquier email con contraseña '123456' funciona
        if (password === '123456') {
            setState({
                user: {
                    name: 'Administrador',
                    email: trimmedEmail,
                    role: 'admin',
                },
                isAuthenticated: true,
                isLoading: false,
                error: null,
                attemptsLeft: LOGIN_MAX_ATTEMPTS,
                lockedUntil: null,
            });
        } else {
            const newAttempts = state.attemptsLeft - 1;
            const shouldLock = newAttempts <= 0;

            setState((s) => ({
                ...s,
                isLoading: false,
                attemptsLeft: shouldLock ? LOGIN_MAX_ATTEMPTS : newAttempts,
                lockedUntil: shouldLock ? Date.now() + LOGIN_LOCKOUT_SECONDS * 1000 : null,
                error: shouldLock
                    ? `Demasiados intentos. Cuenta bloqueada por ${LOGIN_LOCKOUT_SECONDS} segundos.`
                    : `Credenciales incorrectas. ${newAttempts} intento(s) restante(s).`,
            }));
        }
    }, [state.lockedUntil, state.attemptsLeft]);

    const logout = useCallback(() => {
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            attemptsLeft: LOGIN_MAX_ATTEMPTS,
            lockedUntil: null,
        });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return ctx;
}
