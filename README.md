# Caltor Inspections

A comprehensive electrical inspection management platform built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🔐 **Simple Authentication** - Quick registration and login without email verification
- 📋 **Comprehensive Inspection Forms** - Detailed electrical inspection reports
- 📊 **Dashboard Analytics** - Real-time statistics and insights
- 📄 **PDF Export** - Professional inspection report generation
- 👥 **User Management** - Admin can manage team members
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🔒 **Secure Data** - Row-level security with Supabase

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (simplified flow)
- **PDF Generation**: jsPDF
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ 
- A Supabase account and project

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/caltor-inspections.git
cd caltor-inspections
npm install
\`\`\`

### 2. Environment Setup

Create a `.env.local` file in the root directory:

\`\`\`env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
\`\`\`

Get your Supabase credentials from:
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project
- Go to Settings → API
- Copy your Project URL and anon public key

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the database setup script from `scripts/00-complete-setup.sql`

This will create:
- User profiles table with role-based access
- Inspection reports table
- Damage causes lookup table
- Notification system tables
- Automatic user profile creation trigger
- Row-level security policies

### 4. Configure Authentication

**IMPORTANT**: Disable email confirmation in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Settings
3. **DISABLE** "Enable email confirmations"
4. Set Site URL to: `http://localhost:3000`
5. Add Redirect URL: `http://localhost:3000/auth/callback`

### 5. Run the Application

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Time Setup

1. **Register an Admin User**:
   - Go to `/register`
   - Create an account with role "Admin"
   - You'll be automatically logged in and redirected to the dashboard

2. **Create Employee Accounts**:
   - Admins can create employee accounts
   - Or employees can self-register with "Employee" role

### Creating Inspection Reports

1. **Navigate to Dashboard** → **New Inspection**
2. **Fill out the inspection form**:
   - Client information
   - Equipment details (Oven, Glass Hob, Geyser)
   - Damage cause classification (A-F codes)
   - Testing results and observations
3. **Save as Draft** or **Submit Report**
4. **Export to PDF** from the reports list

### Admin Features

- **User Management**: View and manage all team members
- **All Reports**: Access to all inspection reports
- **Analytics**: Dashboard with inspection statistics
- **Settings**: System configuration options

### Employee Features

- **Personal Dashboard**: View own statistics
- **Create Reports**: New inspection forms
- **My Reports**: Access to own reports only
- **PDF Export**: Download inspection reports

## Authentication Flow

The application uses a **simplified authentication flow**:

1. **Registration** → Immediate login → Dashboard (no email verification)
2. **Login** → Dashboard
3. **Password Reset** → Email link → New password
4. **Session Management** → Automatic refresh and persistence

## Damage Cause Codes

The system uses a standardized damage classification system:

- **A** - Lighting
- **B** - Power surge / Dip  
- **C** - Wear & Tear
- **D** - Water Damage
- **E** - Component Failure
- **F** - No Damage

## Project Structure

\`\`\`
caltor-inspections/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── login/            # Authentication pages
│   └── register/         
├── components/            # Reusable components
│   ├── dashboard/        # Dashboard-specific components
│   ├── forms/           # Form components
│   └── ui/              # shadcn/ui components
├── lib/                  # Utility functions
│   ├── auth-service.ts  # Authentication utilities
│   ├── supabase.ts      # Supabase client
│   └── pdf-generator.ts # PDF generation
├── scripts/             # Database scripts
└── middleware.ts        # Next.js middleware
\`\`\`

## Development

### Adding New Features

1. **Database Changes**: Add migration scripts to `scripts/`
2. **Components**: Add reusable components to `components/`
3. **Pages**: Add new pages to `app/`
4. **Styling**: Use Tailwind CSS classes and shadcn/ui components

### Testing

\`\`\`bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Update Supabase Auth settings:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URL: `https://your-domain.vercel.app/auth/callback`
5. Deploy automatically on push to main branch

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Roadmap

- [ ] Photo upload for inspection reports
- [ ] Mobile app version
- [ ] Advanced analytics and reporting
- [ ] Integration with external systems
- [ ] Multi-language support
- [ ] Offline mode capability

---

Built with ❤️ for professional electrical inspections
