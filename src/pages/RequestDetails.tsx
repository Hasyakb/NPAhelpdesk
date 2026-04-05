import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, getDocs, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { HelpRequest, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { Card, Button, Badge, Input, cn } from '../components/UI';
import { ArrowLeft, Clock, User, MapPin, Building, MessageSquare, CheckCircle, AlertCircle, Star, UserPlus, Send, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';

const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [request, setRequest] = useState<HelpRequest | null>(null);
  const [ictStaff, setIctStaff] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'requests', id), (doc) => {
      if (doc.exists()) {
        setRequest({ id: doc.id, ...doc.data() } as HelpRequest);
      }
      setLoading(false);
    });

    const fetchIctStaff = async () => {
      if (profile?.role === 'admin') {
        const qStaff = query(collection(db, 'users'), where('role', '==', 'ict_staff'));
        const snap = await getDocs(qStaff);
        setIctStaff(snap.docs.map(doc => doc.data() as UserProfile));
      }
    };

    fetchIctStaff();
    return () => unsubscribe();
  }, [id, profile]);

  const handleAssign = async (staffId: string) => {
    if (!id || !request) return;
    const staff = ictStaff.find(s => s.uid === staffId);
    if (!staff) return;

    try {
      await updateDoc(doc(db, 'requests', id), {
        assignedTo: staffId,
        assignedToName: staff.name,
        status: 'in_progress',
        updatedAt: serverTimestamp(),
      });
      toast.success(`Assigned to ${staff.name}`);
    } catch (error) {
      toast.error('Assignment failed');
    }
  };

  const handleAction = async (status: string) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'requests', id), {
        status,
        updatedAt: serverTimestamp(),
        ...(status === 'closed' ? { confirmedAt: serverTimestamp(), feedback, rating } : {})
      });
      toast.success(`Request ${status}`);
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim() || !profile) return;

    try {
      await updateDoc(doc(db, 'requests', id), {
        comments: arrayUnion({
          id: Math.random().toString(36).slice(2),
          text: newComment,
          authorName: profile.name,
          authorId: profile.uid,
          createdAt: new Date(),
        }),
        updatedAt: serverTimestamp(),
      });
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-12 bg-gray-200 rounded-xl w-1/4" /><div className="h-64 bg-gray-200 rounded-3xl" /></div>;
  if (!request) return <div className="text-center py-20">Request not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-npa-green dark:hover:text-white transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Portal
        </button>
        <Button variant="secondary" onClick={handlePrint} className="border border-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white">
          <Printer className="w-4 h-4" /> Print Official Record
        </Button>
      </div>

      <div className="hidden print:block mb-8 border-b-2 border-npa-green pb-6 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <img 
            src="https://tse1.mm.bing.net/th/id/OIP.0_ZWomuVeU5KH9T5iRSr8gAAAA?rs=1&pid=ImgDetMain&o=7&rm=3" 
            alt="NPA Logo" 
            className="w-16 h-16 object-contain"
            referrerPolicy="no-referrer"
          />
          <div className="text-left">
            <h1 className="text-2xl font-bold text-npa-green">NIGERIAN PORTS AUTHORITY</h1>
            <p className="text-sm font-bold text-gray-600 uppercase tracking-widest">ICT SERVICE PORTAL - OFFICIAL RECORD</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">Generated on {new Date().toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8 dark:bg-[#0a0a0a] dark:border-white/5">
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <Badge status={request.status} />
                <h1 className="text-3xl font-bold tracking-tight dark:text-white">{request.title}</h1>
              </div>
              <span className="text-xs font-mono text-gray-300 dark:text-gray-600">ID: {request.id}</span>
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none mb-10">
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{request.description}</p>
            </div>

            {/* Category Specific Details */}
            {(request.supportType || request.topicOfMeeting || request.issueType) && (
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-10 space-y-4">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Additional Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {request.issueType && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Issue Type</p>
                      <p className="text-sm font-medium dark:text-gray-300">{request.issueType}</p>
                    </div>
                  )}
                  {request.supportType && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Support Types</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {request.supportType.map(t => <Badge key={t} status="pending" className="bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none">{t}</Badge>)}
                      </div>
                    </div>
                  )}
                  {request.requestingOfficer && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Requesting Officer</p>
                      <p className="text-sm font-medium dark:text-gray-300">{request.requestingOfficer} ({request.designation})</p>
                    </div>
                  )}
                  {request.personalNumber && (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Personal Number (PN)</p>
                      <p className="text-sm font-medium dark:text-gray-300">{request.personalNumber}</p>
                    </div>
                  )}
                  {request.topicOfMeeting && (
                    <div className="col-span-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Meeting Topic</p>
                          <p className="text-sm font-medium dark:text-gray-300">{request.topicOfMeeting}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Division</p>
                          <p className="text-sm font-medium dark:text-gray-300">{request.division}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Date & Time</p>
                          <p className="text-sm font-medium dark:text-gray-300">{request.meetingDate} at {request.meetingTime}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Venue</p>
                          <p className="text-sm font-medium dark:text-gray-300">{request.venueOfMeeting}</p>
                        </div>
                      </div>
                      {request.whatsappNumber && (
                        <div>
                          <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">WhatsApp Number</p>
                          <p className="text-sm font-medium dark:text-gray-300">{request.whatsappNumber}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6 pt-8 border-t border-gray-50 dark:border-white/5">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Submitted On</p>
                <p className="font-medium dark:text-gray-300">{request.createdAt ? format(request.createdAt.toDate(), 'PPP p') : 'Pending'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Last Updated</p>
                <p className="font-medium dark:text-gray-300">{request.updatedAt ? format(request.updatedAt.toDate(), 'PPP p') : 'Pending'}</p>
              </div>
            </div>
          </Card>

            {request.status === 'completed' && profile?.role === 'staff' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print:hidden">
              {request.technicianNote && (
                <Card className="p-6 bg-blue-50/50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-blue-400 dark:text-blue-500 mb-3">Official Resolution Report</h4>
                  <p className="text-gray-700 dark:text-gray-300 italic">"{request.technicianNote}"</p>
                </Card>
              )}
              
              <Card className="p-8 border-2 border-green-100 dark:border-green-500/20 bg-green-50/30 dark:bg-green-500/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 dark:text-white">
                  <CheckCircle className="text-green-500" /> Confirm Resolution
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">The ICT team has marked this as completed. Please review the note above and provide feedback to close the request.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(num => (
                        <button 
                          key={num}
                          onClick={() => setRating(num)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                            rating >= num ? "bg-yellow-400 text-white" : "bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600"
                          )}
                        >
                          <Star className={cn("w-5 h-5", rating >= num && "fill-current")} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Feedback (Required)</label>
                    <textarea 
                      className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-[#0071e3]/20 outline-none transition-all h-24 resize-none dark:text-white"
                      placeholder="How was your experience?"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button 
                      className="flex-1 py-4" 
                      onClick={() => handleAction('closed')}
                      disabled={!feedback.trim()}
                    >
                      Confirm & Close
                    </Button>
                    <Button 
                      variant="danger" 
                      className="px-8" 
                      onClick={() => handleAction('reopened')}
                      disabled={!feedback.trim()}
                    >
                      Still have issues
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Comments Section */}
          <div className="space-y-6 print:hidden">
            <h3 className="text-xl font-bold flex items-center gap-2 text-npa-green dark:text-white">
              <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-600" /> Activity Log
            </h3>
            
            <div className="space-y-4">
              {request.comments?.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds).map((comment) => (
                <div key={comment.id} className={cn(
                  "flex flex-col max-w-[80%] p-4 rounded-2xl",
                  comment.authorId === profile?.uid 
                    ? "ml-auto bg-npa-green text-white rounded-tr-none" 
                    : "bg-gray-100 dark:bg-white/5 text-gray-800 dark:text-gray-300 rounded-tl-none"
                )}>
                  <div className="flex justify-between items-center mb-1 gap-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{comment.authorName}</span>
                    <span className="text-[9px] opacity-50">
                      {comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate ? comment.createdAt.toDate() : new Date(comment.createdAt), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{comment.text}</p>
                </div>
              ))}

              {(!request.comments || request.comments.length === 0) && (
                <p className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm italic">No comments yet. Start the conversation!</p>
              )}
            </div>

            {request.status !== 'closed' && (
              <form onSubmit={handleAddComment} className="relative print:hidden">
                <textarea 
                  className="w-full px-5 py-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:ring-2 focus:ring-npa-green/20 outline-none transition-all h-24 resize-none pr-16 dark:text-white"
                  placeholder="Add an official comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={!newComment.trim()}
                  className="absolute right-4 bottom-4 w-10 h-10 bg-npa-green text-white rounded-full flex items-center justify-center hover:bg-npa-green-hover disabled:opacity-50 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="p-6 space-y-6 dark:bg-[#0a0a0a] dark:border-white/5">
            <h3 className="font-bold text-lg text-npa-green dark:text-white">Service Record Metadata</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Requester</p>
                  <p className="text-sm font-medium dark:text-gray-300">{request.requesterName}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-gray-400 dark:text-gray-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Department</p>
                  <p className="text-sm font-medium dark:text-gray-300">{request.department}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 dark:text-gray-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500">Office Number</p>
                  <p className="text-sm font-medium dark:text-gray-300">{request.officeNumber}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 mb-2">Assigned Technician</p>
                {profile?.role === 'admin' && (request.status === 'pending' || request.status === 'reopened') ? (
                  <div className="space-y-3">
                    <select 
                      className="w-full px-4 py-2.5 bg-[#f5f5f7] dark:bg-white/5 rounded-xl text-sm outline-none border-transparent dark:border-white/10 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[#0071e3]/20 transition-all dark:text-white"
                      onChange={(e) => handleAssign(e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled className="dark:bg-[#0a0a0a]">Select Technician...</option>
                      {ictStaff.map(staff => (
                        <option key={staff.uid} value={staff.uid} className="dark:bg-[#0a0a0a]">{staff.name}</option>
                      ))}
                    </select>
                  </div>
                ) : request.assignedToName ? (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                      {request.assignedToName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium dark:text-gray-300">{request.assignedToName}</span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 dark:text-gray-600 italic">Not assigned yet</span>
                )}
              </div>
            </div>
          </Card>

          {request.status === 'closed' && (
            <Card className="p-6 bg-yellow-50/30 dark:bg-yellow-500/5 border-yellow-100 dark:border-yellow-500/20">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-white">
                <Star className="w-5 h-5 text-yellow-500 fill-current" /> User Feedback
              </h3>
              <div className="space-y-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(num => (
                    <Star key={num} className={cn("w-4 h-4", (request.rating || 0) >= num ? "text-yellow-500 fill-current" : "text-gray-200 dark:text-gray-700")} />
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{request.feedback || 'No feedback provided'}"</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
