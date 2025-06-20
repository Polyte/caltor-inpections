const chalk = require("chalk")

console.log(chalk.yellow.bold("\n🚀 IMPORTANT: Supabase Configuration Required 🚀\n"))
console.log(
  "To enable immediate user registration without email verification, you must disable 'Enable email confirmations' in your Supabase project settings.",
)
console.log("\n" + chalk.cyan("Please follow these steps:"))
console.log("1. Go to your Supabase project dashboard.")
console.log(`2. Navigate to: ${chalk.green.underline("Authentication -> Settings")}`)
console.log(`3. Find the setting: ${chalk.bold("'Enable email confirmations'")}`)
console.log(`4. Turn this setting ${chalk.red.bold("OFF")}.`)
console.log("5. Click 'Save' at the bottom of the page.")
console.log(chalk.yellow("\nThis change is required for the registration and login flow to work as intended."))
console.log(
  `\nDirect link to settings: ${chalk.blue.underline("https://supabase.com/dashboard/project/ymyqnuqoaymmeazgqxyo/auth/settings")}\n`,
)
