import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Card, Button, Input } from '../components/UI';
import { toast } from 'react-hot-toast';
import { motion } from 'motion/react';
import { Anchor, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white dark:bg-black transition-colors duration-500">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-2xl bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg hover:scale-110 transition-all text-gray-500 dark:text-gray-400"
      >
        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      </button>

      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://nigerianports.gov.ng/wp-content/uploads/2021/04/Lagos-Port-Complex.jpg" 
          alt="NPA Port" 
          className="w-full h-full object-cover opacity-40 dark:opacity-20 grayscale dark:grayscale-0 transition-all duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/90 dark:from-black/80 dark:via-black/60 dark:to-black/90 backdrop-blur-[2px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md relative z-10 px-4"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 bg-white dark:bg-[#1a1a1a] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-black/5 mb-6 p-4 border border-white/50 dark:border-white/10">
            <img 
              src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
              alt="NPA Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-npa-green dark:text-white">NPA ICT Service Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-center px-8 text-sm">
            Official technical support and infrastructure management platform for the Nigerian Ports Authority.
          </p>
        </div>

        <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
            <div>
              <p className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-400 tracking-widest">Security Notice</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                This is a restricted government system. Unauthorized access is strictly prohibited and subject to monitoring.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Personnel Email</label>
              <Input 
                type="email" 
                placeholder="name@npa.gov.ng" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Portal Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full py-4 mt-6 text-base font-bold tracking-tight shadow-xl shadow-npa-green/20"
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </Button>
          </form>
        </Card>
        
        <div className="flex flex-col items-center mt-8 space-y-2">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-medium">
            © {new Date().getFullYear()} Nigerian Ports Authority
          </p>
          <div className="flex items-center gap-4 text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-tighter">
            <span>ICT Department</span>
            <span className="w-1 h-1 rounded-full bg-gray-200 dark:bg-gray-800" />
            <span>Information Security</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
