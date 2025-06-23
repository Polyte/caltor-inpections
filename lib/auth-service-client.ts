import {createClient} from "@/lib/supabase"

export async function getClientAuthUser() {
    const supabase = createClient()
    const {data: {user}} = await supabase.auth.getUser()
    return user
}