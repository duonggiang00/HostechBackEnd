import { motion } from "framer-motion";
import { BarChart3, Construction } from "lucide-react";
import { GlassCard } from "@shared/components/premium/GlassCard";
import { GradientText } from "@shared/components/premium/GradientText";

const Statistical = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12"
    >
      <GlassCard className="text-center py-20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5">
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <BarChart3 className="w-10 h-10 text-indigo-400" />
        </div>
        <GradientText className="text-4xl font-bold mb-4">
          Análise Avançada
        </GradientText>
        <p className="text-slate-400 text-lg mb-10 max-w-lg mx-auto">
          Estamos preparando relatórios detalhados e insights preditivos baseados em IA para sua gestão.
        </p>
        <div className="flex items-center justify-center gap-2 text-amber-400 bg-amber-400/10 px-6 py-2 rounded-full w-fit mx-auto border border-amber-400/20">
          <Construction className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-wide uppercase">Em Desenvolvimento</span>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default Statistical;
