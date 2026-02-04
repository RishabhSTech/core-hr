import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Plus, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { toast } from 'sonner';

const SelectCompany = () => {
  const navigate = useNavigate();
  const { setCompanyBySlug } = useCompany();
  const [companyCode, setCompanyCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCompany, setFoundCompany] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async () => {
    const trimmed = companyCode.trim().toLowerCase();

    if (!trimmed) {
      toast.error('Please enter your company code');
      return;
    }

    // Validate input - only alphanumeric and hyphens allowed
    if (!/^[a-z0-9-]+$/.test(trimmed)) {
      toast.error('Company code can only contain letters, numbers, and hyphens');
      return;
    }

    setIsSearching(true);
    setNotFound(false);
    setFoundCompany(null);

    try {
      // Exact match only - no partial search to prevent enumeration
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, slug')
        .eq('is_active', true)
        .eq('slug', trimmed)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFoundCompany(data);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Lookup error:', err);
      toast.error('Failed to find company');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCompany = async () => {
    if (!foundCompany) return;
    
    const success = await setCompanyBySlug(foundCompany.slug);
    if (success) {
      navigate('/auth');
    } else {
      toast.error('Failed to select company');
    }
  };

  const handleCreateCompany = () => {
    navigate('/register-company');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Hero Section */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Sparkles className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to CoreHR</h1>
          <p className="text-muted-foreground">Modern HR management for growing teams</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl flex items-center justify-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Enter Company Code
            </CardTitle>
            <CardDescription>
              Your admin should have provided you with a company code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="e.g., smart-hirez"
                value={companyCode}
                onChange={(e) => {
                  setCompanyCode(e.target.value.toLowerCase());
                  setFoundCompany(null);
                  setNotFound(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                className="h-12 text-center text-lg font-mono"
              />
              <Button 
                onClick={handleLookup} 
                disabled={isSearching || !companyCode.trim()} 
                className="w-full h-11"
              >
                {isSearching ? 'Looking up...' : 'Find My Company'}
              </Button>
            </div>

            {foundCompany && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{foundCompany.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{foundCompany.slug}</p>
                    </div>
                  </div>
                  <Button onClick={handleSelectCompany} size="sm" className="gap-1">
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {notFound && (
              <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-center">
                <p className="text-sm text-destructive font-medium">Company not found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please check the code and try again, or contact your administrator
                </p>
              </div>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-11"
              onClick={handleCreateCompany}
            >
              <Plus className="h-4 w-4 mr-2" />
              Register New Company
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default SelectCompany;
