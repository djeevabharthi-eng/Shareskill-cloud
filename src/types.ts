export interface SkillItem {
  id: string;
  name: string;
  category: string;
  level?: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  city: string;
  country: string;
  bio: string;
  avatarUrl?: string;
  teachSkills: SkillItem[];
  learnSkills: SkillItem[];
  availability?: string;
  locationPreference?: 'Online' | 'In person' | 'Either';
}

export type RequestStatus = 'pending' | 'accepted' | 'completed' | 'declined';

export interface ExchangeRequest {
  id: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  receiverName: string;
  senderCity?: string;
  receiverCity?: string;
  senderAvatar?: string;
  receiverAvatar?: string;
  skillOffered: string;
  skillRequested: string;
  message?: string;
  status: RequestStatus;
  createdAt: string;
  type: 'incoming' | 'sent';
}

export type MessageMediaType = 'image' | 'video' | 'audio' | 'pdf' | 'document';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  mediaType?: MessageMediaType;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
  timestamp?: number;
  status?: 'sending' | 'delivered' | 'read';
}

export interface ConversationItem {
  partnerId: string;
  partnerName: string;
  partnerAvatar?: string;
  partnerCity?: string;
  partnerBio?: string;
  exchangeId: string;
  skillOffered: string;
  skillRequested: string;
  status: RequestStatus;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt?: string;
}

export interface LearningGoal {
  id: string;
  skill: string;
  targetLevel: string;
  steps: number;
  completedSteps: number;
  weeklyMinutes: number;
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
  minutes: number;
}

export interface UserProgress {
  currentStreak: number;
  longestStreak: number;
  minutesThisWeek: number;
  weeklyTarget: number;
  goals: LearningGoal[];
  logs: DailyLog[];
}

export interface CareerPlanMilestone {
  phase: string;
  title: string;
  duration: string;
  skillsToAcquire: string[];
  recommendedProjects: string[];
}

export interface CareerPlan {
  goal: string;
  horizonMonths: number;
  summary: string;
  milestones: CareerPlanMilestone[];
  suggestedMentors?: string[];
}

export interface ResumeData {
  targetRole: string;
  summary: string;
  coreCompetencies: string[];
  skillsTaught: string[];
  skillsLearned: string[];
  completedExchanges: string[];
  suggestedActionItems: string[];
}

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'ice-candidate' | 'call-ended' | 'join';
  senderId: string;
  targetId?: string;
  sdp?: any;
  candidate?: any;
}

export type SessionStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';

export interface SessionFeedback {
  id: string;
  rating: number; // 1 to 5
  feedbackText: string;
  submittedBy: string;
  submittedByName: string;
  createdAt: string;
}

export interface SkillExchangeSession {
  id: string;
  exchangeId: string;
  partnerId: string;
  partnerName: string;
  partnerEmail?: string;
  partnerAvatar?: string;
  partnerCity?: string;
  partnerCountry?: string;
  partnerBio?: string;
  partnerAvailability?: string;
  myTeachSkill: string;
  partnerTeachSkill: string;
  date: string; // e.g., '2026-09-18'
  time: string; // e.g., '07:00 PM'
  learningMode: 'Online' | 'In person';
  status: SessionStatus;
  notes: string;
  notesUpdatedAt?: string;
  feedback?: SessionFeedback | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'request_accepted' | 'new_message' | 'new_match' | 'session_scheduled' | 'session_completed' | 'request_received';
  title: string;
  description: string;
  timestamp: string;
  timeAgo: string;
  relatedId?: string;
  partnerName?: string;
}

export interface RecommendedPartner {
  member: UserProfile;
  compatibilityScore: number;
  reciprocalMatch: boolean;
  matchReasons: string[];
}
