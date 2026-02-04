# WorkFlow HRMS - Multi-Tenant SaaS Platform

A modern, full-featured Human Resource Management System built with React, TypeScript, and Supabase. WorkFlow enables companies to manage employees, attendance, leave requests, payroll, and more.

## 🚀 Features

### For Companies
- **Employee Management**: Add, edit, and manage employee profiles with detailed information
- **Attendance Tracking**: Real-time session tracking with sign-in/sign-out functionality
- **Leave Management**: Request, approve, and track various types of leave
- **Payroll Processing**: Calculate salaries with statutory deductions (PF, ESIC, PT) and custom adjustments
- **Organization Chart**: Visual representation of company hierarchy
- **Holiday Calendar**: Manage company-specific holidays

### For Super Admins
- **Company Management**: Onboard and manage multiple companies
- **User Overview**: View all users across the platform
- **Subscription Management**: Handle billing and plan changes
- **Platform Analytics**: Monitor platform health and growth metrics

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6
- **Forms**: React Hook Form, Zod validation
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ 
- npm or bun
- A Supabase project (provided via Lovable Cloud)

## 🏃‍♂️ Local Development

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd workflow-hrms
```

### 2. Install Dependencies

```bash
npm install
# or
bun install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

> **Note**: If using Lovable, these are automatically configured.

### 4. Start Development Server

```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

## 🚀 Deployment

### Deploy via Lovable (Recommended)

1. Open your project in [Lovable](https://lovable.dev)
2. Click **Share** → **Publish**
3. Your app is live! You can connect a custom domain in Settings → Domains

### Self-Hosted Deployment

#### Option 1: Static Hosting (Vercel, Netlify, etc.)

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Configure environment variables in your hosting dashboard

#### Option 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
docker build -t workflow-hrms .
docker run -p 80:80 workflow-hrms
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── attendance/      # Attendance-related components
│   ├── dashboard/       # Dashboard widgets
│   ├── employees/       # Employee management components
│   ├── layout/          # Layout components (AppLayout, Sidebar)
│   ├── leaves/          # Leave management components
│   ├── payroll/         # Payroll processing components
│   ├── settings/        # Settings components
│   └── ui/              # shadcn/ui components
├── contexts/            # React contexts (Auth, Company)
├── hooks/               # Custom React hooks
├── integrations/        # External integrations (Supabase)
├── pages/               # Page components
│   └── super-admin/     # Super admin pages
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full platform access, manage all companies |
| **Owner** | Full company access, manage settings |
| **Admin** | Manage employees, payroll, approvals |
| **Manager** | Approve team leaves, view team data |
| **Employee** | View own data, mark attendance, request leave |

## 🗄️ Database Schema

Key tables:
- `companies` - Multi-tenant company data
- `profiles` - User profiles linked to companies
- `user_roles` - Role assignments
- `attendance_sessions` - Daily attendance records
- `leave_requests` - Leave applications
- `payroll` - Monthly payroll records
- `subscriptions` - Company subscription data

## 🔧 Configuration

### Payroll Settings

Configure statutory deductions in Settings → Statutory Deductions:
- **PF (Provident Fund)**: Percentage-based employee contribution
- **ESIC**: Employee State Insurance contribution
- **PT (Professional Tax)**: Fixed amount state tax
- **EPF**: Employer PF contribution (not deducted from employee)

### Work Sessions

Define custom work sessions (Morning, Afternoon, etc.) in Settings → Work Sessions.

## 📝 API Reference

The app uses Supabase client for all database operations. Key queries:

```typescript
// Get user profile
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single();

// Create attendance session
await supabase
  .from('attendance_sessions')
  .insert({
    user_id: userId,
    company_id: companyId,
    sign_in_time: new Date().toISOString(),
    status: 'present'
  });
```

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot read properties of null" errors**
   - Ensure you're logged in and the company is selected
   - Check that RLS policies are configured correctly

2. **Attendance not saving**
   - Verify company_id is set in user profile
   - Check browser console for error messages

3. **Payroll calculations incorrect**
   - Verify payroll config in Settings
   - Check attendance records for the month

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

- **Documentation**: [Lovable Docs](https://docs.lovable.dev)
- **Issues**: Create an issue in the repository
- **Email**: support@yourcompany.com

---

Built with ❤️ using [Lovable](https://lovable.dev)
