import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const dummyUsers = [
    {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'seller1@tokoblitar.com',
        password: 'password123',
        user_metadata: { full_name: 'Budi Minimalis' }
    },
    {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'seller2@tokoblitar.com',
        password: 'password123',
        user_metadata: { full_name: 'Siti Cyberpunk' }
    },
    {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'seller3@tokoblitar.com',
        password: 'password123',
        user_metadata: { full_name: 'Agus Retro' }
    }
]

async function seedUsers() {
    console.log('Seeding Supabase Dummy Auth Users...')

    for (const u of dummyUsers) {
        // Check if user exists first based on email
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const isExist = existingUser?.users.find(user => user.email === u.email)

        if (isExist) {
            console.log(`User ${u.email} already exists, skipping...`)
            continue
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: u.user_metadata
        })

        if (error) {
            console.error(`Error creating ${u.email}:`, error.message)
        } else {
            console.log(`Successfully created user: ${u.email} with Auth ID: ${data.user.id}`)
            console.log(`\n⚠️  ACTION REQUIRED for ${u.email}:`)
            console.log(`Please open 'supabase/migrations/017_seed_dummy_stores.sql'`)
            console.log(`Find '${u.id}' and REPLACE it with -> '${data.user.id}'\n`)
        }
    }

    console.log('\n--- HOW TO USE DUMMY SEEDING ---')
    console.log('1. Run this Node script first: node seed_dummy_users.mjs')
    console.log('2. Copy the newly generated Auth UUIDs printed above.')
    console.log('3. Open supabase/migrations/017_seed_dummy_stores.sql in your editor.')
    console.log('4. Replace the hard-coded 11111111... IDs with these real Auth UUIDs.')
    console.log('5. Copy the entire 017_seed_dummy_stores.sql content and RUN IT in your Supabase SQL Editor.')
    console.log('6. Done! Login to tokoblitar.com using seller1@tokoblitar.com (pw: password123)')
}

seedUsers()
