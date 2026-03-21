import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useInvitationActions } from '@/shared/features/auth/hooks/useInvitations';
import type { InvitationValidation } from '@/shared/features/management/types';
import { Loader2, ShieldCheck, Mail, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export default function InvitationSetupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { validateToken, acceptInvitation } = useInvitationActions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<InvitationValidation | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    password: '',
    password_confirmation: '',
    org_name: '',
  });

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid token');
      setIsLoading(false);
      return;
    }

    validateToken(token)
      .then((data) => {
        setInvitationData(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
        setIsLoading(false);
      });
  }, [token, validateToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.password_confirmation) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!token) return;

    setError(null);
    acceptInvitation.mutate(
      { ...formData, token },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
        onError: (error: any) => {
          setError(error.response?.data?.message || 'Failed to setup account');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !invitationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="h-20 w-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
          <XCircle className="h-10 w-10 text-rose-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Setup Failed</h1>
        <p className="text-slate-400 max-w-md text-center mb-8">{error}</p>
        <Link to="/login" className="inline-block">
          <button className="border border-slate-800 text-white hover:bg-slate-800 px-4 py-2 rounded-md">
            Return to Login
          </button>
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-20 w-20 bg-emerald-500/10 rounded-full items-center justify-center mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">You're All Set!</h1>
          <p className="text-slate-400 text-lg mb-8">
            Your account has been configured successfully. You can now access your workspace.
          </p>
          <button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg shadow-lg shadow-indigo-500/20 active:scale-95 transition-all outline-none rounded-md text-white font-medium flex items-center justify-center gap-2"
            onClick={() => navigate('/login')}
          >
            Sign In Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl relative z-10 backdrop-blur-sm overflow-hidden">
        <div className="text-center pb-6 border-b border-slate-800 bg-slate-900/50 pt-6 px-6">
          <div className="mx-auto w-16 h-16 bg-linear-to-tr from-indigo-500 to-sky-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Complete Your Setup</h2>
          <p className="text-slate-400 mt-2">Welcome to Hostech platform</p>
        </div>
        
        <div className="p-6">
          <div className="mb-8 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3 text-slate-300">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">{invitationData.email}</span>
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 uppercase tracking-wide font-semibold">
                {invitationData.role_name}
              </span>
              {invitationData.org && (
                <span className="text-sm text-slate-500">at {invitationData.org.name}</span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {invitationData.requires_org_creation && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Organization Name</label>
                <input
                  required
                  placeholder="Enter your organization name"
                  value={formData.org_name}
                  onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                  className="bg-slate-950 border border-slate-800 text-white h-11 px-3 rounded-md w-full focus-visible:ring-indigo-500 outline-none"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <input
                required
                placeholder="John Doe"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="bg-slate-950 border border-slate-800 text-white h-11 px-3 rounded-md w-full focus-visible:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <input
                required
                type="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-950 border border-slate-800 text-white h-11 px-3 rounded-md w-full focus-visible:ring-indigo-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Confirm Password</label>
              <input
                required
                type="password"
                placeholder="Confirm your password"
                value={formData.password_confirmation}
                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                className="bg-slate-950 border border-slate-800 text-white h-11 px-3 rounded-md w-full focus-visible:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all rounded-md text-white flex items-center justify-center gap-2 outline-none disabled:opacity-50"
                disabled={acceptInvitation.isPending}
              >
                {acceptInvitation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Setting up Account...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
