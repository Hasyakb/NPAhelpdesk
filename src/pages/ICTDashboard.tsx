import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { HelpRequest } from '../types';
import { Card, Button, Badge, cn } from '../components/UI';
import { CheckCircle, Clock, User, MapPin, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { useNavigate } from 'react-router-dom';

const ICTDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [technicianNote, setTechnicianNote] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('assignedTo', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleComplete = async () => {
    if (!selectedRequestId) return;
    try {
      await updateDoc(doc(db, 'requests', selectedRequestId), {
        status: 'completed',
        technicianNote: technicianNote,
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success('Task marked as completed');
      setShowNoteModal(false);
      setTechnicianNote('');
      setSelectedRequestId(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const openNoteModal = (requestId: string) => {
    setSelectedRequestId(requestId);
    setShowNoteModal(true);
  };

  const activeRequests = requests.filter(r => r.status === 'in_progress' || r.status === 'reopened');
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'closed');

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-npa-green dark:text-white">ICT Operations Center</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Manage and resolve assigned technical service requests.</p>
        </div>
      </header>

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'active' ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          )}
        >
          Assigned Requests
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            activeTab === 'active' ? "bg-npa-green text-white" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
          )}>
            {activeRequests.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'completed' ? "bg-white dark:bg-white/10 text-npa-green dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          )}
        >
          Resolution Archive
          <span className={cn(
            "text-[10px] px-2 py-0.5 rounded-full",
            activeTab === 'completed' ? "bg-npa-green text-white" : "bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400"
          )}>
            {completedRequests.length}
          </span>
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'active' ? (
          activeRequests.length === 0 ? (
            <Card className="py-20 text-center flex flex-col items-center dark:bg-[#0a0a0a] dark:border-white/5">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-gray-200 dark:text-gray-700" />
              </div>
              <h3 className="text-lg font-bold text-gray-400 dark:text-gray-500">All caught up!</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500">No active tasks assigned to you.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeRequests.map((req) => (
                <motion.div key={req.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <Card className="p-6 border-l-4 border-l-npa-green h-full flex flex-col dark:bg-[#0a0a0a] dark:border-white/5">
                    <div className="cursor-pointer flex-grow" onClick={() => navigate(`/request/${req.id}`)}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <Badge status={req.status} />
                          <h3 className="text-xl font-bold dark:text-white">{req.title}</h3>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase">#{req.id.slice(-6)}</span>
                      </div>

                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{req.description}</p>

                      {req.supportType && req.supportType.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {req.supportType.slice(0, 3).map(t => <span key={t} className="text-[9px] bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded uppercase font-bold">{t}</span>)}
                          {req.supportType.length > 3 && <span className="text-[9px] text-gray-400 dark:text-gray-500">+{req.supportType.length - 3} more</span>}
                        </div>
                      )}

                      {req.issueType && (
                        <div className="mb-4">
                          <span className="text-[9px] bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold">{req.issueType}</span>
                        </div>
                      )}

                      {req.topicOfMeeting && (
                        <div className="bg-gray-50 dark:bg-white/5 p-2 rounded-lg mb-4 text-[10px] text-gray-500 dark:text-gray-400">
                          <p className="font-bold text-gray-700 dark:text-gray-300">Meeting: {req.topicOfMeeting}</p>
                          <p>{req.meetingDate} @ {req.meetingTime}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 dark:text-gray-500">Requester</p>
                            <p className="font-medium text-[#1d1d1f] dark:text-white truncate">{req.requesterName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 dark:text-gray-500">Location</p>
                            <p className="font-medium text-[#1d1d1f] dark:text-white truncate">{req.officeNumber}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {req.updatedAt ? formatDistanceToNow(req.updatedAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </div>
                      <Button onClick={(e) => { e.stopPropagation(); openNoteModal(req.id); }} className="px-6 font-bold">
                        <CheckCircle className="w-4 h-4" /> Finalize Resolution
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-4">
            {completedRequests.length === 0 ? (
              <p className="text-gray-400 text-center py-20">No completed tasks in your history.</p>
            ) : (
              completedRequests.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)).map((req) => (
                <Card key={req.id} className="p-5 bg-white/50 border-gray-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all" onClick={() => navigate(`/request/${req.id}`)}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{req.title}</h4>
                        <p className="text-xs text-gray-400">
                          Completed {req.updatedAt ? formatDistanceToNow(req.updatedAt.toDate(), { addSuffix: true }) : 'Just now'}
                        </p>
                      </div>
                    </div>
                    <Badge status={req.status} />
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
      {/* Technician Note Modal */}
      <AnimatePresence>
        {showNoteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoteModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md"
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-4 text-npa-green">Resolution Report</h2>
                <p className="text-gray-500 text-sm mb-6">Please document the technical actions taken to resolve this service request for official records.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Official Resolution Note</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-[#f5f5f7] border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-npa-green/20 outline-none transition-all text-[15px] h-32 resize-none"
                      placeholder="Describe the technical steps taken..."
                      value={technicianNote}
                      onChange={e => setTechnicianNote(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 py-4 font-bold" 
                      onClick={handleComplete}
                      disabled={!technicianNote.trim()}
                    >
                      Submit Resolution
                    </Button>
                    <Button variant="secondary" onClick={() => setShowNoteModal(false)} className="px-6">
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

export default ICTDashboard;
