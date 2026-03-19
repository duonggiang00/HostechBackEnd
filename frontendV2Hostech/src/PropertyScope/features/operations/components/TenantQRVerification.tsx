import { useState } from 'react';
import { QrCode, UserCheck, ShieldCheck, Download, Copy, CreditCard, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TenantQRVerification() {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* QR Code Section */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="w-56 h-56 bg-slate-900 rounded-[2rem] p-6 flex items-center justify-center relative overflow-hidden group">
            {/* Mock QR Code Pattern */}
            <div className="w-full h-full border-4 border-white/20 rounded-xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
              <div className="grid grid-cols-4 grid-rows-4 gap-2 p-4 opacity-40">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className={`rounded-sm ${i % 3 === 0 ? 'bg-white' : 'bg-transparent border border-white/20'}`} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-white group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-emerald-500 text-white p-2 rounded-full shadow-lg"
            >
              <ShieldCheck className="w-4 h-4" />
            </motion.div>
          </div>
          
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md border border-slate-100 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Secure Token</span>
            <span className="text-xs font-bold text-slate-900">ROOM-101-X92</span>
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2">Invite Resident</h3>
        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mb-8">
          Share this unique code with the tenant to let them register and upload their documents.
        </p>

        <div className="flex items-center gap-3 w-full max-w-sm">
          <button 
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold transition-all active:scale-95"
          >
            {isCopied ? <UserCheck className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
            {isCopied ? 'Copied!' : 'Copy Link'}
          </button>
          <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PII Document Manager Partial */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <CreditCard className="w-32 h-32" />
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Residency Evidence</h4>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Pending Verification</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-xs font-medium text-white/60">ID / Passport Scan</span>
              <span className="text-[10px] font-black bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md uppercase tracking-widest">Not Started</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
              <span className="text-xs font-medium text-white/60">Proof of Employment</span>
              <span className="text-[10px] font-black bg-amber-500/20 text-amber-500 px-2 py-1 rounded-md uppercase tracking-widest">Not Started</span>
            </div>
          </div>

          <button className="w-full mt-6 py-3 bg-white text-slate-900 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95">
            Manual Upload
          </button>
        </div>
      </div>
    </div>
  );
}
