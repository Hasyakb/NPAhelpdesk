export type UserRole = 'admin' | 'staff' | 'ict_staff';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  createdAt: any;
}

export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'closed' | 'reopened';

export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  department: string;
  status: RequestStatus;
  createdBy: string;
  requesterName: string;
  assignedTo?: string;
  assignedToName?: string;
  officeNumber: string;
  feedback?: string;
  rating?: number;
  confirmedByUser: boolean;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  confirmedAt?: any;
  
  // Category-specific fields
  supportType?: string[]; // For Hardware
  issueType?: string; // For Software and Network
  complaint?: string; // For Hardware
  requestingOfficer?: string; // For Hardware
  designation?: string; // For Hardware
  personalNumber?: string; // For Hardware and Research
  
  division?: string; // For Research
  topicOfMeeting?: string; // For Research
  meetingDate?: string; // For Research
  meetingTime?: string; // For Research
  venueOfMeeting?: string; // For Research
  whatsappNumber?: string; // For Research
  
  // Interaction fields
  technicianNote?: string;
  comments?: {
    id: string;
    text: string;
    authorName: string;
    authorId: string;
    createdAt: any;
  }[];
}

export interface Department {
  id: string;
  name: string;
}

export interface Department {
  id: string;
  name: string;
  isICT: boolean;
}

export const DEFAULT_ICT_DEPARTMENTS = [
  'Software Application and Database Management',
  'Hardware and Infrastructure',
  'Network and Communications',
  'Research and Special Projects'
];
