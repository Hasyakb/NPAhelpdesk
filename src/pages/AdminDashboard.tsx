import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, getDocs, where, addDoc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, getAuth, signOut, updatePassword } from 'firebase/auth';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { db, auth } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { HelpRequest, UserProfile, Department, DEFAULT_ICT_DEPARTMENTS } from '../types';
import { Card, Button, Input, Badge, cn } from '../components/UI';
import { Filter, UserPlus, Search, ArrowRight, User as UserIcon, BarChart3, Trash2, Key, Building, Users, LayoutDashboard, Plus, Upload, Eye, EyeOff, AlertTriangle, Mail, Lock } from 'lucide-react';
import Papa from 'papaparse';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { useNavigate, useSearchParams } from 'react-router-dom';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const handleFirestoreError = (error: any, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details:', JSON.stringify(errInfo, null, 2));
  return errInfo;
};

const getSecondaryAuth = () => {
  const secondaryAppName = 'secondary-auth';
  let secondaryApp;
  if (getApps().some(app => app.name === secondaryAppName)) {
    secondaryApp = getApp(secondaryAppName);
  } else {
    secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  }
  return getAuth(secondaryApp);
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'requests' | 'users' | 'departments') || 'requests';
  
  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [ictStaff, setIctStaff] = useState<UserProfile[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'user' | 'dept', id: string, name: string } | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'staff', department: '' });
  const [newDept, setNewDept] = useState({ name: '', isICT: false });
  const [resetData, setResetData] = useState({ email: '', newPassword: '', mode: 'email' as 'email' | 'manual' });

  useEffect(() => {
    const unsubRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'requests');
      toast.error('Permission denied for requests directory');
    });

    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as UserProfile);
      setAllUsers(users);
      setIctStaff(users.filter(u => u.role === 'ict_staff'));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
      toast.error('Permission denied for personnel directory');
    });

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
      const depts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department));
      setDepartments(depts);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'departments');
      toast.error('Permission denied for organizational units');
    });

    return () => {
      unsubRequests();
      unsubUsers();
      unsubDepts();
    };
  }, []);

  const handleResetPassword = async () => {
    if (resetData.mode === 'email') {
      try {
        await sendPasswordResetEmail(auth, resetData.email);
        toast.success(`Password reset email sent to ${resetData.email}`);
        setShowResetModal(false);
      } catch (error) {
        toast.error('Failed to send reset email');
      }
    } else {
      if (resetData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      // Manual reset requires Admin SDK or re-authentication in client side which is tricky.
      // For this app, we'll suggest using email reset or tell them it's a placeholder for Admin SDK.
      toast.error('Manual password reset requires Admin privileges not available in client-side SDK. Please use the Email option.');
    }
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    
    setLoading(true);
    try {
      if (showDeleteConfirm.type === 'user') {
        await deleteDoc(doc(db, 'users', showDeleteConfirm.id));
        toast.success('User profile deleted');
      } else {
        await deleteDoc(doc(db, 'departments', showDeleteConfirm.id));
        toast.success('Department deleted');
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDept = async () => {
    if (!newDept.name) return;
    try {
      await addDoc(collection(db, 'departments'), {
        ...newDept,
        createdAt: serverTimestamp()
      });
      setNewDept({ name: '', isICT: false });
      setShowDeptModal(false);
      toast.success('Department added');
    } catch (error) {
      toast.error('Failed to add department');
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    setShowDeleteConfirm({ type: 'dept', id, name });
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.name || !newUser.password) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const secondaryAuth = getSecondaryAuth();
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const uid = userCredential.user.uid;
      
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      await signOut(secondaryAuth);
      toast.success('User created successfully');
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'staff', department: '' });
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This personnel email is already registered in the system.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('The password provided is too weak. Minimum 6 characters required.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('The email address provided is invalid.');
      } else {
        toast.error(error.message || 'Failed to provision personnel');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const users = results.data as any[];
        let successCount = 0;
        let failCount = 0;
        const secondaryAuth = getSecondaryAuth();

        for (const u of users) {
          if (u.email && u.name) {
            try {
              // Create Auth User
              const password = u.password || 'NPA12345';
              const userCredential = await createUserWithEmailAndPassword(secondaryAuth, u.email, password);
              const uid = userCredential.user.uid;

              // Create Firestore Profile
              await setDoc(doc(db, 'users', uid), {
                uid,
                name: u.name,
                email: u.email,
                role: u.role || 'staff',
                department: u.department || 'General',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });

              await signOut(secondaryAuth);
              successCount++;
            } catch (error: any) {
              console.error(`Failed to create user ${u.email}:`, error);
              if (error.code === 'auth/email-already-in-use') {
                console.warn(`Email already in use: ${u.email}`);
              }
              failCount++;
            }
          }
        }
        
        setLoading(false);
        if (failCount === 0) {
          toast.success(`Successfully provisioned ${successCount} personnel.`);
        } else if (successCount > 0) {
          toast.success(`Bulk provisioning complete: ${successCount} success, ${failCount} failed (check console for details).`);
        } else {
          toast.error(`Bulk provisioning failed for all ${failCount} records.`);
        }
        setShowUserModal(false);
      }
    });
  };

  const handleAssign = async (requestId: string, staffId: string) => {
    const staff = ictStaff.find(s => s.uid === staffId);
    if (!staff) return;

    try {
      await updateDoc(doc(db, 'requests', requestId), {
        assignedTo: staffId,
        assignedToName: staff.name,
        status: 'in_progress',
        updatedAt: new Date(),
      });
      toast.success(`Assigned to ${staff.name}`);
    } catch (error) {
      toast.error('Assignment failed');
    }
  };

  const handleExportCSV = () => {
    const data = requests.map(req => ({
      'Request ID': req.id,
      'Subject': req.title,
      'Requester': req.requesterName,
      'Department': req.department,
      'Status': req.status.toUpperCase(),
      'Assigned To': req.assignedToName || 'Unassigned',
      'Created At': req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'N/A',
      'Completed At': req.completedAt ? new Date(req.completedAt.seconds * 1000).toLocaleString() : 'N/A',
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `NPA_ICT_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Official report generated');
  };

  const filteredRequests = requests.filter(req => {
    const matchesFilter = filter === 'all' || req.status === filter;
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase()) || 
                          req.requesterName.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed' || r.status === 'closed').length,
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-npa-green dark:text-white">Administrative Control Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Official oversight of ICT infrastructure and personnel support.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button variant="secondary" onClick={() => setShowResetModal(true)} className="w-full sm:w-auto dark:bg-white/5 dark:border-white/10 dark:text-white">
            <Key className="w-4 h-4" /> Reset Password
          </Button>
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab('requests')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2", 
                activeTab === 'requests' 
                  ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              )}
            >
              <LayoutDashboard className="w-4 h-4" /> Registry
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2", 
                activeTab === 'users' 
                  ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              )}
            >
              <Users className="w-4 h-4" /> Personnel
            </button>
            <button 
              onClick={() => setActiveTab('departments')}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2", 
                activeTab === 'departments' 
                  ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
              )}
            >
              <Building className="w-4 h-4" /> Units
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'requests' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-npa-green dark:text-white">Service Request Registry</h2>
            <Button variant="secondary" onClick={handleExportCSV} className="border border-gray-200 dark:border-white/10 dark:bg-white/5">
              <Upload className="w-4 h-4 rotate-180" /> Generate Official Report
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Requests', value: stats.total, color: 'bg-blue-500' },
              { label: 'Pending', value: stats.pending, color: 'bg-orange-500' },
              { label: 'In Progress', value: stats.inProgress, color: 'bg-blue-400' },
              { label: 'Completed', value: stats.completed, color: 'bg-green-500' },
            ].map((stat, i) => (
              <Card key={i} className="p-6 flex items-center justify-between dark:bg-[#0a0a0a] dark:border-white/5">
                <div>
                  <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold dark:text-white">{stat.value}</p>
                </div>
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white", stat.color)}>
                  <BarChart3 className="w-6 h-6" />
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-white/50 dark:bg-white/5 border-none shadow-none">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  placeholder="Search by title or requester..." 
                  className="pl-12 bg-white dark:bg-white/5 dark:border-white/10"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="px-5 py-3.5 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl outline-none text-sm font-medium dark:text-white"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                  <option value="reopened">Reopened</option>
                </select>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {filteredRequests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((req) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/request/${req.id}`)}
                className="cursor-pointer"
              >
                <Card className="p-5 hover:border-npa-green/30 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge status={req.status} />
                        <span className="text-xs text-gray-400 font-mono">#{req.id.slice(-6)}</span>
                      </div>
                      <h3 className="text-lg font-bold mb-1">{req.title}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> {req.requesterName}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded uppercase tracking-tighter">{req.department}</span>
                        <span>Office: {req.officeNumber}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 min-w-[300px]">
                      {req.status === 'pending' || req.status === 'reopened' ? (
                        <div className="w-full flex items-center gap-2">
                          <select 
                            className="flex-grow px-4 py-2.5 bg-[#f5f5f7] rounded-xl text-sm outline-none"
                            onChange={(e) => { e.stopPropagation(); handleAssign(req.id, e.target.value); }}
                            defaultValue=""
                          >
                            <option value="" disabled>Assign to ICT Staff...</option>
                            {ictStaff.map(staff => (
                              <option key={staff.uid} value={staff.uid}>{staff.name}</option>
                            ))}
                          </select>
                          <Button variant="secondary" className="p-2.5 rounded-xl">
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium">{req.assignedToName || 'Unassigned'}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">Assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-npa-green">Personnel Directory</h2>
            <Button onClick={() => setShowUserModal(true)}>
              <UserPlus className="w-4 h-4" /> Provision Personnel
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUsers.map(user => (
              <Card key={user.uid} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge status={user.role === 'admin' ? 'pending' : user.role === 'ict_staff' ? 'in_progress' : 'completed'}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="space-y-3 pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building className="w-3.5 h-3.5" /> {user.department || 'No Department'}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="secondary" 
                      className="flex-1 py-2 text-xs"
                      onClick={() => {
                        setResetData({ email: user.email, newPassword: '', mode: 'email' });
                        setShowResetModal(true);
                      }}
                    >
                      <Key className="w-3.5 h-3.5" /> Reset
                    </Button>
                    <Button 
                      variant="danger" 
                      className="flex-1 py-2 text-xs"
                      onClick={() => setShowDeleteConfirm({ type: 'user', id: user.uid, name: user.name })}
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-npa-green dark:text-white">Organizational Units</h2>
            <Button onClick={() => setShowDeptModal(true)}>
              <Plus className="w-4 h-4" /> Register Unit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Default ICT Departments (Read Only) */}
            {DEFAULT_ICT_DEPARTMENTS.map(dept => (
              <Card key={dept} className="p-6 border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <span className="font-bold text-blue-900 dark:text-blue-100">{dept}</span>
                  </div>
                  <Badge status="in_progress">ICT</Badge>
                </div>
              </Card>
            ))}
            
            {/* Custom Departments */}
            {departments.map(dept => (
              <Card key={dept.id} className="p-6 dark:bg-[#0a0a0a] dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                    <span className="font-bold dark:text-white">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={dept.isICT ? 'in_progress' : 'completed'}>
                      {dept.isICT ? 'ICT' : 'Staff'}
                    </Badge>
                    <button 
                      onClick={() => handleDeleteDept(dept.id, dept.name)}
                      className="p-2 text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUserModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md">
              <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold dark:text-white">Add User</h2>
                  <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl">
                    <button onClick={() => setBulkMode(false)} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", !bulkMode ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400")}>Single</button>
                    <button onClick={() => setBulkMode(true)} className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", bulkMode ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400")}>Bulk</button>
                  </div>
                </div>

                {!bulkMode ? (
                  <div className="space-y-4">
                    <Input placeholder="Full Name" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="dark:bg-white/5 dark:border-white/10 dark:text-white" />
                    <Input placeholder="Email Address" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="dark:bg-white/5 dark:border-white/10 dark:text-white" />
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Temporary Password (min 6 chars)" 
                        value={newUser.password} 
                        onChange={e => setNewUser({...newUser, password: e.target.value})} 
                        className="dark:bg-white/5 dark:border-white/10 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <select className="w-full px-5 py-3.5 bg-[#f5f5f7] dark:bg-white/5 rounded-2xl outline-none dark:text-white dark:border-white/10" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                      <option value="staff" className="dark:bg-[#0a0a0a]">Staff</option>
                      <option value="ict_staff" className="dark:bg-[#0a0a0a]">ICT Staff</option>
                      <option value="admin" className="dark:bg-[#0a0a0a]">Admin</option>
                    </select>
                    <select className="w-full px-5 py-3.5 bg-[#f5f5f7] dark:bg-white/5 rounded-2xl outline-none dark:text-white dark:border-white/10" value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})}>
                      <option value="" className="dark:bg-[#0a0a0a]">Select Department...</option>
                      {DEFAULT_ICT_DEPARTMENTS.map(d => <option key={d} value={d} className="dark:bg-[#0a0a0a]">{d}</option>)}
                      {departments.map(d => <option key={d.id} value={d.name} className="dark:bg-[#0a0a0a]">{d.name}</option>)}
                    </select>
                    <Button className="w-full py-4" onClick={handleCreateUser} disabled={loading}>
                      {loading ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-8 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2rem] text-center">
                      <Upload className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload a CSV file with columns:<br/><b>name, email, role, department</b></p>
                      <input type="file" accept=".csv" onChange={handleBulkUpload} className="hidden" id="csv-upload" />
                      <label htmlFor="csv-upload" className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all dark:text-white">
                        Select CSV File
                      </label>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dept Modal */}
      <AnimatePresence>
        {showDeptModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeptModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md">
              <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
                <h2 className="text-2xl font-bold mb-6 dark:text-white">Add Department</h2>
                <div className="space-y-4">
                  <Input placeholder="Department Name" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="dark:bg-white/5 dark:border-white/10 dark:text-white" />
                  <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl cursor-pointer">
                    <input type="checkbox" checked={newDept.isICT} onChange={e => setNewDept({...newDept, isICT: e.target.checked})} className="w-5 h-5 rounded border-gray-300 dark:border-white/10 text-[#0071e3] focus:ring-[#0071e3]" />
                    <span className="text-sm font-medium dark:text-gray-300">This is an ICT Department</span>
                  </label>
                  <Button className="w-full py-4" onClick={handleAddDept}>Add Department</Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteConfirm(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md">
              <Card className="p-8 text-center dark:bg-[#0a0a0a] dark:border-white/5">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2 dark:text-white">Confirm Delete</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  Are you sure you want to delete <b>{showDeleteConfirm.name}</b>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <Button variant="danger" className="flex-1 py-3" onClick={confirmDelete} disabled={loading}>
                    {loading ? 'Deleting...' : 'Yes, Delete'}
                  </Button>
                  <Button variant="secondary" className="flex-1 py-3 dark:bg-white/5 dark:border-white/10 dark:text-white" onClick={() => setShowDeleteConfirm(null)}>
                    Cancel
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Password Reset Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowResetModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md">
              <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
                <h2 className="text-2xl font-bold mb-2 dark:text-white">Reset Password</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Choose how you want to reset the password for <b>{resetData.email}</b></p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button 
                      onClick={() => setResetData({...resetData, mode: 'email'})}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                        resetData.mode === 'email' ? "border-[#0071e3] bg-blue-50 dark:bg-blue-500/10" : "border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20"
                      )}
                    >
                      <Mail className={cn("w-6 h-6", resetData.mode === 'email' ? "text-[#0071e3]" : "text-gray-400 dark:text-gray-600")} />
                      <span className="text-xs font-bold uppercase tracking-widest dark:text-gray-300">Email Link</span>
                    </button>
                    <button 
                      onClick={() => setResetData({...resetData, mode: 'manual'})}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                        resetData.mode === 'manual' ? "border-[#0071e3] bg-blue-50 dark:bg-blue-500/10" : "border-gray-100 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/20"
                      )}
                    >
                      <Lock className={cn("w-6 h-6", resetData.mode === 'manual' ? "text-[#0071e3]" : "text-gray-400 dark:text-gray-600")} />
                      <span className="text-xs font-bold uppercase tracking-widest dark:text-gray-300">Manual Set</span>
                    </button>
                  </div>

                  {resetData.mode === 'manual' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 ml-1">New Password</label>
                      <Input 
                        type="password" 
                        placeholder="Min 6 characters" 
                        value={resetData.newPassword}
                        onChange={e => setResetData({...resetData, newPassword: e.target.value})}
                        className="dark:bg-white/5 dark:border-white/10 dark:text-white"
                      />
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
                        Note: Manual reset is only available via Firebase Admin SDK. This option will send instructions to the user instead.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <Button className="flex-1 py-4" onClick={handleResetPassword}>
                      {resetData.mode === 'email' ? 'Send Reset Email' : 'Update Password'}
                    </Button>
                    <Button variant="secondary" className="px-6 dark:bg-white/5 dark:border-white/10 dark:text-white" onClick={() => setShowResetModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
