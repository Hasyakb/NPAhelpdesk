import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { auth } from './firebase';
import { ShieldCheck, Loader2 } from 'lucide-react';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ICTDashboard from './pages/ICTDashboard';
import RequestDetails from './pages/RequestDetails';
import Sidebar from './components/Layout/Sidebar';
import Footer from './components/Layout/Footer';
import { cn } from './components/UI';

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-300">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 text-npa-green animate-spin" />
      <div className="h-1 w-32 bg-gray-200 dark:bg-white/10 rounded overflow-hidden">
        <div className="h-full bg-npa-green animate-[loading_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  </div>
);

const ProfileNotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#f5f5f7] dark:bg-[#000000]">
    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-500/10 rounded-3xl flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-500/20">
      <ShieldCheck className="w-10 h-10 text-amber-500" />
    </div>
    <h2 className="text-2xl font-bold mb-2 dark:text-white">Profile Not Found</h2>
    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
      Your login is valid, but your NPA staff profile has not been created yet. 
      <br /><br />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Note for Admins:</span> Please use the <strong>User Management</strong> page inside the app to add new staff members.
    </p>
    <div className="flex gap-4">
      <button 
        onClick={() => auth.signOut()}
        className="px-8 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-2xl font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
      >
        Sign Out
      </button>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-3 bg-npa-green text-white rounded-2xl font-medium hover:bg-npa-green-hover shadow-lg shadow-npa-green/20 transition-all"
      >
        Refresh
      </button>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <ProfileNotFound />;

  if (roles && !roles.includes(profile.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const DashboardRedirect = () => {
  const { user, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (!profile) return <ProfileNotFound />;

  switch (profile.role) {
    case 'admin': return <Navigate to="/admin" />;
    case 'ict_staff': return <Navigate to="/ict" />;
    case 'staff': return <Navigate to="/staff" />;
    default: return <Navigate to="/login" />;
  }
};

const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  
  // Only redirect if we have BOTH user and profile
  if (user && profile) return <Navigate to="/" />;

  return <>{children}</>;
};

const AppContent = () => {
  const { user, profile } = useAuth();
  const { theme } = useTheme();

  return (
    <div 
      className={cn(
        "min-h-screen bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] font-sans selection:bg-npa-green/20 transition-colors duration-300",
      )}
      style={{ paddingLeft: user && profile ? 'var(--sidebar-width, 0px)' : '0px' }}
    >
      {user && profile && <Sidebar />}
      <main className={cn(
        "container mx-auto px-4 py-8 max-w-7xl",
        user && profile ? "pt-24 md:pt-8" : ""
      )}>
        <Routes>
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          <Route path="/" element={<DashboardRedirect />} />
          
          <Route path="/staff" element={
            <ProtectedRoute roles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/ict" element={
            <ProtectedRoute roles={['ict_staff']}>
              <ICTDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={<Navigate to="/admin?tab=users" replace />} />
          
          <Route path="/request/:id" element={
            <ProtectedRoute>
              <RequestDetails />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
      {(!user || !profile) && <Footer />}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            borderRadius: '1.25rem',
            background: theme === 'dark' ? '#1a1a1a' : '#fff',
            color: theme === 'dark' ? '#fff' : '#1d1d1f',
            boxShadow: '0 8px 30px rgb(0,0,0,0.1)',
            padding: '1rem 1.5rem',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
          },
        }}
      />
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
