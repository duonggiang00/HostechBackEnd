// @ts-nocheck
import { useState } from 'react';
import { useInvitations, useInvitationActions } from '@/shared/features/auth/hooks/useInvitations';
import type { UserInvitation } from '@/shared/features/management/types';
import { useProperties } from '@/OrgScope/features/properties/hooks/useProperties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Send, ShieldCheck, Building2, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function InvitationManager() {
  const { data: invitations, isLoading } = useInvitations();
  const { createInvitation, revokeInvitation } = useInvitationActions();
  const { data: properties } = useProperties();
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Staff');
  const [selectedProps, setSelectedProps] = useState<string[]>([]);

  const handleSend = () => {
    if (!email) return;
    
    createInvitation.mutate({
      email,
      role_name: role,
      properties_scope: selectedProps
    }, {
      onSuccess: () => {
        toast.success(`Invitation sent to ${email}`);
        setEmail('');
        setSelectedProps([]);
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Failed to send invitation');
      }
    });
  };

  const handleRevoke = (id: string, invEmail: string) => {
    revokeInvitation.mutate(id, {
      onSuccess: () => toast.success(`Revoked invitation for ${invEmail}`),
      onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to revoke'),
    });
  };

  const pendingInvitations = (invitations?.data || []).filter(
    (inv: UserInvitation) => !inv.registered_at
  );

  return (
    <div className="space-y-6">
      {/* Send Invitation Form */}
      <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-800/50 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Mail className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-white">Invite New Team Member</CardTitle>
              <p className="text-sm text-slate-400 mt-1">Send a magic setup link to their email</p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email Address</label>
                <Input 
                  type="email" 
                  placeholder="staff@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Assigned Role</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="bg-slate-950 border-slate-800 text-white h-11">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-white">
                    <SelectItem value="Manager">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-rose-400" />
                        <span>Manager</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Staff">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-indigo-400" />
                        <span>Operational Staff</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                Property Access Scope
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {properties?.map((prop: any) => (
                  <div 
                    key={prop.id}
                    onClick={() => {
                      setSelectedProps(prev => 
                        prev.includes(prop.id) 
                          ? prev.filter(id => id !== prop.id) 
                          : [...prev, prop.id]
                      );
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedProps.includes(prop.id)
                        ? 'bg-indigo-500/10 border-indigo-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm text-slate-300">{prop.name}</span>
                    {selectedProps.includes(prop.id) && (
                      <Badge className="bg-indigo-500 hover:bg-indigo-500 text-white">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <Button 
              onClick={handleSend}
              disabled={createInvitation.isPending || !email}
              className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 text-lg font-medium shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              {createInvitation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations List */}
      <Card className="border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
        <CardHeader className="bg-slate-800/50 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-white">Pending Invitations</CardTitle>
              <p className="text-sm text-slate-400 mt-1">
                {pendingInvitations.length} invitation{pendingInvitations.length !== 1 ? 's' : ''} awaiting setup
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No pending invitations
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingInvitations.map((inv: UserInvitation) => (
                <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{inv.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                          {inv.role_name}
                        </Badge>
                        {inv.org && (
                          <span className="text-xs text-slate-500">{inv.org.name}</span>
                        )}
                        <span className="text-xs text-slate-600">
                          Expires {new Date(inv.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(inv.id, inv.email)}
                    disabled={revokeInvitation.isPending}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


