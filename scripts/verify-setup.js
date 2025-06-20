// Verification script for Caltor Inspections setup
const fs = require("fs")
const path = require("path")

console.log("🔍 Caltor Inspections - Configuration Verification\n")

// Check if .env.local exists and has correct values
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  console.log("✅ .env.local file found")

  const envContent = fs.readFileSync(envPath, "utf8")

  // Check Supabase URL
  if (envContent.includes("NEXT_PUBLIC_SUPABASE_URL=https://ymyqnuqoaymmeazgqxyo.supabase.co")) {
    console.log("✅ Supabase URL configured correctly")
  } else if (envContent.includes("NEXT_PUBLIC_SUPABASE_URL=")) {
    console.log("⚠️  Supabase URL found but may not match expected value")
  } else {
    console.log("❌ Supabase URL not configured")
  }

  // Check Supabase API Key
  if (envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")) {
    console.log("✅ Supabase API key configured correctly")
  } else if (envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
    console.log("⚠️  Supabase API key found but may not match expected value")
  } else {
    console.log("❌ Supabase API key not configured")
  }

  // Check NEXTAUTH_URL
  if (envContent.includes("NEXTAUTH_URL=")) {
    console.log("✅ NEXTAUTH_URL configured")
  } else {
    console.log("⚠️  NEXTAUTH_URL not configured (optional for development)")
  }
} else {
  console.log("❌ .env.local file not found")
  console.log("   Please create .env.local with your Supabase credentials")
}

// Check other requirements
if (fs.existsSync("package.json")) {
  console.log("✅ package.json found")
} else {
  console.log("❌ package.json not found")
}

if (fs.existsSync("node_modules")) {
  console.log("✅ Dependencies installed")
} else {
  console.log("❌ Dependencies not installed - run: npm install")
}

// Check if database scripts exist
const scriptsDir = path.join(process.cwd(), "scripts")
if (fs.existsSync(scriptsDir)) {
  console.log("✅ Scripts directory found")

  const setupScript = path.join(scriptsDir, "01-setup-database.sql")
  const notificationScript = path.join(scriptsDir, "02-notifications-setup.sql")

  if (fs.existsSync(setupScript)) {
    console.log("✅ Database setup script found")
  } else {
    console.log("⚠️  Database setup script not found")
  }

  if (fs.existsSync(notificationScript)) {
    console.log("✅ Notification setup script found")
  } else {
    console.log("⚠️  Notification setup script not found")
  }
} else {
  console.log("⚠️  Scripts directory not found")
}

console.log("\n🚀 Next Steps:")
console.log("1. Restart your development server: npm run dev")
console.log("2. Go to your Supabase dashboard: https://supabase.com/dashboard")
console.log("3. Navigate to SQL Editor")
console.log("4. Run the database setup scripts:")
console.log("   - First run: scripts/01-setup-database.sql")
console.log("   - Then run: scripts/02-notifications-setup.sql")
console.log("5. Open: http://localhost:3000")
console.log("6. Register a new admin user")
console.log("7. Test the notification system\n")

console.log("🔗 Your Supabase Project:")
console.log("   URL: https://ymyqnuqoaymmeazgqxyo.supabase.co")
console.log("   Dashboard: https://supabase.com/dashboard/project/ymyqnuqoaymmeazgqxyo")
