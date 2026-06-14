// migrate7.mjs — Ajoute profiles.specialty
import pg from 'pg'
const { Client } = pg
const password = encodeURIComponent('Smallville!0945!')
const client = new Client({
  connectionString: `postgresql://postgres.nhpvjfyjyculnijipzoa:${password}@aws-0-eu-west-1.pooler.supabase.com:5432/postgres`
})

await client.connect()
console.log('Connected.')

await client.query(`
  ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS specialty text DEFAULT NULL
`)
console.log('✅ profiles.specialty added')

await client.query(`SELECT pg_notify('pgrst', 'reload schema')`)
console.log('✅ PostgREST schema cache reloaded')

await client.end()
console.log('Done.')
