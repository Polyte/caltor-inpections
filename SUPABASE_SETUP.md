# Supabase Setup Instructions

## Error: Your project's URL and Key are required to create a Supabase client!

If you're seeing this error, it means that your Supabase environment variables are not properly configured. Follow these steps to resolve the issue:

## Step 1: Get Your Supabase Project Credentials

1. Log in to your Supabase account at [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one if you haven't already)
3. Go to Project Settings > API
4. You'll need two values:
   - **Project URL**: Found in the "Project URL" section
   - **Project API Keys**: Use the "anon" public key from the "Project API keys" section

## Step 2: Configure Environment Variables

Create or update the `.env.local` file in the root of your project with the following content:

```
# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Replace:
- `your_project_url` with your actual Supabase project URL (e.g., https://abcdefghijklm.supabase.co)
- `your_anon_key` with your actual Supabase anon key

## Step 3: Restart Your Development Server

After updating the environment variables, restart your development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Important Notes

- The `.env.local` file is excluded from version control for security reasons. Each developer needs to set up their own local environment variables.
- For production deployments, you'll need to configure these environment variables in your hosting platform (Vercel, Netlify, etc.).
- Never commit your Supabase API keys to version control.
- The "anon" key is safe to use in browser environments as it has limited permissions, but you should still keep it private when possible.

## Troubleshooting

If you're still experiencing issues after following these steps:

1. Make sure there are no typos in your environment variable names or values
2. Verify that your Supabase project is active and the API is enabled
3. Check that you're using the correct API key (the "anon" key, not the "service_role" key)
4. Ensure your Next.js application is properly loading the environment variables