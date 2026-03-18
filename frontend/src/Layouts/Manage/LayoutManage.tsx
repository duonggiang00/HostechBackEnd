import Header from "./Header";
import { Outlet } from "react-router";
import SidebarAdmin from "./Sidebar";
import Authorization from "../../features/auth/components/verifyLogin";
import { useTokenStore } from "../../features/auth/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";

const LayoutManage = () => {
  const isLoading = useTokenStore((state) => state.isLoading);

  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div 
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center h-screen bg-[#020617]"
        >
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
          </div>
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-slate-400 font-medium tracking-widest text-xs uppercase"
          >
            Sincronizando Hostech...
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="main-layout"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex bg-[#020617] h-screen overflow-hidden text-slate-200"
        >
          <Authorization allowRole={["Admin", "Owner", "Manager", "Staff", "Tenant"]}>
            <SidebarAdmin />
            <main className="flex-1 flex flex-col overflow-hidden relative">
              {/* Subtle background glow */}
              <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />
              
              <Header />
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                  <Outlet />
                </div>
              </div>
            </main>
          </Authorization>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LayoutManage;
