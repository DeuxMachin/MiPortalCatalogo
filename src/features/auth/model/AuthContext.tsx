'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { AuthUser, UserRole } from '@/src/shared/types/common';
import { LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_SECONDS } from '@/src/shared/config/constants';
import { getSupabaseBrowserClient } from '@/src/shared/lib/supabase';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthState {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    /** True while we check for an existing session on mount */
    isInitialising: boolean;
    error: string | null;
    attemptsLeft: number;
    lockedUntil: number | null;
}

interface AuthContextValue extends AuthState {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/*  Supabase error → user-friendly message (Spanish)                   */
/* ------------------------------------------------------------------ */

function friendlyError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid login credentials') || lower.includes('invalid_credentials'))
        return 'Correo o contraseña incorrectos.';
    if (lower.includes('email not confirmed'))
        return 'Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.';
    if (lower.includes('too many requests') || lower.includes('rate limit'))
        return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    if (lower.includes('network') || lower.includes('fetch'))
        return 'Error de conexión. Verifica tu internet e intenta de nuevo.';
    return 'Error al iniciar sesión. Intenta de nuevo.';
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
    const supabase = useRef(getSupabaseBrowserClient());

    const [state, setState] = useState<AuthState>({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isInitialising: true,
        error: null,
        attemptsLeft: LOGIN_MAX_ATTEMPTS,
        lockedUntil: null,
    });

    /* ---------- helpers ---------- */

    /**
     * Given a Supabase user id ► fetch their profile from `perfiles` table
     * and build an AuthUser object.
     */
    const buildAuthUser = useCallback(
        async (userId: string, email: string): Promise<AuthUser> => {
            let profile: { rol?: string; nombre?: string } | null = null;
            try {
                // Query the user's own profile row.
                // Requires RLS policy: perfiles_self_select (id = auth.uid())
                const { data, error: profileError } = await supabase.current
                    .from('perfiles')
                    .select('rol, nombre')
                    .eq('id', userId)
                    .single();

                if (profileError) {
                    console.warn('[Auth] Profile fetch failed:', profileError.message);
                } else {
                    profile = data ?? null;
                }
            } catch (err) {
                // Network/Abort errors should not break authentication.
                console.warn('[Auth] Profile fetch crashed:', err);
            }

            return {
                id: userId,
                name: profile?.nombre ?? email.split('@')[0],
                email,
                role: (profile?.rol as UserRole) ?? 'viewer',
            };
        },
        [],
    );

    /* ---------- initialise: restore session on mount ---------- */

    useEffect(() => {
        let ignore = false;

        const restore = async () => {
            try {
                const sessionPromise = supabase.current.auth.getSession();
                const timeoutPromise = new Promise<never>((_, reject) => {
                    setTimeout(() => reject(new Error('Auth session timeout')), 3500);
                });

                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);

                if (session?.user && !ignore) {
                    const basicUser: AuthUser = {
                        id: session.user.id,
                        name: (session.user.email ?? 'usuario').split('@')[0],
                        email: session.user.email ?? '',
                        role: 'viewer',
                    };

                    // Mark authenticated immediately, then enrich profile in background.
                    setState((s) => ({
                        ...s,
                        user: basicUser,
                        isAuthenticated: true,
                        isInitialising: false,
                    }));

                    void buildAuthUser(session.user.id, session.user.email ?? '')
                        .then((authUser) => {
                            if (ignore) return;
                            setState((s) => ({ ...s, user: authUser }));
                        })
                        .catch((err) => console.warn('[Auth] buildAuthUser failed:', err));
                } else if (!ignore) {
                    setState((s) => ({ ...s, isInitialising: false }));
                }
            } catch (err) {
                console.warn('[Auth] Session restore failed:', err);
                if (!ignore) {
                    setState((s) => ({
                        ...s,
                        user: null,
                        isAuthenticated: false,
                        isInitialising: false,
                    }));
                }
            }
        };

        restore();

        /* Listen for future auth events (sign-in, sign-out, token refresh) */
        const { data: { subscription } } = supabase.current.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_OUT' || !session) {
                    setState((s) => ({
                        ...s,
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isInitialising: false,
                    }));
                    return;
                }

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    const basicUser: AuthUser = {
                        id: session.user.id,
                        name: (session.user.email ?? 'usuario').split('@')[0],
                        email: session.user.email ?? '',
                        role: 'viewer',
                    };

                    setState((s) => ({
                        ...s,
                        user: basicUser,
                        isAuthenticated: true,
                        isLoading: false,
                        isInitialising: false,
                    }));

                    void buildAuthUser(session.user.id, session.user.email ?? '')
                        .then((authUser) => setState((s) => ({ ...s, user: authUser })))
                        .catch((err) => console.warn('[Auth] buildAuthUser failed:', err));
                }
            },
        );

        return () => {
            ignore = true;
            subscription.unsubscribe();
        };
    }, [buildAuthUser]);

    /* ---------- login ---------- */

    const login = useCallback(
        async (email: string, password: string) => {
            /* --- Rate-limit (client-side) --- */
            const now = Date.now();
            if (state.lockedUntil && now < state.lockedUntil) {
                const secsLeft = Math.ceil((state.lockedUntil - now) / 1000);
                setState((s) => ({
                    ...s,
                    error: `Cuenta bloqueada. Intenta de nuevo en ${secsLeft} segundos.`,
                }));
                return;
            }

            /* --- Input validation (XSS-safe: trim + regex) --- */
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

            /* --- Supabase sign in --- */
            const { error } = await supabase.current.auth.signInWithPassword({
                email: trimmedEmail,
                password,
            });

            if (error) {
                const newAttempts = state.attemptsLeft - 1;
                const shouldLock = newAttempts <= 0;

                setState((s) => ({
                    ...s,
                    isLoading: false,
                    attemptsLeft: shouldLock ? LOGIN_MAX_ATTEMPTS : newAttempts,
                    lockedUntil: shouldLock ? Date.now() + LOGIN_LOCKOUT_SECONDS * 1000 : null,
                    error: shouldLock
                        ? `Demasiados intentos. Cuenta bloqueada por ${LOGIN_LOCKOUT_SECONDS} segundos.`
                        : friendlyError(error.message),
                }));
                return;
            }

            // Verify session was actually persisted.
            // If not, users experience "login doesn't work" and then RLS blocks everything.
            const { data: { session } } = await supabase.current.auth.getSession();
            if (!session) {
                setState((s) => ({
                    ...s,
                    isLoading: false,
                    error: 'Inicio de sesión exitoso, pero no se pudo persistir la sesión. Borra cookies/localStorage del sitio y vuelve a intentar.',
                }));
                return;
            }

            // success: onAuthStateChange will update the state automatically.
            // Reset rate-limit counters.
            setState((s) => ({
                ...s,
                isLoading: false,
                attemptsLeft: LOGIN_MAX_ATTEMPTS,
                lockedUntil: null,
                error: null,
            }));
        },
        [state.lockedUntil, state.attemptsLeft],
    );

    /* ---------- logout ---------- */

    const logout = useCallback(async () => {
        await supabase.current.auth.signOut();
        setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialising: false,
            error: null,
            attemptsLeft: LOGIN_MAX_ATTEMPTS,
            lockedUntil: null,
        });
    }, []);

    /* ---------- render ---------- */

    return (
        <AuthContext.Provider value={{ ...state, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return ctx;
}
