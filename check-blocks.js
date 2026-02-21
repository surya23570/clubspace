import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env') })
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
    const { data, error } = await supabase.from('blocks').select('*')
    if (error) {
        console.error("Error fetching blocks:", error)
    } else {
        console.log("Blocks table currently contains:")
        console.dir(data)
    }
}

run()
