import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { HelpRequest, DEFAULT_ICT_DEPARTMENTS, Department } from '../types';
import { Card, Button, Input, Badge, cn } from '../components/UI';
import { Plus, Clock, CheckCircle, AlertCircle, MessageSquare, Star, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

import { useNavigate } from 'react-router-dom';

const StaffDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{id: string, confirmed: boolean} | null>(null);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [form, setForm] = useState({
    title: '',
    description: '',
    department: DEFAULT_ICT_DEPARTMENTS[0],
    officeNumber: '',
    
    // Software/Network specific
    issueType: '',
    
    // Hardware specific
    supportType: [] as string[],
    complaint: '',
    requestingOfficer: '',
    designation: '',
    personalNumber: '',
    
    // Research specific
    division: '',
    topicOfMeeting: '',
    meetingDate: '',
    meetingTime: '',
    venueOfMeeting: '',
    whatsappNumber: '',
  });

  const SUPPORT_TYPES = ['Email', 'Computer', 'Printer', 'Toner', 'UPS', 'Network', 'Software', 'Others'];
  const SOFTWARE_ISSUES = ['Java (JDK) Problem', 'Oracle Password Reset', 'Database Access', 'Software Installation', 'Others'];
  const NETWORK_ISSUES = ['Internet Connectivity', 'Local Network (LAN)', 'VPN Access', 'Wi-Fi Problem', 'Others'];

  const handleSupportTypeChange = (type: string) => {
    setForm(prev => ({
      ...prev,
      supportType: prev.supportType.includes(type) 
        ? prev.supportType.filter(t => t !== type)
        : [...prev.supportType, type]
    }));
  };

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'requests'), where('createdBy', '==', user.uid));
    const unsubRequests = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HelpRequest)));
      setLoading(false);
    });

    const unsubDepts = onSnapshot(collection(db, 'departments'), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Department)));
    });

    return () => {
      unsubRequests();
      unsubDepts();
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    try {
      // Build the final request object based on department
      const requestData: any = {
        title: form.title,
        description: form.description,
        department: form.department,
        officeNumber: form.officeNumber,
        status: 'pending',
        createdBy: user.uid,
        requesterName: profile.name,
        confirmedByUser: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (form.department === 'Software Application and Database Management') {
        requestData.issueType = form.issueType;
      } else if (form.department === 'Network and Communications') {
        requestData.issueType = form.issueType;
      } else if (form.department === 'Hardware and Infrastructure') {
        requestData.supportType = form.supportType;
        requestData.complaint = form.complaint;
        requestData.requestingOfficer = form.requestingOfficer;
        requestData.designation = form.designation;
        requestData.personalNumber = form.personalNumber;
      } else if (form.department === 'Research and Special Projects') {
        requestData.division = form.division;
        requestData.topicOfMeeting = form.topicOfMeeting;
        requestData.meetingDate = form.meetingDate;
        requestData.meetingTime = form.meetingTime;
        requestData.venueOfMeeting = form.venueOfMeeting;
        requestData.whatsappNumber = form.whatsappNumber;
        requestData.personalNumber = form.personalNumber;
      }

      await addDoc(collection(db, 'requests'), requestData);
      toast.success('Request submitted successfully');
      setShowModal(false);
      resetForm();
    } catch (error: any) {
      toast.error('Failed to submit request');
    }
  };

  const handleConfirm = async () => {
    if (!selectedRequest) return;
    try {
      await updateDoc(doc(db, 'requests', selectedRequest.id), {
        status: selectedRequest.confirmed ? 'closed' : 'reopened',
        confirmedByUser: selectedRequest.confirmed,
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        feedback,
        rating
      });
      toast.success(selectedRequest.confirmed ? 'Work confirmed and closed' : 'Issue reported and reopened');
      setShowFeedbackModal(false);
      setFeedback('');
      setRating(5);
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error('Action failed');
    }
  };

  const resetForm = () => {
    setForm({ 
      title: '', description: '', department: DEFAULT_ICT_DEPARTMENTS[0], officeNumber: '',
      issueType: '',
      supportType: [], complaint: '', requestingOfficer: '', designation: '', personalNumber: '',
      division: '', topicOfMeeting: '', meetingDate: '', meetingTime: '', venueOfMeeting: '', whatsappNumber: ''
    });
  };

  const openFeedbackModal = (requestId: string, confirmed: boolean) => {
    setSelectedRequest({ id: requestId, confirmed });
    setShowFeedbackModal(true);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2 text-npa-green dark:text-white">ICT Service Portal</h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg">Official personnel support and infrastructure management.</p>
        </motion.div>
        <Button onClick={() => setShowModal(true)} className="h-12 px-8 text-base font-bold">
          <Plus className="w-5 h-5" /> Submit Service Request
        </Button>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-200 rounded-[2rem] animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center dark:bg-[#0a0a0a] dark:border-white/5">
          <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold mb-2 dark:text-white">No requests yet</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-xs">Submit your first ICT support request to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((req, index) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(`/request/${req.id}`)}
              className="cursor-pointer"
            >
              <Card className="h-full flex flex-col group hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 dark:bg-[#0a0a0a] dark:border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <Badge status={req.status} />
                  <span className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">#{req.id.slice(-6)}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 group-hover:text-npa-green dark:group-hover:text-white transition-colors dark:text-white">{req.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 flex-grow">{req.description}</p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {req.createdAt ? formatDistanceToNow(req.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                    </div>
                    <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded uppercase tracking-tighter">{req.department.split(' ')[0]}</span>
                  </div>

                  {req.status === 'completed' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="primary" 
                        className="flex-1 py-3 text-xs"
                        onClick={(e) => { e.stopPropagation(); openFeedbackModal(req.id, true); }}
                      >
                        <CheckCircle className="w-4 h-4" /> Confirm
                      </Button>
                      <Button 
                        variant="danger" 
                        className="flex-1 py-3 text-xs"
                        onClick={(e) => { e.stopPropagation(); openFeedbackModal(req.id, false); }}
                      >
                        <AlertCircle className="w-4 h-4" /> Report Issue
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Request Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl"
            >
              <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
                <h2 className="text-2xl font-bold mb-6 text-npa-green dark:text-white">Service Request Form</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-2xl mb-6">
                    <p className="text-[10px] font-bold uppercase text-blue-800 dark:text-blue-400 tracking-widest mb-1">Official Procedure</p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
                      Please ensure all fields are accurately completed. This request will be logged for official record-keeping and quality assurance.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Subject / Title</label>
                    <Input 
                      placeholder="Brief summary of the issue" 
                      required 
                      value={form.title}
                      onChange={e => setForm({...form, title: e.target.value})}
                      className="dark:bg-white/5 dark:border-white/10"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Service Department</label>
                    <select 
                      className="w-full px-5 py-3.5 bg-[#f5f5f7] dark:bg-white/5 border-transparent dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-npa-green/20 outline-none transition-all text-[15px] dark:text-white"
                      value={form.department}
                      onChange={e => setForm({...form, department: e.target.value})}
                    >
                      <optgroup label="ICT Departments" className="dark:bg-[#0a0a0a]">
                        {DEFAULT_ICT_DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                      </optgroup>
                      {departments.length > 0 && (
                        <optgroup label="Other Departments" className="dark:bg-[#0a0a0a]">
                          {departments.map(dept => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  {form.department === 'Software Application and Database Management' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Type of Issue</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-[#f5f5f7] border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all text-[15px]"
                          value={form.issueType}
                          onChange={e => setForm({...form, issueType: e.target.value})}
                          required
                        >
                          <option value="" disabled>Select issue type...</option>
                          {SOFTWARE_ISSUES.map(issue => <option key={issue} value={issue}>{issue}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {form.department === 'Network and Communications' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Type of Issue</label>
                        <select 
                          className="w-full px-5 py-3.5 bg-[#f5f5f7] border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all text-[15px]"
                          value={form.issueType}
                          onChange={e => setForm({...form, issueType: e.target.value})}
                          required
                        >
                          <option value="" disabled>Select issue type...</option>
                          {NETWORK_ISSUES.map(issue => <option key={issue} value={issue}>{issue}</option>)}
                        </select>
                      </div>
                    </motion.div>
                  )}

                  {form.department === 'Hardware and Infrastructure' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Type of Support</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {SUPPORT_TYPES.map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleSupportTypeChange(type)}
                              className={cn(
                                "px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                                form.supportType.includes(type) 
                                  ? "bg-npa-green text-white border-npa-green" 
                                  : "bg-white text-gray-500 border-gray-100 hover:border-gray-300"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Requesting Officer</label>
                          <Input value={form.requestingOfficer} onChange={e => setForm({...form, requestingOfficer: e.target.value})} placeholder="Name" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Designation</label>
                          <Input value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} placeholder="Title" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Personal Number (PN)</label>
                        <Input value={form.personalNumber} onChange={e => setForm({...form, personalNumber: e.target.value})} placeholder="PN" />
                      </div>
                    </motion.div>
                  )}

                  {form.department === 'Research and Special Projects' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Division</label>
                          <Input value={form.division} onChange={e => setForm({...form, division: e.target.value})} placeholder="Division" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Topic of Meeting</label>
                          <Input value={form.topicOfMeeting} onChange={e => setForm({...form, topicOfMeeting: e.target.value})} placeholder="Topic" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Meeting Date</label>
                          <Input type="date" value={form.meetingDate} onChange={e => setForm({...form, meetingDate: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Meeting Time</label>
                          <Input type="time" value={form.meetingTime} onChange={e => setForm({...form, meetingTime: e.target.value})} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Venue of Meeting</label>
                        <Input value={form.venueOfMeeting} onChange={e => setForm({...form, venueOfMeeting: e.target.value})} placeholder="Venue" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Personal Number</label>
                          <Input value={form.personalNumber} onChange={e => setForm({...form, personalNumber: e.target.value})} placeholder="PN" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">WhatsApp Number</label>
                          <Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} placeholder="WhatsApp" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Office Number / Room No / Ext No</label>
                    <Input 
                      placeholder="e.g. Room 402, Ext 1234" 
                      required 
                      value={form.officeNumber}
                      onChange={e => setForm({...form, officeNumber: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">
                      {form.department === 'Hardware and Infrastructure' ? 'Complaint Details' : 'Detailed Description'}
                    </label>
                    <textarea 
                      className="w-full px-5 py-4 bg-[#f5f5f7] dark:bg-white/5 border-transparent dark:border-white/10 rounded-2xl focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all text-[15px] h-32 resize-none dark:text-white"
                      placeholder="Please provide as much detail as possible..."
                      required
                      value={form.description}
                      onChange={e => setForm({...form, description: e.target.value})}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button type="submit" className="flex-1 py-4 text-base">
                      <Send className="w-4 h-4" /> Submit Request
                    </Button>
                    <Button variant="secondary" type="button" onClick={() => setShowModal(false)} className="px-8">
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md"
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedRequest?.confirmed ? 'Confirm Resolution' : 'Report Issue'}
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  {selectedRequest?.confirmed 
                    ? 'Please provide feedback on the resolution before closing the request.' 
                    : 'Please describe the remaining issues so the technician can address them.'}
                </p>
                
                <div className="space-y-6">
                  {selectedRequest?.confirmed && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button 
                            key={num}
                            onClick={() => setRating(num)}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                              rating >= num ? "bg-yellow-400 text-white" : "bg-gray-100 text-gray-400"
                            )}
                          >
                            <Star className={cn("w-5 h-5", rating >= num && "fill-current")} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
                      {selectedRequest?.confirmed ? 'Feedback / Comment' : 'Reason for Reopening'}
                    </label>
                    <textarea 
                      className="w-full px-5 py-4 bg-[#f5f5f7] border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all text-[15px] h-32 resize-none"
                      placeholder={selectedRequest?.confirmed ? "How was your experience?" : "What is still not working?"}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button 
                      className={cn("flex-1 py-4", !selectedRequest?.confirmed && "bg-red-500 hover:bg-red-600")} 
                      onClick={handleConfirm}
                      disabled={!feedback.trim()}
                    >
                      {selectedRequest?.confirmed ? 'Confirm & Close' : 'Reopen Request'}
                    </Button>
                    <Button variant="secondary" onClick={() => setShowFeedbackModal(false)} className="px-6">
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

export default StaffDashboard;
