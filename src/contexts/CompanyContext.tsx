import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Company, Subscription } from '@/types/saas';

interface CompanyContextType {
  company: Company | null;
  subscription: Subscription | null;
  loading: boolean;
  setCompanyBySlug: (slug: string) => Promise<boolean>;
  clearCompany: () => void;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [company, setCompany] = useState<Company | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a stored company slug
    const storedSlug = localStorage.getItem('selected_company_slug');
    if (storedSlug) {
      setCompanyBySlug(storedSlug).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setCompanyBySlug = async (slug: string): Promise<boolean> => {
    try {
      const { data: companyData, error } = await supabase
        .from('companies')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !companyData) {
        console.error('Company not found:', error);
        return false;
      }

      setCompany(companyData as Company);
      localStorage.setItem('selected_company_slug', slug);

      // Fetch subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyData.id)
        .maybeSingle();

      if (subData) {
        setSubscription(subData as unknown as Subscription);
      }

      return true;
    } catch (err) {
      console.error('Error setting company:', err);
      return false;
    }
  };

  const clearCompany = () => {
    setCompany(null);
    setSubscription(null);
    localStorage.removeItem('selected_company_slug');
  };

  const refreshCompany = async () => {
    if (company?.slug) {
      await setCompanyBySlug(company.slug);
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        company,
        subscription,
        loading,
        setCompanyBySlug,
        clearCompany,
        refreshCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
