// Simple script to test Supabase configuration
const fs = require('fs');
const path = require('path');
const { createServerClient } = require('@supabase/ssr');

// Directly read values from .env.local file
function getEnvValue(key) {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8');
    const lines = envFile.split('\n');
    for (const line of lines) {
      if (line.startsWith(key + '=')) {
        return line.substring(key.length + 1).trim();
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading .env.local file:', error);
    return null;
  }
}

// Try to create a Supabase client with environment variables
try {
  const supabaseUrl = getEnvValue('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseKey = getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key:', supabaseKey);

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase URL or Key is missing!');
    process.exit(1);
  }

  // This will throw an error if the URL or Key is invalid
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
  });

  console.log('Supabase client created successfully!');
} catch (error) {
  console.error('Error creating Supabase client:', error);
}
