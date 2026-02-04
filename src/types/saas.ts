export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
export type PlanType = 'free' | 'starter' | 'professional' | 'enterprise';

export interface Company {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  is_active: boolean;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  company_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  max_employees: number;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingHistory {
  id: string;
  company_id: string;
  amount: number;
  currency: string;
  description: string | null;
  invoice_url: string | null;
  status: string;
  created_at: string;
}

export interface SuperAdmin {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
}

export const PLAN_LIMITS: Record<PlanType, { maxEmployees: number; features: string[] }> = {
  free: {
    maxEmployees: 5,
    features: ['Basic attendance', 'Leave management', 'Basic payroll'],
  },
  starter: {
    maxEmployees: 25,
    features: ['All Free features', 'Custom work sessions', 'Holiday calendar', 'Email support'],
  },
  professional: {
    maxEmployees: 100,
    features: ['All Starter features', 'Advanced reporting', 'Org chart', 'Priority support'],
  },
  enterprise: {
    maxEmployees: -1, // Unlimited
    features: ['All Professional features', 'Custom integrations', 'Dedicated support', 'SLA'],
  },
};
