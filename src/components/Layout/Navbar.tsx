import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../UI';
import { Anchor, LogOut, User, LayoutDashboard, Users } from 'lucide-react';
import { cn } from '../UI';

const Navbar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!user || !profile) return null;

  const navItems = [
    { label: 'Portal Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'staff', 'ict_staff'] },
    { label: 'Personnel Directory', path: '/admin?tab=users', icon: Users, roles: ['admin'] },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-1 border border-gray-100">
            <img 
              src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
              alt="NPA Logo" 
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-npa-green">NPA ICT Service Portal</span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              item.roles.includes(profile.role) && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    location.pathname === item.path 
                      ? "bg-npa-green/10 text-npa-green" 
                      : "text-gray-500 hover:text-[#1d1d1f] hover:bg-gray-100"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            ))}
          </div>

          <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block" />

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold leading-none">{profile.name}</span>
              <span className="text-[11px] text-gray-500 uppercase tracking-tighter font-bold">{profile.role.replace('_', ' ')}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
