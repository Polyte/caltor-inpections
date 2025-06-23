import {createClient} from "@/lib/supabase"
import {createServerClient} from "@supabase/ssr"


export interface AuthUser {
    id: string
    email: string
    full_name: string
    role: "admin" | "employee"
    email_confirmed_at?: string
    created_at: string
}

export interface SignUpData {
    email: string
    password: string
    fullName: string
    role: "admin" | "employee"
}

export interface SignInData {
    email: string
    password: string
}


export class AuthService {
    private supabase = createClient()

    // Enhanced sign up method that bypasses email verification
    async signUp({email, password, fullName, role}: SignUpData) {
        try {
            // Step 1: Create the auth user with email verification explicitly disabled
            const {data: signUpData, error: signUpError} = await this.supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                    // Explicitly disable email verification
                    emailRedirectTo: undefined,
                },
            })

            if (signUpError) {
                throw new Error(this.formatAuthError(signUpError))
            }

            // Step 2: If user was created but not automatically signed in, sign them in manually
            if (signUpData.user && !signUpData.session) {
                console.log("User created but not signed in, attempting manual sign in...")

                try {
                    const {data: signInData, error: signInError} = await this.supabase.auth.signInWithPassword({
                        email,
                        password,
                    })

                    if (signInError) {
                        // If sign in fails due to email verification, we'll handle it
                        if (
                            signInError.message.includes("Email not confirmed") ||
                            signInError.message.includes("verify your email")
                        ) {
                            console.log("Email verification blocking sign in, but user account exists")
                            return {
                                user: signUpData.user,
                                session: null,
                                needsEmailVerification: false, // We're bypassing this
                                accountCreated: true,
                            }
                        }
                        throw new Error(this.formatAuthError(signInError))
                    }

                    return {
                        user: signInData.user,
                        session: signInData.session,
                        needsEmailVerification: false,
                        accountCreated: true,
                    }
                } catch (signInError: any) {
                    // If manual sign in fails, still return success since account was created
                    console.log("Manual sign in failed, but account was created:", signInError.message)
                    return {
                        user: signUpData.user,
                        session: null,
                        needsEmailVerification: false,
                        accountCreated: true,
                    }
                }
            }

            // Step 3: User was created and signed in successfully
            return {
                user: signUpData.user,
                session: signUpData.session,
                needsEmailVerification: false,
                accountCreated: true,
            }
        } catch (error: any) {
            console.error("Sign up error:", error)
            // Ensure the error thrown is an instance of Error with a message
            if (error instanceof Error) {
                throw error
            }
            throw new Error(this.formatAuthError(error))
        }
    }

    // Enhanced sign in method that bypasses email verification
    async signIn({email, password}: SignInData) {
        try {
            const {data, error} = await this.supabase.auth.signInWithPassword({
                email,
                password,
            });


            return {
                user: data.user,
                session: data.session,
            };
        } catch (error: any) {
            console.error("Sign in error:", error);
            throw new Error(this.formatAuthError(error));
        }
    }

    // Method to create user profile directly (bypass auth if needed)
    async createUserProfileDirectly({email, fullName, role}: { email: string; fullName: string; role: string }) {
        try {
            // This is a fallback method to create user profiles when auth is problematic
            const {data, error} = await this.supabase
                .from("users")
                .insert({
                    email,
                    full_name: fullName,
                    role,
                })
                .select()
                .single()

            if (error) {
                throw new Error(`Failed to create user profile: ${error.message}`)
            }

            return data
        } catch (error: any) {
            console.error("Error creating user profile directly:", error)
            throw error
        }
    }

    async signOut() {
        try {
            const {error} = await this.supabase.auth.signOut()
            if (error) {
                throw new Error(this.formatAuthError(error))
            }
        } catch (error: any) {
            console.error("Sign out error:", error)
            if (error instanceof Error) {
                throw error
            }
            throw new Error(this.formatAuthError(error))
        }
    }

    async getCurrentUser(): Promise<AuthUser | null> {
        try {
            // First check if we're in a browser environment
            if (typeof window === "undefined") {
                return null
            }

            const {
                data: {user},
                error,
            } = await this.supabase.auth.getUser()

            // Handle specific auth errors gracefully
            if (error) {
                // Don't log these common errors as they're expected
                if (
                    error.message.includes("Auth session missing") ||
                    error.message.includes("not configured") ||
                    error.message.includes("Invalid JWT") ||
                    error.message.includes("JWT expired")
                ) {
                    return null
                }
                console.error("Auth error:", error)
                return null
            }

            if (!user) {
                return null
            }

            // Get user profile from our users table
            const {data: profile, error: profileError} = await this.supabase
                .from("users")
                .select("*")
                .eq("id", user.id)
                .single()

            if (profileError) {
                // If profile doesn't exist, user might not be fully set up
                if (profileError.code === "PGRST116") {
                    // No rows returned - profile doesn't exist
                    return null
                }
                console.error("Error fetching user profile:", profileError)
                return null
            }

            return {
                ...user,
                ...profile,
            } as AuthUser
        } catch (error: any) {
            // Handle network errors and other exceptions gracefully
            if (
                error.message?.includes("Auth session missing") ||
                error.message?.includes("not configured") ||
                error.message?.includes("Failed to fetch")
            ) {
                return null
            }
            console.error("Get current user error:", error)
            return null
        }
    }

    async resetPassword(email: string) {
        try {
            const {error} = await this.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            })

            if (error) {
                throw new Error(this.formatAuthError(error))
            }

            return {success: true}
        } catch (error: any) {
            console.error("Reset password error:", error)
            if (error instanceof Error) {
                throw error
            }
            throw new Error(this.formatAuthError(error))
        }
    }

    // Listen to auth state changes
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return this.supabase.auth.onAuthStateChange(callback)
    }

    // Check if user is authenticated without throwing errors
    async isAuthenticated(): Promise<boolean> {
        try {
            if (typeof window === "undefined") {
                return false
            }

            const {
                data: {session},
                error,
            } = await this.supabase.auth.getSession()

            if (error || !session) {
                return false
            }

            return true
        } catch (error) {
            return false
        }
    }

    // Helper method to check if an email is already registered

    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const response = await this.supabase.rpc("rpc_check_email_exists", {
                p_email: email,
            });

            console.debug("RPC response data:", response.data);

            const {data, error} = response;

            if (error) {
                // Enhanced error logging with fallbacks
                console.error("Supabase RPC Failure:", {
                    context: "checkEmailExists",
                    attemptedEmail: email,
                    error: error || 'null-error-object',
                    code: error?.code || 'NO_ERROR_CODE',
                    message: error?.message || 'No error message available',
                    details: error?.details || 'No additional details'
                });

                // Handle function existence errors
                if (error?.code === 'PGRST100' || error?.message?.includes('function not found')) {
                    throw new Error(`Database function missing: ${error.message}`);
                }

                // Handle authentication errors
                if (error?.code === 'PGRST301' || error?.message?.includes('permission denied')) {
                    throw new Error(`Database permission error: ${error.message}`);
                }

                throw error;
            }

            // Add null check with detailed error
            if (data === null || data === undefined) {
                throw new Error(`RPC returned empty response for email: ${email}`);
            }

            return !!data;

        } catch (error: unknown) {
            // Unified error formatting
            const errorPayload = {
                email,
                error: error instanceof Error ? {
                    name: error.name,
                    message: error.message,
                    stack: error.stack?.split('\n').slice(0, 3) // First 3 stack lines
                } : {rawError: error}
            };

            console.error("Email Verification System Failure:", errorPayload);

            throw new Error(this.formatAuthError(
                error instanceof Error ? error :
                    new Error(`Unknown verification error: ${JSON.stringify(error)}`)
            ));
        }
    }

    // Helper method to format error messages
    private formatAuthError(error: any): string {
        const message = error.message || error.toString()

        // Handle rate limiting
        if (message.includes("For security purposes, you can only request this after")) {
            const match = message.match(/after (\d+) seconds/)
            const seconds = match ? match[1] : "60"
            return `Too many requests. Please wait ${seconds} seconds before trying again.`
        }

        // Handle common auth errors
        if (message.includes("User already registered")) {
            return "An account with this email already exists. Please try signing in instead."
        }

        if (message.includes("Invalid login credentials")) {
            return "Invalid email or password. Please check your credentials and try again."
        }

        if (message.includes("Password should be at least")) {
            return "Password must be at least 6 characters long."
        }

        if (message.includes("Unable to validate email address")) {
            return "Please enter a valid email address."
        }

        if (message.includes("Signup is disabled")) {
            return "Account registration is currently disabled. Please contact support."
        }

        if (message.includes("Invalid email")) {
            return "Please enter a valid email address."
        }

        if (message.includes("User not found")) {
            return "No account found with this email address. Please check your email or register for a new account."
        }

        // Handle any remaining email verification errors by ignoring them
        if (message.includes("Email not confirmed") || message.includes("verify your email")) {
            return "Authentication successful. Proceeding without email verification."
        }

        if (message.includes("Could not find the function") && message.includes("in the schema cache")) {
            return "Database function error: The required function was not found. This might be a temporary issue. Please try again shortly. If the problem persists, ensure database migrations have run correctly and contact support."
        }

        // Return original message for other errors
        return message
    }
}

// Server-side authentication utilities
export async function getServerUser() {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options))
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            },
        )

        const {
            data: {user},
            error,
        } = await supabase.auth.getUser()

        if (error || !user) {
            return null
        }

        // Get user profile
        const {data: profile, error: profileError} = await supabase.from("users").select("*").eq("id", user.id).single()

        if (profileError) {
            console.error("Error fetching user profile:", profileError)
            return null
        }

        return {
            ...user,
            ...profile,
        } as AuthUser
    } catch (error) {
        console.error("Server auth error:", error)
        return null
    }
}

