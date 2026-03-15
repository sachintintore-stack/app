import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  Bell,
  Zap,
  Star,
  ArrowRight,
  BookOpen,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Clock,
    title: 'Smart Deadline Tracking',
    description: 'Never miss a submission with intelligent reminders and priority-based organization.',
  },
  {
    icon: Calendar,
    title: 'Study Session Planner',
    description: 'Plan focused study sessions with Pomodoro integration and break reminders.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Track your productivity patterns and optimize your study habits over time.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Get notified at the perfect time based on your study patterns and preferences.',
  },
  {
    icon: Zap,
    title: 'Study Streaks',
    description: 'Build consistent study habits with gamified streak tracking and rewards.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your data is encrypted and never shared. Your privacy is our priority.',
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Computer Science Major',
    content: 'StudyFlow transformed my semester. I went from missing deadlines to finishing everything early with time to spare!',
    avatar: 'SC',
  },
  {
    name: 'Marcus Johnson',
    role: 'Pre-Med Student',
    content: 'The study planner is a game-changer. My grades improved significantly once I started planning my sessions.',
    avatar: 'MJ',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Engineering Student',
    content: 'Finally, an app that understands student life. The reminders are perfectly timed and never annoying.',
    avatar: 'ER',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      'Up to 5 assignments',
      'Basic deadline reminders',
      'Weekly study planner',
      'Email support',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '₹99',
    period: 'per month',
    description: 'Best for serious students',
    features: [
      'Unlimited assignments',
      'Smart reminders',
      'Advanced analytics',
      'Study streak tracking',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Annual',
    price: '₹999',
    period: 'per year',
    description: 'Save 17% with annual billing',
    features: [
      'Everything in Pro',
      'Export data',
      'Custom categories',
      'API access',
      '24/7 support',
    ],
    cta: 'Go Annual',
    highlighted: false,
  },
];

const faqs = [
  {
    question: 'Is StudyFlow really free to start?',
    answer: 'Yes! Our free plan includes up to 5 assignments and all basic features. Upgrade anytime for unlimited access.',
  },
  {
    question: 'Can I use StudyFlow on my phone?',
    answer: 'Absolutely! StudyFlow works on any device with a web browser. Native iOS and Android apps coming soon.',
  },
  {
    question: 'How do reminders work?',
    answer: 'Our smart reminder system learns your habits and notifies you at the optimal time before deadlines.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel anytime with no questions asked. Your access continues until the end of your billing period.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We use bank-level encryption and never share your data with third parties. Your privacy is our priority.',
  },
];

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Parallax effect for hero
    const handleScroll = () => {
      if (heroRef.current) {
        const scrolled = window.scrollY;
        heroRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">StudyFlow Pro</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-[#94a3b8] hover:text-white transition-colors">
                Login
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:opacity-90">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div ref={heroRef} className="absolute inset-0 pointer-events-none">
          {/* Background gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7c3aed]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ec4899]/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30 mb-8">
              <Star className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-sm text-[#94a3b8]">Trusted by 10,000+ students worldwide</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Never Miss a{' '}
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] bg-clip-text text-transparent">
                Deadline
              </span>{' '}
              Again
            </h1>
            
            <p className="text-xl text-[#94a3b8] mb-10 max-w-2xl mx-auto">
              The intelligent assignment tracker that adapts to your study style. 
              Organize deadlines, plan study sessions, and ace every submission.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:opacity-90 text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-purple-500/30 hover:bg-purple-500/10 text-lg px-8">
                  Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div>
                <p className="text-3xl font-bold text-white">10K+</p>
                <p className="text-sm text-[#94a3b8]">Active Students</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">50K+</p>
                <p className="text-sm text-[#94a3b8]">Assignments Tracked</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">98%</p>
                <p className="text-sm text-[#94a3b8]">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#7c3aed] font-semibold mb-4">POWERFUL FEATURES</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything You Need to Stay Ahead
            </h2>
            <p className="text-xl text-[#94a3b8] max-w-2xl mx-auto">
              From deadline tracking to study planning, we've got you covered
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-[#1e293b] border border-purple-500/20 hover:border-purple-500/40 transition-all hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7c3aed]/20 to-[#ec4899]/20 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-[#94a3b8]">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-[#1e293b]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#7c3aed] font-semibold mb-4">STUDENT SUCCESS STORIES</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Loved by Students Worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-[#1e293b] border border-purple-500/20"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                  ))}
                </div>
                <p className="text-[#94a3b8] mb-6">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center text-sm font-medium">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-[#94a3b8]">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#7c3aed] font-semibold mb-4">SIMPLE PRICING</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-[#94a3b8]">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border ${
                  plan.highlighted
                    ? 'bg-gradient-to-b from-[#7c3aed]/20 to-[#1e293b] border-[#7c3aed] scale-105'
                    : 'bg-[#1e293b] border-purple-500/20'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-block px-3 py-1 rounded-full bg-[#7c3aed] text-xs font-medium mb-4">
                    MOST POPULAR
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-[#94a3b8]">/{plan.period}</span>
                </div>
                <p className="text-[#94a3b8] mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-[#10b981]" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block">
                  <Button
                    className={`w-full ${
                      plan.highlighted
                        ? 'bg-gradient-to-r from-[#7c3aed] to-[#ec4899]'
                        : 'bg-[#1e293b] border border-purple-500/30'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 lg:py-32 bg-[#1e293b]/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-[#7c3aed] font-semibold mb-4">FAQ</p>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Common Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-[#1e293b] border border-purple-500/20"
              >
                <h3 className="font-semibold mb-2">{faq.question}</h3>
                <p className="text-[#94a3b8]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Study Life?
          </h2>
          <p className="text-xl text-[#94a3b8] mb-8">
            Join thousands of students who never miss a deadline anymore.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-[#7c3aed] to-[#ec4899] hover:opacity-90 text-lg px-8">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="mt-4 text-sm text-[#94a3b8]">
            No credit card required • 14-day free trial
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link to="/" className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#ec4899] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">StudyFlow Pro</span>
              </Link>
              <p className="text-[#94a3b8]">
                Making student life organized, one deadline at a time.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-[#94a3b8]">
                <li><Link to="/" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-[#94a3b8]">
                <li><Link to="/" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[#94a3b8]">
                <li><Link to="/" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-purple-500/20 text-center text-[#94a3b8]">
            <p>© 2024 StudyFlow Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
