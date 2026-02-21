import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as crypto from 'https://deno.land/std@0.168.0/crypto/mod.ts'
import { encode as hexEncode } from 'https://deno.land/std@0.168.0/encoding/hex.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { public_id, resource_type, my_post_id } = await req.json()

        if (!public_id || !resource_type || !my_post_id) {
            throw new Error('Missing public_id, resource_type, or my_post_id')
        }

        // 1. Verify Authentication & Authorization
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! },
                },
            }
        )

        // Get the logged-in user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Unauthorized')

        // Verify the user owns the post before deleting
        const { data: postData, error: postError } = await supabaseClient
            .from('posts')
            .select('user_id')
            .eq('id', my_post_id)
            .single()

        if (postError || !postData || postData.user_id !== user.id) {
            throw new Error('Unauthorized or Post Not Found')
        }

        // 2. Perform Cloudinary Deletion
        const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
        const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
        const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error('Cloudinary credentials not configured on the server')
        }

        const timestamp = Math.round(new Date().getTime() / 1000).toString()

        // Generate signature for Cloudinary API
        // format: public_id=...&timestamp=...{api_secret}
        const stringToSign = `public_id=${public_id}&timestamp=${timestamp}${apiSecret}`

        // encode to Uint8Array
        const encoder = new TextEncoder()
        const data = encoder.encode(stringToSign)

        // SHA-1 hash sum
        const hashBuffer = await crypto.subtle.digest('SHA-1', data)
        const signature = new TextDecoder().decode(hexEncode(new Uint8Array(hashBuffer)))

        console.log(`Attempting to delete Cloudinary resource: ${public_id}`)

        // Cloudinary Destroy API
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/${resource_type}/destroy`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    public_id: public_id,
                    signature: signature,
                    api_key: apiKey,
                    timestamp: timestamp,
                }),
            }
        )

        const result = await response.json()
        console.log('Cloudinary response:', result)

        if (result.result !== 'ok' && result.result !== 'not found') {
            throw new Error(`Cloudinary error: ${JSON.stringify(result)}`)
        }

        return new Response(JSON.stringify({ success: true, message: 'Media deleted', result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
