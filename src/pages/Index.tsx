import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowRight, 
  Users, 
  Clock, 
  Calendar, 
  DollarSign, 
  Building2, 
  Shield,
  CheckCircle2,
  XCircle,
  BarChart3,
  FileText,
  UserCheck,
  GitBranch,
  Zap,
  Lock,
  Headphones,
  ChevronRight,
  Play,
  Star,
  Quote,
  Sparkles
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeScreen, setActiveScreen] = useState(0);

  // Auto-rotate product screens
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const painPoints = [
    { icon: XCircle, text: 'Payroll errors every month' },
    { icon: XCircle, text: 'Attendance scattered across tools' },
    { icon: XCircle, text: 'Manual leave approvals' },
    { icon: XCircle, text: 'No org structure visibility' },
    { icon: XCircle, text: 'Excel breaking as you grow' },
    { icon: XCircle, text: 'HR buried in admin work' },
  ];

  const solutions = [
    { icon: DollarSign, title: 'Automated Payroll', description: 'Based on real attendance data' },
    { icon: Clock, title: 'Smart Attendance', description: 'Session-based sign-in/out' },
    { icon: Calendar, title: 'Leave Workflows', description: 'One-click approvals' },
    { icon: BarChart3, title: 'Role Dashboards', description: 'Owner, HR & Employee views' },
    { icon: GitBranch, title: 'Org Chart', description: 'Visual hierarchy' },
    { icon: FileText, title: 'Employee Profiles', description: 'Payroll-ready data' },
  ];

  const features = [
    {
      icon: DollarSign,
      title: 'Payroll Automation',
      description: 'Calculate salaries based on attendance, leaves, and custom deductions.',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      icon: Clock,
      title: 'Attendance Calendar',
      description: 'Session-based tracking with visual calendar view.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Calendar,
      title: 'Leave Management',
      description: 'Request, approve, and track leaves with balance visibility.',
      color: 'from-violet-500 to-purple-500'
    },
    {
      icon: Users,
      title: 'Employee Profiles',
      description: 'Complete database with bank details and salary info.',
      color: 'from-orange-500 to-amber-500'
    },
    {
      icon: GitBranch,
      title: 'Org Chart',
      description: 'Visual organization structure with reporting lines.',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Bird\'s-eye view of headcount, costs, and trends.',
      color: 'from-indigo-500 to-blue-500'
    },
  ];

  const testimonials = [
    {
      quote: "CoreHR cut our payroll processing time from 2 days to 30 minutes. Game changer for our HR team.",
      author: "Priya Sharma",
      role: "HR Manager",
      company: "TechStart India",
      avatar: "PS"
    },
    {
      quote: "Finally, an HRMS that doesn't feel like it was built in 2005. Clean, fast, and actually works.",
      author: "Rahul Verma",
      role: "Founder & CEO",
      company: "GrowthBox",
      avatar: "RV"
    },
    {
      quote: "The attendance tracking alone saved us from so many payroll disputes. Worth every rupee.",
      author: "Anita Desai",
      role: "Operations Head",
      company: "CloudNine Solutions",
      avatar: "AD"
    },
  ];

  const faqs = [
    {
      question: "How long does it take to set up CoreHR?",
      answer: "Most companies are up and running within 30 minutes. Simply register your company, add your employees, and you're ready to go. We also offer free onboarding support if you need help migrating from Excel or another system."
    },
    {
      question: "Is my employee data secure?",
      answer: "Absolutely. We use bank-grade encryption (AES-256) for all data at rest and in transit. Your data is stored in secure, SOC 2 compliant data centers. We never share or sell your data to third parties."
    },
    {
      question: "Can I try CoreHR before committing?",
      answer: "Yes! We offer a 14-day free trial on all plans with full access to all features. No credit card required to start. You can also use our Free plan indefinitely for teams up to 10 employees."
    },
    {
      question: "How does payroll calculation work?",
      answer: "CoreHR automatically calculates salaries based on attendance records, approved leaves, and your configured salary structure. It handles PF, ESI, PT, and TDS deductions. You can also add custom allowances and deductions per employee."
    },
    {
      question: "Can employees access the system themselves?",
      answer: "Yes! Each employee gets their own login to mark attendance, request leaves, view payslips, and update their profile. Managers can approve leaves and view team reports. Owners get the full dashboard with analytics."
    },
    {
      question: "What if I need help or have questions?",
      answer: "We offer email support on all plans, with priority support and dedicated account managers for Growth and Enterprise plans. Our average response time is under 2 hours during business hours."
    },
  ];

  const plans = [
    {
      name: 'Starter',
      price: '₹0',
      period: '/month',
      description: 'For small teams getting started',
      features: ['Up to 10 employees', 'Attendance tracking', 'Leave management', 'Employee profiles', 'Email support'],
      cta: 'Start Free',
      popular: false,
      gradient: 'from-slate-500 to-slate-600'
    },
    {
      name: 'Growth',
      price: '₹49',
      period: '/employee/mo',
      description: 'For growing teams',
      features: ['Up to 100 employees', 'Payroll automation', 'Manager workflows', 'Org chart', 'Priority support', 'Custom policies'],
      cta: 'Start 14-Day Trial',
      popular: true,
      gradient: 'from-primary to-blue-600'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations',
      features: ['Unlimited employees', 'Custom integrations', 'Advanced reporting', 'Compliance tools', 'Dedicated manager', 'SLA guarantee'],
      cta: 'Contact Sales',
      popular: false,
      gradient: 'from-violet-500 to-purple-600'
    },
  ];

  const productScreens = [
    {
      title: 'Dashboard',
      description: 'Get a bird\'s-eye view of your entire workforce',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-primary-foreground">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Company Dashboard</p>
                <p className="text-xs text-muted-foreground">December 2024</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-600 border-0">Live</Badge>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary">24</p>
              <p className="text-xs text-muted-foreground">Employees</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">96%</p>
              <p className="text-xs text-muted-foreground">Attendance</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">3</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-violet-600">₹4.2L</p>
              <p className="text-xs text-muted-foreground">Payroll</p>
            </div>
          </div>
          <div className="h-28 bg-gradient-to-br from-background to-muted/30 rounded-xl flex items-end p-3 gap-1.5">
            {[35, 55, 45, 70, 60, 85, 75, 90, 80, 65, 75, 82].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm overflow-hidden" style={{ height: `${h}%` }}>
                <div className={`w-full h-full ${i === 11 ? 'bg-gradient-to-t from-primary to-primary/60' : 'bg-gradient-to-t from-primary/40 to-primary/20'}`} />
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Attendance',
      description: 'Track who\'s in, who\'s out, in real-time',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-primary-foreground">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Today's Attendance</p>
                <p className="text-xs text-muted-foreground">Wed, Dec 25, 2024</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name: 'Rishabh Yadav', time: '09:02 AM', status: 'Present', color: 'emerald' },
              { name: 'Priya Sharma', time: '09:15 AM', status: 'Present', color: 'emerald' },
              { name: 'Amit Kumar', time: '10:30 AM', status: 'Late', color: 'amber' },
              { name: 'Neha Singh', time: '-', status: 'On Leave', color: 'blue' },
            ].map((emp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-background to-muted/20 border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-full bg-gradient-to-br from-${emp.color}-500/20 to-${emp.color}-500/10 flex items-center justify-center text-sm font-medium text-${emp.color}-600`}>
                    {emp.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">{emp.time}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`bg-${emp.color}-500/10 text-${emp.color}-600 border-${emp.color}-500/20`}>
                  {emp.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'Payroll',
      description: 'Run accurate payroll in minutes, not days',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-primary-foreground">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">December Payroll</p>
                <p className="text-xs text-muted-foreground">Processing</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 border-0">Draft</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground">Gross Salary</p>
              <p className="text-xl font-bold text-foreground">₹5,20,000</p>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-background to-muted/20 border border-border/50">
              <p className="text-xs text-muted-foreground">Deductions</p>
              <p className="text-xl font-bold text-destructive">-₹98,400</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">PF Contribution</span>
              <span className="font-medium text-foreground">₹62,400</span>
            </div>
            <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">ESI Contribution</span>
              <span className="font-medium text-foreground">₹19,500</span>
            </div>
            <div className="flex justify-between text-sm p-2 rounded-lg bg-muted/30">
              <span className="text-muted-foreground">Professional Tax</span>
              <span className="font-medium text-foreground">₹4,800</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-foreground">Net Payable</span>
              <span className="text-2xl font-bold text-primary">₹4,21,600</span>
            </div>
          </div>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Animated Background Gradient */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-bold shadow-lg shadow-primary/25">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-foreground leading-tight">CoreHR</span>
              <span className="text-[10px] text-muted-foreground leading-none">by Shrijan Technologies</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it Works</a>
            <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/select-company')}>
              Sign In
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg shadow-primary/25" onClick={() => navigate('/register-company')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 px-4 relative">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-violet-500/20 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Built for modern teams</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1]">
                HR & Payroll That
                <span className="block mt-2 bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
                  Actually Works
                </span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-xl leading-relaxed">
                Stop wrestling with spreadsheets. Automate attendance, streamline leaves, 
                and run accurate payroll—all in one beautiful platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-base bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-xl shadow-primary/30 animate-pulse-glow"
                  onClick={() => navigate('/register-company')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base group" onClick={() => navigate('/select-company')}>
                  <Play className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                  Watch Demo
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-2">
                <div className="flex -space-x-3">
                  {['RY', 'PS', 'AK', 'NS'].map((initials, i) => (
                    <div 
                      key={i} 
                      className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background"
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                  </div>
                  <span className="text-muted-foreground">Loved by 500+ companies</span>
                </div>
              </div>
            </div>
            
            {/* Hero Product Mockup */}
            <div className="relative hidden lg:block animate-slide-in-right">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-primary/30 to-violet-500/30 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-full blur-2xl" />
              
              {/* Main Product Screen */}
              <div className="relative bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl p-5 animate-float-slow">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="flex-1 h-6 bg-muted/50 rounded-md flex items-center px-3">
                    <span className="text-xs text-muted-foreground">app.corehr.com/dashboard</span>
                  </div>
                </div>
                
                {/* Screen Tabs */}
                <div className="flex gap-2 mb-4">
                  {productScreens.map((screen, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeScreen === i 
                          ? 'bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-lg' 
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {screen.title}
                    </button>
                  ))}
                </div>
                
                {/* Screen Content */}
                <div className="min-h-[320px]">
                  {productScreens[activeScreen].content}
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className="absolute -bottom-6 -left-6 bg-card/90 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-xl animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">10hrs</p>
                    <p className="text-xs text-muted-foreground">Saved weekly</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points - Minimal Design */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Sound <span className="text-destructive">Familiar</span>?
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {painPoints.map((point, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/5 border border-destructive/20 text-sm animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <point.icon className="h-4 w-4 text-destructive" />
                <span className="text-foreground">{point.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-gradient-to-r from-primary/20 to-emerald-500/20 text-primary border-0">
              <Zap className="h-3 w-3 mr-1" />
              The Solution
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              We Fixed <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">Everything</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {solutions.map((item, i) => (
              <div 
                key={i} 
                className="group flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 group-hover:from-primary group-hover:to-blue-600 transition-all">
                  <item.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-foreground/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-600 border-0">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-violet-500 to-purple-500 bg-clip-text text-transparent">Run HR Like a Pro</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="group relative p-6 rounded-2xl bg-gradient-to-br from-card to-background border border-border/50 hover:border-transparent transition-all duration-500 animate-scale-in overflow-hidden"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <div className={`relative inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg`}>
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="relative text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="relative text-foreground/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 border-0">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Up and Running in <span className="text-primary">3 Steps</span>
            </h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 max-w-4xl mx-auto">
            {[
              { num: '1', title: 'Set up your company', desc: 'Add details & invite team', gradient: 'from-primary to-blue-600' },
              { num: '2', title: 'Track daily ops', desc: 'Attendance & leaves', gradient: 'from-emerald-500 to-teal-500' },
              { num: '3', title: 'Run payroll', desc: 'Accurate & automated', gradient: 'from-violet-500 to-purple-500' },
            ].map((step, i) => (
              <div key={i} className="flex md:flex-col items-center text-center gap-4 md:gap-6 animate-fade-in-up" style={{ animationDelay: `${i * 0.2}s` }}>
                <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.gradient} text-primary-foreground font-bold text-2xl shadow-xl`}>
                  {step.num}
                </div>
                {i < 2 && <ChevronRight className="hidden md:block h-6 w-6 text-muted-foreground absolute translate-x-[140px]" />}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-foreground/70">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-violet-500/5" />
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-600 border-0">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Loved by <span className="bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">Growing Teams</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t, i) => (
              <div 
                key={i} 
                className="relative p-6 rounded-2xl bg-gradient-to-br from-card to-background border border-border/50 animate-fade-in"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{t.author}</p>
                    <p className="text-xs text-muted-foreground">{t.role} at {t.company}</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">"{t.quote}"</p>
                <div className="flex gap-0.5 mt-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-amber-500 fill-current" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-600 border-0">Pricing</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple, <span className="text-primary">Transparent</span> Pricing
            </h2>
            <p className="text-muted-foreground">Start free, scale as you grow</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {plans.map((plan, i) => (
              <div 
                key={i}
                className={`relative p-6 rounded-2xl transition-all duration-300 animate-fade-in-up ${
                  plan.popular 
                    ? 'bg-gradient-to-br from-card to-primary/5 border-2 border-primary shadow-xl shadow-primary/20 md:scale-105 md:-my-4' 
                    : 'bg-gradient-to-br from-card to-background border border-border/50 hover:border-primary/30'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className={`bg-gradient-to-r ${plan.gradient} text-primary-foreground px-4 py-1 shadow-lg`}>
                      Most Popular
                    </Badge>
                  </div>
                )}
                <div className="text-center mb-6 pt-4">
                  <h3 className="text-lg font-semibold text-foreground mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${plan.popular ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg` : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => navigate('/register-company')}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent" />
        <div className="container mx-auto relative">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-600 border-0">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Got <span className="text-primary">Questions</span>?
            </h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, i) => (
                <AccordionItem 
                  key={i} 
                  value={`item-${i}`} 
                  className="border border-border/50 rounded-xl px-6 bg-gradient-to-br from-card to-background overflow-hidden"
                >
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:text-primary transition-colors py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            {[
              { icon: Lock, title: 'Bank-Grade Security', desc: 'AES-256 encryption' },
              { icon: UserCheck, title: 'Compliance Ready', desc: 'PF, ESI, PT built-in' },
              { icon: Headphones, title: '2hr Response Time', desc: 'Real human support' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary to-primary/20 p-10 md:p-16 text-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-foreground">
                Stop Managing HR the Hard Way
              </h2>
              <p className="text-lg text-secondary-foreground/80">
                Join 500+ companies that trust CoreHR. Start free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  className="bg-background text-foreground hover:bg-background/90 shadow-xl"
                  onClick={() => navigate('/register-company')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="ghost" 
                  className="text-secondary-foreground hover:bg-secondary-foreground/10"
                  onClick={() => navigate('/select-company')}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-bold">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-foreground leading-tight">CoreHR</span>
              <span className="text-[10px] text-muted-foreground leading-none">by Shrijan Technologies</span>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CoreHR by Shrijan Technologies
          </p>
        </div>
      </footer>
    </div>
  );
}
