import {createBrowserClient} from "@supabase/ssr"

export function createClient() {
    // Check if we're in the browser environment
    if (typeof window === "undefined") {
        // Server-side: return a mock client to prevent build errors
        return {
            auth: {
                getUser: () => Promise.resolve({data: {user: null}, error: new Error("Server-side mock")}),
                onAuthStateChange: () => ({
                    data: {
                        subscription: {
                            unsubscribe: () => {
                            }
                        }
                    }
                }),
                signOut: () => Promise.resolve({error: null}),
                signUp: () => Promise.resolve({
                    data: {user: null, session: null},
                    error: new Error("Server-side mock")
                }),
                signInWithPassword: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Server-side mock")}),
                resend: () => Promise.resolve({error: new Error("Server-side mock")}),
                resetPasswordForEmail: () => Promise.resolve({error: new Error("Server-side mock")}),
                exchangeCodeForSession: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Server-side mock")}),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({data: null, error: new Error("Server-side mock")}),
                        range: () => Promise.resolve({data: [], error: new Error("Server-side mock")}),
                    }),
                    order: () => ({
                        range: () => Promise.resolve({data: [], error: new Error("Server-side mock")}),
                    }),
                    is: () => ({
                        is: () => Promise.resolve({count: 0, error: new Error("Server-side mock")}),
                    }),
                }),
                insert: () => ({
                    select: () => Promise.resolve({data: null, error: new Error("Server-side mock")}),
                }),
                update: () => ({
                    eq: () => Promise.resolve({error: new Error("Server-side mock")}),
                }),
                delete: () => ({
                    eq: () => Promise.resolve({error: new Error("Server-side mock")}),
                }),
            }),
            channel: () => ({
                on: () => ({
                    subscribe: () => ({
                        unsubscribe: () => {
                        }
                    }),
                }),
            }),
            rpc: () => Promise.resolve({data: null, error: new Error("Server-side mock")}),
        } as any
    }

    // Client-side: check for environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("Supabase environment variables not configured")

        // Return a mock client to prevent crashes
        return {
            auth: {
                getUser: () => Promise.resolve({data: {user: null}, error: new Error("Supabase not configured")}),
                onAuthStateChange: () => ({
                    data: {
                        subscription: {
                            unsubscribe: () => {
                            }
                        }
                    }
                }),
                signOut: () => Promise.resolve({error: null}),
                signUp: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
                signInWithPassword: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
                resend: () => Promise.resolve({error: new Error("Supabase not configured")}),
                resetPasswordForEmail: () => Promise.resolve({error: new Error("Supabase not configured")}),
                exchangeCodeForSession: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
                        range: () => Promise.resolve({data: [], error: new Error("Supabase not configured")}),
                    }),
                    order: () => ({
                        range: () => Promise.resolve({data: [], error: new Error("Supabase not configured")}),
                    }),
                    is: () => ({
                        is: () => Promise.resolve({count: 0, error: new Error("Supabase not configured")}),
                    }),
                }),
                insert: () => ({
                    select: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
                }),
                update: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase not configured")}),
                }),
                delete: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase not configured")}),
                }),
            }),
            channel: () => ({
                on: () => ({
                    subscribe: () => ({
                        unsubscribe: () => {
                        }
                    }),
                }),
            }),
            rpc: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
        } as any
    }

    // Check for placeholder values
    if (supabaseUrl.includes("your-project-ref") || supabaseAnonKey.includes("your-anon-key")) {
        console.warn("Supabase environment variables contain placeholder values")

        return {
            auth: {
                getUser: () => Promise.resolve({data: {user: null}, error: new Error("Supabase not configured")}),
                onAuthStateChange: () => ({
                    data: {
                        subscription: {
                            unsubscribe: () => {
                            }
                        }
                    }
                }),
                signOut: () => Promise.resolve({error: null}),
                signUp: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
                signInWithPassword: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
                resend: () => Promise.resolve({error: new Error("Supabase not configured")}),
                resetPasswordForEmail: () => Promise.resolve({error: new Error("Supabase not configured")}),
                exchangeCodeForSession: () =>
                    Promise.resolve({data: {user: null, session: null}, error: new Error("Supabase not configured")}),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
                        range: () => Promise.resolve({data: [], error: new Error("Supabase not configured")}),
                    }),
                    order: () => ({
                        range: () => Promise.resolve({data: [], error: new Error("Supabase not configured")}),
                    }),
                    is: () => ({
                        is: () => Promise.resolve({count: 0, error: new Error("Supabase not configured")}),
                    }),
                }),
                insert: () => ({
                    select: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
                }),
                update: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase not configured")}),
                }),
                delete: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase not configured")}),
                }),
            }),
            channel: () => ({
                on: () => ({
                    subscribe: () => ({
                        unsubscribe: () => {
                        }
                    }),
                }),
            }),
            rpc: () => Promise.resolve({data: null, error: new Error("Supabase not configured")}),
        } as any
    }

    try {
        return createBrowserClient(supabaseUrl, supabaseAnonKey)
    } catch (error) {
        console.error("Failed to create Supabase client:", error)

        // Return mock client as fallback
        return {
            auth: {
                getUser: () => Promise.resolve({
                    data: {user: null},
                    error: new Error("Supabase client creation failed")
                }),
                onAuthStateChange: () => ({
                    data: {
                        subscription: {
                            unsubscribe: () => {
                            }
                        }
                    }
                }),
                signOut: () => Promise.resolve({error: null}),
                signUp: () =>
                    Promise.resolve({
                        data: {user: null, session: null},
                        error: new Error("Supabase client creation failed")
                    }),
                signInWithPassword: () =>
                    Promise.resolve({
                        data: {user: null, session: null},
                        error: new Error("Supabase client creation failed")
                    }),
                resend: () => Promise.resolve({error: new Error("Supabase client creation failed")}),
                resetPasswordForEmail: () => Promise.resolve({error: new Error("Supabase client creation failed")}),
                exchangeCodeForSession: () =>
                    Promise.resolve({
                        data: {user: null, session: null},
                        error: new Error("Supabase client creation failed")
                    }),
            },
            from: () => ({
                select: () => ({
                    eq: () => ({
                        single: () => Promise.resolve({
                            data: null,
                            error: new Error("Supabase client creation failed")
                        }),
                        range: () => Promise.resolve({data: [], error: new Error("Supabase client creation failed")}),
                    }),
                    order: () => ({
                        range: () => Promise.resolve({data: [], error: new Error("Supabase client creation failed")}),
                    }),
                    is: () => ({
                        is: () => Promise.resolve({count: 0, error: new Error("Supabase client creation failed")}),
                    }),
                }),
                insert: () => ({
                    select: () => Promise.resolve({data: null, error: new Error("Supabase client creation failed")}),
                }),
                update: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase client creation failed")}),
                }),
                delete: () => ({
                    eq: () => Promise.resolve({error: new Error("Supabase client creation failed")}),
                }),
            }),
            channel: () => ({
                on: () => ({
                    subscribe: () => ({
                        unsubscribe: () => {
                        }
                    }),
                }),
            }),
            rpc: () => Promise.resolve({data: null, error: new Error("Supabase client creation failed")}),
        } as any
    }
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
    if (typeof window === "undefined") return false

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    return !!(
        supabaseUrl &&
        supabaseAnonKey &&
        !supabaseUrl.includes("https://ymyqnuqoaymmeazgqxyo.supabase.co") &&
        !supabaseAnonKey.includes("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlteXFudXFvYXltbWVhemdxeHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MDUzNDYsImV4cCI6MjA2NTk4MTM0Nn0.gQAPuCNA_Pp7LER-ohjAfJybHeanhfl6BM6tpL1c3Vw")
    )
}



