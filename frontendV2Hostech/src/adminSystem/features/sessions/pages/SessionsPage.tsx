// @ts-nocheck
import { Shield, Smartphone, Monitor, Globe, LogOut, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { useSessions } from '@/adminSystem/features/sessions/hooks/useSessions';
import { format } from 'date-fns';

export default function SessionsPage() {
  const { sessions, isLoading, revokeSession, revokeOthers } = useSessions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Security & Sessions</h1>
        <p className="text-slate-500 font-medium">Manage active devices and your login history</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 px-8 py-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Active Sessions ({sessions.length})</h3>
            <div className="divide-y divide-slate-50">
              {sessions.map((session) => (
                <div key={session.id} className="py-6 flex items-center justify-between group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                      {session.name.toLowerCase().includes('ios') || session.name.toLowerCase().includes('android') || session.name.toLowerCase().includes('mobile') ? (
                        <Smartphone className="w-6 h-6" />
                      ) : (
                        <Monitor className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-bold text-slate-900">{session.name}</p>
                        {session.is_current && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-xs font-black uppercase rounded-full tracking-wider">
                            Current Session
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <Globe className="w-3.5 h-3.5" />
                          {session.abilities.join(', ') || 'Full Access'}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {session.last_used_at ? format(new Date(session.last_used_at), 'MMM dd, yyyy HH:mm') : 'Recently active'}
                        </div>
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <button 
                      onClick={() => revokeSession(session.id)}
                      className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      Revoke Access
                    </button>
                  )}
                </div>
              ))}
              {sessions.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-slate-400 font-bold">No active sessions found.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/20 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Login History</h3>
                <p className="text-sm font-medium text-slate-400">Security event logs</p>
              </div>
              <button className="text-xs font-bold text-indigo-600 hover:underline">View All Audit Logs</button>
            </div>
            
            <div className="space-y-4">
              {/* This could be integrated with AuditLog API later */}
              <div className="flex items-center justify-center p-12 text-slate-400">
                <p className="font-medium">Audit logs integration in progress...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <Shield className="w-12 h-12 mb-6 opacity-80" />
            <h3 className="text-xl font-black mb-2">Account Protection</h3>
            <p className="text-indigo-100 text-sm font-medium mb-6">Your account is secured with the latest encryption and session tracking protocols.</p>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm shadow-xl shadow-indigo-900/20 hover:bg-indigo-50 transition-colors">
              Management Security
            </button>
          </div>

          <div className="bg-rose-50 rounded-[32px] p-8 border border-rose-100">
            <h3 className="text-base font-black text-rose-900 mb-2">Danger Zone</h3>
            <p className="text-rose-600/80 text-sm font-medium mb-6">Logging out of all sessions will require re-authentication on every device.</p>
            <button 
              onClick={() => revokeOthers()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-900/10 hover:bg-rose-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out Other Devices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

