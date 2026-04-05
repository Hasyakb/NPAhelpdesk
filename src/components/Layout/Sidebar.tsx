import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  User, 
  Moon, 
  Sun, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  Settings,
  ShieldCheck,
  Building2,
  FileText
} from 'lucide-react';
import { cn } from '../UI';
import { motion, AnimatePresence } from 'motion/react';

const Sidebar = () => {
  const { user, profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (user && profile) {
      document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '80px' : '256px');
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [isCollapsed, user, profile]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user || !profile) return null;

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'staff', 'ict_staff'] },
    { label: 'Personnel', path: '/admin?tab=users', icon: Users, roles: ['admin'] },
    { label: 'Departments', path: '/admin?tab=departments', icon: Building2, roles: ['admin'] },
    { label: 'My Requests', path: '/staff', icon: FileText, roles: ['staff'] },
    { label: 'ICT Queue', path: '/ict', icon: ShieldCheck, roles: ['ict_staff'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(profile.role));

  const isItemActive = (itemPath: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    if (itemPath === '/') {
      // Dashboard is active if we are at root OR at the role-specific dashboard path without extra tabs
      return currentPath === '/' || 
             (profile.role === 'admin' && currentPath === '/admin' && !currentSearch) ||
             (profile.role === 'staff' && currentPath === '/staff') ||
             (profile.role === 'ict_staff' && currentPath === '/ict');
    }
    
    const [targetPath, targetSearch] = itemPath.split('?');
    if (targetSearch) {
      return currentPath === targetPath && currentSearch.includes(targetSearch);
    }
    return currentPath === targetPath;
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-white/5 transition-colors duration-300">
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden p-1 border border-gray-100 dark:border-white/10 shrink-0">
          <img 
            src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
            alt="NPA Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="font-bold text-sm tracking-tight text-npa-green dark:text-white leading-tight">NPA ICT</span>
            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Service Portal</span>
          </motion.div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {filteredItems.map((item) => {
          const active = isItemActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative cursor-pointer",
                active 
                  ? "bg-npa-green text-white shadow-lg shadow-npa-green/20" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-npa-green dark:hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "group-hover:scale-110 transition-transform")} />
              {!isCollapsed && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-medium text-sm"
                >
                  {item.label}
                </motion.span>
              )}
              {isCollapsed && (
                <div className="absolute left-14 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-2 border-t border-gray-50 dark:border-white/5">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          {!isCollapsed && (
            <span className="font-medium text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          )}
        </button>

        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5",
          isCollapsed ? "justify-center" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-npa-green/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-npa-green" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate dark:text-white">{profile.name}</span>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">{profile.role.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all group cursor-pointer"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:translate-x-1 transition-transform" />
          {!isCollapsed && <span className="font-medium text-sm">Sign Out</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/10 rounded-full items-center justify-center shadow-sm hover:scale-110 transition-transform z-50"
      >
        {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/5 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <img 
            src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
            alt="NPA Logo" 
            className="w-8 h-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-bold text-npa-green dark:text-white text-sm">NPA ICT Portal</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-500 dark:text-gray-400"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden"
            >
              {renderSidebarContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block fixed inset-y-0 left-0 z-[100] transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {renderSidebarContent()}
      </aside>
    </>
  );
};

export default Sidebar;
