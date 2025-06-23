import {createClient} from "@/lib/supabase"

export async function getClientNotifications() {
    const supabase = createClient()
    // Fetch notifications using supabase
    // ...
}