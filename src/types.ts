export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: 'student' | 'admin';
  createdAt: string;
}

export interface Appointment {
  id: string;
  userId: string;
  counsellorName: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Message {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  content: string;
  likes: number;
  replies: number;
  isAnonymous: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  content: string;
  likes: number;
  isAnonymous: boolean;
  createdAt: string;
}

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: 'post' | 'comment';
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  category: 'Stress' | 'Anxiety' | 'Sleep' | 'Motivation';
  type: 'article' | 'video' | 'audio' | 'guide';
  url: string;
  thumbnail: string;
  description: string;
  language: 'English' | 'Hindi' | 'Kannada' | 'Telugu' | 'Tamil';
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'Happy' | 'Calm' | 'Stressed' | 'Anxious' | 'Sad';
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  activities: string[];
  timestamp: string;
}

export interface Quiz {
  id: string;
  title: string;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}
