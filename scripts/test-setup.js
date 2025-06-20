// Simple test script to verify environment setup
const fs = require("fs")
const path = require("path")

console.log("🔍 Caltor Inspections - Setup Verification\n")

// Check if .env.local exists
const envPath = path.join(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
  console.log("✅ .env.local file found")

  // Read and check environment variables
  const envContent = fs.readFileSync(envPath, "utf8")

  if (envContent.includes("NEXT_PUBLIC_SUPABASE_URL=") && !envContent.includes("your-project-ref.supabase.co")) {
    console.log("✅ Supabase URL configured")
  } else {
    console.log("❌ Supabase URL not properly configured")
  }

  if (envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=") && !envContent.includes("your-anon-key-here")) {
    console.log("✅ Supabase API key configured")
  } else {
    console.log("❌ Supabase API key not properly configured")
  }
} else {
  console.log("❌ .env.local file not found")
  console.log("   Please create .env.local with your Supabase credentials")
}

// Check if package.json exists
if (fs.existsSync("package.json")) {
  console.log("✅ package.json found")
} else {
  console.log("❌ package.json not found")
}

// Check if node_modules exists
if (fs.existsSync("node_modules")) {
  console.log("✅ Dependencies installed")
} else {
  console.log("❌ Dependencies not installed - run: npm install")
}

console.log("\n🚀 Next Steps:")
console.log("1. Run: npm run dev")
console.log("2. Open: http://localhost:3000")
console.log("3. Register a new admin user")
console.log("4. Test the inspection form")
console.log("5. Generate a PDF report\n")
