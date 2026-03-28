import React, { useState, useEffect, Component, ErrorInfo, ReactNode, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Calendar, 
  BookOpen, 
  Users, 
  LayoutDashboard, 
  Menu, 
  X, 
  Moon, 
  Sun,
  Heart,
  ChevronRight,
  Send,
  Plus,
  ThumbsUp,
  MessageSquare,
  Filter,
  BarChart2,
  TrendingUp,
  Activity,
  LogOut,
  User as UserIcon,
  AlertCircle,
  Volume2,
  Languages,
  Smile,
  Frown,
  Meh,
  PenTool,
  Gamepad2,
  PhoneCall,
  Brain,
  CheckCircle2,
  Clock,
  Play,
  Shield,
  Check
} from 'lucide-react';
import { auth, db } from './firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDocs,
  getDoc,
  setDoc,
  limit,
  writeBatch
} from 'firebase/firestore';
import { cn } from './lib/utils';
import { getChatResponse, generateSpeech } from './services/gemini';
import { User, Appointment, Message, Post, Resource, Comment } from './types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { handleFirestoreError, OperationType, testConnection } from './lib/firestore';
import { pcmToWav } from './lib/audio';

// --- Error Boundary ---

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#0f172a]">
          <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-indigo-200/60 mb-8 text-sm">
              {this.state.error?.message.startsWith('{') 
                ? "A database error occurred. Please try again later." 
                : this.state.error?.message || "An unexpected error occurred."}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Reload Application
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const GlassCard = ({ children, className, delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={cn(
      "bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden",
      className
    )}
  >
    {children}
  </motion.div>
);

const Button = ({ children, onClick, className, variant = 'primary', icon: Icon }: any) => {
  const variants = {
    primary: "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600",
    secondary: "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border border-white/20",
    outline: "border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-50",
    ghost: "text-indigo-500 hover:bg-indigo-50"
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "px-6 py-3 rounded-2xl font-semibold transition-all flex items-center justify-center gap-2",
        variants[variant as keyof typeof variants],
        className
      )}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};

// --- Pages ---

const LandingPage = ({ onStart, loading, loginType, setLoginType }: { onStart: () => void, loading: boolean, loginType: 'student' | 'admin', setLoginType: (t: 'student' | 'admin') => void }) => (
  <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
    {/* Animated Background Blobs */}
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        rotate: [0, 90, 0],
        x: [0, 50, 0],
        y: [0, -50, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[100px] rounded-full"
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        rotate: [0, -90, 0],
        x: [0, -50, 0],
        y: [0, 50, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 blur-[100px] rounded-full"
    />

    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
      className="z-10 max-w-4xl"
    >
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 text-sm font-medium mb-8">
        {loginType === 'admin' ? <Shield size={16} className="text-indigo-400" /> : <Heart size={16} className="text-pink-400" />}
        <span>{loginType === 'admin' ? 'Administrator Portal' : 'Your Safe Space for Mental Wellness'}</span>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
        {loginType === 'admin' ? 'Admin' : 'Find Your Inner'} <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
          {loginType === 'admin' ? 'Dashboard' : 'Serenity Today'}
        </span>
      </h1>
      
      <p className="text-xl text-indigo-100/70 mb-12 max-w-2xl mx-auto leading-relaxed">
        {loginType === 'admin' 
          ? 'Access student wellness analytics, recognize trends, and plan effective interventions for the student body.'
          : 'Empowering college students with AI-driven support, peer connections, and professional guidance.'}
      </p>

      <div className="flex flex-col items-center gap-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button onClick={onStart} disabled={loading} className="w-full sm:w-auto text-lg px-10 py-4">
            {loading ? 'Starting...' : (loginType === 'admin' ? 'Admin Sign In' : 'Get Started')}
            {!loading && <ChevronRight size={20} />}
          </Button>
          <Button variant="secondary" className="w-full sm:w-auto text-lg px-10 py-4">
            Learn More
          </Button>
        </div>

        <button 
          onClick={() => setLoginType(loginType === 'student' ? 'admin' : 'student')}
          className="text-indigo-300/60 hover:text-white transition-colors text-sm font-medium flex items-center gap-2"
        >
          {loginType === 'student' ? (
            <>
              <Shield size={16} />
              Switch to Admin Login
            </>
          ) : (
            <>
              <UserIcon size={16} />
              Switch to Student Login
            </>
          )}
        </button>
      </div>
    </motion.div>

    {/* Illustration Placeholder */}
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 1 }}
      className="mt-20 w-full max-w-5xl aspect-video bg-gradient-to-b from-white/5 to-transparent rounded-t-[4rem] border-x border-t border-white/10 backdrop-blur-sm"
    >
      <div className="p-8 flex items-center justify-center h-full">
         <div className="grid grid-cols-3 gap-8 w-full opacity-50">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-3xl bg-white/5 border border-white/10 animate-pulse" />
            ))}
         </div>
      </div>
    </motion.div>
  </div>
);

const ChatPage = ({ user, language }: { user: FirebaseUser, language: string }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });
  }, [user.uid]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    
    try {
      await addDoc(collection(db, 'messages'), {
        userId: user.uid,
        role: 'user',
        content: userMsg,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }

    setIsTyping(true);
    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));
      
      const response = await getChatResponse(userMsg, history, language);
      
      await addDoc(collection(db, 'messages'), {
        userId: user.uid,
        role: 'model',
        content: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const playAudio = async (text: string, id: string) => {
    if (playingId === id) return;
    setPlayingId(id);
    try {
      const base64 = await generateSpeech(text);
      if (base64) {
        const wavUrl = pcmToWav(base64);
        const audio = new Audio(wavUrl);
        audio.onended = () => {
          setPlayingId(null);
          URL.revokeObjectURL(wavUrl);
        };
        audio.onerror = (e) => {
          console.error("Audio playback error:", e);
          setPlayingId(null);
          URL.revokeObjectURL(wavUrl);
        };
        await audio.play();
      } else {
        setPlayingId(null);
      }
    } catch (error) {
      console.error(error);
      setPlayingId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-4xl mx-auto">
      <GlassCard className="flex-1 flex flex-col p-6 mb-6">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
                <MessageCircle size={40} className="text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Hello, I'm Serene</h3>
              <p className="text-indigo-200/60 max-w-sm">
                I'm here to listen and support you. How are you feeling today? (Responding in {language})
              </p>
            </div>
          )}
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "flex flex-col",
                m.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed relative group",
                m.role === 'user' 
                  ? "bg-indigo-500 text-white rounded-tr-none" 
                  : "bg-white/10 text-indigo-50 backdrop-blur-md border border-white/10 rounded-tl-none"
              )}>
                {m.content}
                {m.role === 'model' && (
                  <button 
                    onClick={() => playAudio(m.content, m.id)}
                    className={cn(
                      "absolute -right-10 top-2 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100",
                      playingId === m.id && "opacity-100 text-indigo-400 animate-pulse"
                    )}
                  >
                    <Volume2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none flex gap-1">
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400" />
                <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
          <Button onClick={handleSend} className="px-4 py-4 rounded-2xl">
            <Send size={20} />
          </Button>
        </div>
      </GlassCard>
      
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {["I'm feeling stressed", "Need help with sleep", "Just want to talk", "Anxiety support"].map(tag => (
          <button 
            key={tag}
            onClick={() => setInput(tag)}
            className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-200 text-xs hover:bg-white/10 transition-colors"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
};

const BookingPage = ({ user }: { user: FirebaseUser }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedCounsellor, setSelectedCounsellor] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');

  const counsellors = [
    { name: "Dr. Sarah Jenkins", specialty: "Anxiety & Stress", image: "https://picsum.photos/seed/sarah/100" },
    { name: "Mark Thompson", specialty: "Academic Pressure", image: "https://picsum.photos/seed/mark/100" },
    { name: "Dr. Elena Rodriguez", specialty: "Relationships", image: "https://picsum.photos/seed/elena/100" }
  ];

  const timeSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

  useEffect(() => {
    const q = query(collection(db, 'appointments'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });
  }, [user.uid]);

  const handleBook = async () => {
    if (!selectedCounsellor || !selectedDate || !selectedTime) return;
    
    try {
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        counsellorName: selectedCounsellor,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      setSelectedCounsellor('');
      setSelectedDate('');
      setSelectedTime('');
      alert('Appointment booked successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'appointments');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <h2 className="text-3xl font-bold text-white">Book a Session</h2>
          
          <div className="grid sm:grid-cols-3 gap-4">
            {counsellors.map(c => (
              <motion.div
                key={c.name}
                whileHover={{ y: -5 }}
                onClick={() => setSelectedCounsellor(c.name)}
                className={cn(
                  "p-6 rounded-3xl cursor-pointer transition-all border",
                  selectedCounsellor === c.name 
                    ? "bg-indigo-500/20 border-indigo-500" 
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                )}
              >
                <img src={c.image || undefined} alt={c.name} className="w-16 h-16 rounded-2xl mb-4 object-cover" referrerPolicy="no-referrer" />
                <h4 className="text-white font-bold mb-1">{c.name}</h4>
                <p className="text-indigo-300/60 text-xs">{c.specialty}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-indigo-200 text-sm font-medium">Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="space-y-4">
              <label className="text-indigo-200 text-sm font-medium">Select Time</label>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTime(t)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-sm transition-all border",
                      selectedTime === t 
                        ? "bg-indigo-500 text-white border-indigo-500" 
                        : "bg-white/5 text-indigo-200 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button onClick={handleBook} className="w-full py-5 text-lg">
            Confirm Booking
          </Button>
        </div>

        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-white">Your Sessions</h2>
          <div className="space-y-4">
            {appointments.length === 0 && (
              <p className="text-indigo-300/40 text-center py-10">No upcoming sessions</p>
            )}
            {appointments.map(a => (
              <GlassCard key={a.id} className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-white font-bold">{a.counsellorName}</h4>
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] uppercase font-bold",
                    a.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                  )}>
                    {a.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-indigo-200/60 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {a.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity size={14} />
                    {a.time}
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const getLocalizedType = (type: string, language: string) => {
  const mapping: Record<string, string> = {
    'video': language === 'Hindi' ? 'वीडियो' : language === 'Kannada' ? 'ವಿಡಿಯೋ' : language === 'Telugu' ? 'వీడియో' : language === 'Tamil' ? 'வீடியோ' : 'Video',
    'audio': language === 'Hindi' ? 'ऑडियो' : language === 'Kannada' ? 'ಆಡಿಯೋ' : language === 'Telugu' ? 'ఆడియో' : language === 'Tamil' ? 'ஆடியோ' : 'Audio',
    'guide': language === 'Hindi' ? 'मार्गदर्शिका' : language === 'Kannada' ? 'ಮಾರ್ಗದರ್ಶಿ' : language === 'Telugu' ? 'మార్గదర్శి' : language === 'Tamil' ? 'வழிகாட்டி' : 'Guide',
    'article': language === 'Hindi' ? 'लेख' : language === 'Kannada' ? 'ಲೇಖನ' : language === 'Telugu' ? 'వ్యాసం' : language === 'Tamil' ? 'கட்டுரை' : 'Article'
  };
  return mapping[type] || type;
};

const getLocalizedCategory = (category: string, language: string) => {
  const mapping: Record<string, string> = {
    'Stress': language === 'Hindi' ? 'तनाव' : language === 'Kannada' ? 'ಒತ್ತಡ' : language === 'Telugu' ? 'ఒత్తిడి' : language === 'Tamil' ? 'மன அழுத்தம்' : 'Stress',
    'Anxiety': language === 'Hindi' ? 'चिंता' : language === 'Kannada' ? 'ಆತಂಕ' : language === 'Telugu' ? 'ఆందోళన' : language === 'Tamil' ? 'கவலை' : 'Anxiety',
    'Sleep': language === 'Hindi' ? 'नींद' : language === 'Kannada' ? 'ನಿದ್ರೆ' : language === 'Telugu' ? 'నిద్ర' : language === 'Tamil' ? 'தூக்கம்' : 'Sleep',
    'Motivation': language === 'Hindi' ? 'प्रेरणा' : language === 'Kannada' ? 'ಪ್ರೇರಣೆ' : language === 'Telugu' ? 'ప్రేరణ' : language === 'Tamil' ? 'ஊக்கம்' : 'Motivation'
  };
  return mapping[category] || category;
};

const PsychoeducationalResourceHub = () => {
  const [filter, setFilter] = useState('All');
  const [language, setLanguage] = useState('English');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  
  const resources: Resource[] = [
    // English
    { id: 'e1', title: 'Managing Exam Stress', category: 'Stress', type: 'video', url: 'https://www.youtube.com/embed/swjDIvuxFx4', thumbnail: 'https://picsum.photos/seed/stress1/400/250', description: 'Practical tips to stay calm during finals.', language: 'English' },
    { id: 'e2', title: '10 Min Guided Meditation', category: 'Anxiety', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', thumbnail: 'https://picsum.photos/seed/meditation/400/250', description: 'A quick reset for your mind.', language: 'English' },
    { id: 'e3', title: 'Mental Wellness Guide', category: 'Motivation', type: 'guide', url: '', thumbnail: 'https://picsum.photos/seed/guide/400/250', description: 'A comprehensive guide for mental well-being. Focus on sleep, diet, and exercise.', language: 'English' },
    
    // Hindi
    { id: 'h1', title: 'परीक्षा के तनाव का प्रबंधन (Exam Stress)', category: 'Stress', type: 'video', url: 'https://www.youtube.com/embed/uDuPL6wfWvQ', thumbnail: 'https://picsum.photos/seed/stress_h/400/250', description: 'परीक्षा के दौरान शांत रहने के व्यावहारिक सुझाव।', language: 'Hindi' },
    { id: 'h2', title: '10 मिनट निर्देशित ध्यान (Meditation)', category: 'Anxiety', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', thumbnail: 'https://picsum.photos/seed/meditation_h/400/250', description: 'आपके मन के लिए एक त्वरित रीसेट।', language: 'Hindi' },
    { id: 'h3', title: 'मानसिक कल्याण मार्गदर्शिका (Guide)', category: 'Motivation', type: 'guide', url: '', thumbnail: 'https://picsum.photos/seed/guide_h/400/250', description: 'मानसिक स्वास्थ्य के लिए मुख्य सुझाव: 1. पर्याप्त नींद (7-8 घंटे) लें। 2. संतुलित और पौष्टिक आहार लें। 3. प्रतिदिन कम से कम 30 मिनट व्यायाम करें। 4. तनाव कम करने के लिए ध्यान और गहरी सांस लेने का अभ्यास करें। 5. अपनों के साथ समय बिताएं और अपनी भावनाओं को साझा करें।', language: 'Hindi' },

    // Kannada
    { id: 'k1', title: 'ಪರೀಕ್ಷೆಯ ಒತ್ತಡ ನಿರ್ವಹಣೆ (Exam Stress)', category: 'Stress', type: 'video', url: 'https://www.youtube.com/embed/jCSrMfNFSVU', thumbnail: 'https://picsum.photos/seed/stress_k/400/250', description: 'ಪರೀಕ್ಷೆಯ ಸಮಯದಲ್ಲಿ ಶಾಂತವಾಗಿರಲು ಪ್ರಾಯೋಗಿಕ ಸಲಹೆಗಳು.', language: 'Kannada' },
    { id: 'k2', title: '10 ನಿಮಿಷಗಳ ಮಾರ್ಗದರ್ಶಿತ ಧ್ಯಾನ (Meditation)', category: 'Anxiety', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', thumbnail: 'https://picsum.photos/seed/meditation_k/400/250', description: 'ನಿಮ್ಮ ಮನಸ್ಸಿಗೆ ತ್ವರಿತ ಮರುಹೊಂದಿಸುವಿಕೆ.', language: 'Kannada' },
    { id: 'k3', title: 'ಮಾನಸಿಕ ಕ್ಷೇಮ ಮಾರ್ಗದರ್ಶಿ (Guide)', category: 'Motivation', type: 'guide', url: '', thumbnail: 'https://picsum.photos/seed/guide_k/400/250', description: 'ಮಾನಸಿಕ ಆರೋಗ್ಯಕ್ಕಾಗಿ ಪ್ರಮುಖ ಸಲಹೆಗಳು: 1. ಪ್ರತಿದಿನ 7-8 ಗಂಟೆಗಳ ಕಾಲ ನಿದ್ರಿಸಿ. 2. ಪೌಷ್ಟಿಕ ಮತ್ತು ಸಮತೋಲಿತ ಆಹಾರವನ್ನು ಸೇವಿಸಿ. 3. ಪ್ರತಿದಿನ 30 ನಿಮಿಷಗಳ ಕಾಲ ದೈಹಿಕ ವ್ಯಾಯಾಮ ಮಾಡಿ. 4. ಒತ್ತಡ ನಿರ್ವಹಣೆಗೆ ಧ್ಯಾನ ಮತ್ತು ಉಸಿರಾಟದ ವ್ಯಾಯಾಮಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ. 5. ಸ್ನೇಹಿತರು ಮತ್ತು ಕುಟುಂಬದವರೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ.', language: 'Kannada' },

    // Telugu
    { id: 'te1', title: 'పరీక్ష ఒత్తిడి నిర్వహణ (Exam Stress)', category: 'Stress', type: 'video', url: 'https://www.youtube.com/embed/bFlUx1cYOhQ', thumbnail: 'https://picsum.photos/seed/stress_te/400/250', description: 'పరీక్షల సమయంలో ప్రశాంతంగా ఉండటానికి ఆచరణాత్మక చిట్కాలు.', language: 'Telugu' },
    { id: 'te2', title: '10 నిమిషాల మార్గదర్శక ధ్యానం (Meditation)', category: 'Anxiety', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', thumbnail: 'https://picsum.photos/seed/meditation_te/400/250', description: 'మీ మనస్సు కోసం శీఘ్ర రీసెట్.', language: 'Telugu' },
    { id: 'te3', title: 'మానసిక ఆరోగ్య మార్గదర్శి (Guide)', category: 'Motivation', type: 'guide', url: '', thumbnail: 'https://picsum.photos/seed/guide_te/400/250', description: 'మానసిక ఆరోగ్యానికి ముఖ్యమైన చిట్కాలు: 1. ప్రతిరోజూ 7-8 గంటల నిద్ర ఉండేలా చూసుకోండి. 2. పోషకమైన మరియు సమతుల్య ఆహారం తీసుకోండి. 3. ప్రతిరోజూ కనీసం 30 నిమిషాల పాటు వ్యాయామం చేయండి. 4. ఒత్తిడిని తగ్గించుకోవడానికి ధ్యానం మరియు శ్వాస వ్యాయామాలు చేయండి. 5. మీ ప్రియమైన వారితో సమయం గడపండి.', language: 'Telugu' },

    // Tamil
    { id: 'ta1', title: 'தேர்வு மன அழுத்த மேலாண்மை (Exam Stress)', category: 'Stress', type: 'video', url: 'https://www.youtube.com/embed/OAHHC8MLfCc', thumbnail: 'https://picsum.photos/seed/stress_ta/400/250', description: 'தேர்வுகளின் போது அமைதியாக இருக்க நடைமுறை குறிப்புகள்.', language: 'Tamil' },
    { id: 'ta2', title: '10 நிமிட வழிகாட்டப்பட்ட தியானம் (Meditation)', category: 'Anxiety', type: 'audio', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', thumbnail: 'https://picsum.photos/seed/meditation_ta/400/250', description: 'உங்கள் மனதிற்கு ஒரு விரைவான மீட்டமைப்பு.', language: 'Tamil' },
    { id: 'ta3', title: 'மன நல வழிகாட்டி (Guide)', category: 'Motivation', type: 'guide', url: '', thumbnail: 'https://picsum.photos/seed/guide_ta/400/250', description: 'மன நலத்திற்கான முக்கிய குறிப்புகள்: 1. தினமும் 7-8 மணிநேரம் தூங்குங்கள். 2. சத்தான மற்றும் சீரான உணவை உட்கொள்ளுங்கள். 3. தினமும் 30 நிமிடங்கள் உடற்பயிற்சி செய்யுங்கள். 4. மன அழுத்தத்தைக் குறைக்க தியானம் மற்றும் மூச்சுப் பயிற்சி செய்யுங்கள். 5. உங்கள் உணர்வுகளை மற்றவர்களுடன் பகிர்ந்து கொள்ளுங்கள்.', language: 'Tamil' },
  ];

  const filtered = resources.filter(r => 
    (filter === 'All' || r.category === filter) && 
    (r.language === language)
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-4xl font-bold text-white">Psychoeducational Resource Hub</h2>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil'].map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap",
                  language === lang 
                    ? "bg-indigo-500 text-white border-indigo-500" 
                    : "bg-white/5 text-indigo-200 border-white/10 hover:bg-white/10"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All', 'Stress', 'Anxiety', 'Sleep', 'Motivation'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap",
                  filter === cat 
                    ? "bg-indigo-500 text-white border-indigo-500" 
                    : "bg-white/5 text-indigo-200 border-white/10 hover:bg-white/10"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="group cursor-pointer"
            onClick={() => setSelectedResource(r)}
          >
            <GlassCard className="h-full hover:border-indigo-500/50 transition-colors">
              <div className="relative aspect-video overflow-hidden">
                <img src={r.thumbnail || undefined} alt={r.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-[10px] text-white uppercase font-bold tracking-wider flex items-center gap-2">
                  {r.type === 'video' && <Play size={10} />}
                  {r.type === 'audio' && <Volume2 size={10} />}
                  {r.type === 'guide' && <BookOpen size={10} />}
                  {r.type === 'article' && <BookOpen size={10} />}
                  {getLocalizedType(r.type, r.language)}
                </div>
              </div>
              <div className="p-6">
                <div className="text-indigo-400 text-xs font-bold mb-2 uppercase tracking-widest">{getLocalizedCategory(r.category, r.language)}</div>
                <h4 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-300 transition-colors">{r.title}</h4>
                <p className="text-indigo-200/60 text-sm line-clamp-2">{r.description}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <GlassCard className="relative overflow-hidden flex flex-col h-full">
                <button 
                  onClick={() => setSelectedResource(null)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="p-8 overflow-y-auto">
                  <div className="text-indigo-400 text-xs font-bold mb-2 uppercase tracking-widest">
                    {getLocalizedCategory(selectedResource.category, selectedResource.language)} • {selectedResource.language}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">{selectedResource.title}</h3>
                  
                  <div className="rounded-2xl overflow-hidden bg-black/40 mb-8 border border-white/10">
                    {selectedResource.type === 'video' && (
                      <div className="aspect-video">
                        <iframe 
                          src={selectedResource.url} 
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                    
                    {selectedResource.type === 'audio' && (
                      <div className="p-12 flex flex-col items-center justify-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 animate-pulse">
                          <Volume2 size={48} />
                        </div>
                        <audio controls className="w-full max-w-md">
                          <source src={selectedResource.url} type="audio/mpeg" />
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                    )}

                    {selectedResource.type === 'guide' && (
                      <div className="p-8 bg-white/5 prose prose-invert max-w-none">
                        <div className="flex items-center gap-4 mb-6 text-indigo-300">
                          <BookOpen size={32} />
                          <span className="text-lg font-medium">
                            {selectedResource.language === 'Hindi' ? 'मानसिक कल्याण मार्गदर्शिका' :
                             selectedResource.language === 'Kannada' ? 'ಮಾನಸಿಕ ಕ್ಷೇಮ ಮಾರ್ಗದರ್ಶಿ' :
                             selectedResource.language === 'Telugu' ? 'మానసిక ఆరోగ్య మార్గదర్శి' :
                             selectedResource.language === 'Tamil' ? 'மன நல வழிகாட்டி' :
                             'Mental Wellness Guide'}
                          </span>
                        </div>
                        <p className="text-indigo-100/80 leading-relaxed text-lg">
                          {selectedResource.description}
                        </p>
                        <div className="mt-8 space-y-4">
                          <h4 className="text-white font-bold text-xl underline decoration-indigo-500 underline-offset-4">
                            {selectedResource.language === 'Hindi' ? 'मुख्य सुझाव:' :
                             selectedResource.language === 'Kannada' ? 'ಪ್ರಮುಖ ಅಂಶಗಳು:' :
                             selectedResource.language === 'Telugu' ? 'ముఖ్యమైన విషయాలు:' :
                             selectedResource.language === 'Tamil' ? 'முக்கிய குறிப்புகள்:' :
                             'Key Takeaways:'}
                          </h4>
                          <ul className="list-disc list-inside text-indigo-200/70 space-y-2">
                            {selectedResource.language === 'Hindi' ? (
                              <>
                                <li>नियमित नींद का समय (7-9 घंटे) बनाए रखें।</li>
                                <li>प्रतिदिन कम से कम 10 मिनट ध्यान या मेडिटेशन का अभ्यास करें।</li>
                                <li>नियमित व्यायाम के साथ शारीरिक रूप से सक्रिय रहें।</li>
                                <li>पोषक तत्वों से भरपूर संतुलित आहार लें।</li>
                                <li>अपनों के साथ समय बिताएं और अपनी भावनाओं को साझा करें।</li>
                              </>
                            ) : selectedResource.language === 'Kannada' ? (
                              <>
                                <li>ಸ್ಥಿರವಾದ ನಿದ್ರೆಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ನಿರ್ವಹಿಸಿ (7-9 ಗಂಟೆಗಳು).</li>
                                <li>ಪ್ರತಿದಿನ ಕನಿಷ್ಠ 10 ನಿಮಿಷಗಳ ಕಾಲ ಧ್ಯಾನವನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ.</li>
                                <li>ನಿಯಮಿತ ವ್ಯಾಯಾಮದೊಂದಿಗೆ ದೈಹಿಕವಾಗಿ ಸಕ್ರಿಯರಾಗಿರಿ.</li>
                                <li>ಪೌಷ್ಟಿಕಾಂಶಯುಕ್ತ ಸಮತೋಲಿತ ಆಹಾರವನ್ನು ಸೇವಿಸಿ.</li>
                                <li>ಸ್ನೇಹಿತರು ಮತ್ತು ಕುಟುಂಬದವರೊಂದಿಗೆ ಸಂಪರ್ಕದಲ್ಲಿರಿ.</li>
                              </>
                            ) : selectedResource.language === 'Telugu' ? (
                              <>
                                <li>క్రమబద్ధమైన నిద్ర సమయాన్ని (7-9 గంటలు) పాటించండి.</li>
                                <li>ప్రతిరోజూ కనీసం 10 నిమిషాల పాటు ధ్యానం చేయండి.</li>
                                <li>క్రమం తప్పకుండా వ్యాయామం చేస్తూ శారీరకంగా చురుకుగా ఉండండి.</li>
                                <li>పోషకాలతో కూడిన సమతుల్య ఆహారం తీసుకోండి.</li>
                                <li>మీ ప్రియమైన వారితో సమయం గడపండి.</li>
                              </>
                            ) : selectedResource.language === 'Tamil' ? (
                              <>
                                <li>சீரான தூக்க நேரத்தை (7-9 மணிநேரம்) பராமரிக்கவும்.</li>
                                <li>தினமும் குறைந்தது 10 நிமிடங்கள் தியானம் செய்யவும்.</li>
                                <li>வழக்கமான உடற்பயிற்சியுடன் சுறுசுறுப்பாக இருங்கள்.</li>
                                <li>ஊட்டச்சத்து நிறைந்த சீரான உணவை உண்ணுங்கள்.</li>
                                <li>உங்கள் உணர்வுகளை மற்றவர்களுடன் பகிர்ந்து கொள்ளுங்கள்.</li>
                              </>
                            ) : (
                              <>
                                <li>Maintain a consistent sleep schedule (7-9 hours).</li>
                                <li>Practice mindfulness or meditation for at least 10 minutes daily.</li>
                                <li>Stay physically active with regular exercise.</li>
                                <li>Eat a balanced diet rich in nutrients.</li>
                                <li>Connect with friends and family regularly.</li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={() => setSelectedResource(null)}>
                      {selectedResource.language === 'Hindi' ? 'संसाधन बंद करें' :
                       selectedResource.language === 'Kannada' ? 'ಸಂಪನ್ಮೂಲವನ್ನು ಮುಚ್ಚಿ' :
                       selectedResource.language === 'Telugu' ? 'వనరును మూసివేయి' :
                       selectedResource.language === 'Tamil' ? 'வளத்தை மூடு' :
                       'Close Resource'}
                    </Button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CommentSection = ({ postId, user, userLikes }: { postId: string, user: FirebaseUser, userLikes: Set<string> }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'comments'),
      where('postId', '==', postId),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `comments/${postId}`);
    });
  }, [postId]);

  const handleComment = async () => {
    if (!newComment.trim()) return;
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'comments'), {
        postId,
        userId: user.uid,
        authorName: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        content: newComment,
        likes: 0,
        isAnonymous,
        createdAt: new Date().toISOString()
      });
      
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        replies: increment(1)
      });
      
      setNewComment('');
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'comments');
      setLoading(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (userLikes.has(commentId)) return;
    
    try {
      const batch = writeBatch(db);
      const likeId = `${user.uid}_${commentId}`;
      const likeRef = doc(db, 'likes', likeId);
      const commentRef = doc(db, 'comments', commentId);
      
      batch.set(likeRef, {
        userId: user.uid,
        targetId: commentId,
        targetType: 'comment',
        createdAt: new Date().toISOString()
      });
      
      batch.update(commentRef, {
        likes: increment(1)
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `comments/${commentId}/like`);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/5 space-y-6">
      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-indigo-400 shrink-0">
              <UserIcon size={14} />
            </div>
            <div className="flex-1 bg-white/5 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white font-bold text-xs">{comment.authorName}</span>
                <span className="text-indigo-300/40 text-[10px]">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-indigo-100/70 text-sm leading-relaxed mb-3">
                {comment.content}
              </p>
              <button 
                onClick={() => handleLikeComment(comment.id)}
                disabled={userLikes.has(comment.id)}
                className={cn(
                  "flex items-center gap-1.5 transition-colors text-[10px] font-bold uppercase tracking-wider",
                  userLikes.has(comment.id) ? "text-indigo-400" : "text-indigo-300/40 hover:text-indigo-400"
                )}
              >
                <ThumbsUp size={12} />
                {comment.likes || 0}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <UserIcon size={14} />
        </div>
        <div className="flex-1 space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[80px] resize-none"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div 
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all",
                  isAnonymous ? "bg-indigo-500 border-indigo-500" : "border-white/20"
                )}
              >
                {isAnonymous && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <span className="text-indigo-200/60 text-xs">Anonymous</span>
            </label>
            <button
              onClick={handleComment}
              disabled={loading || !newComment.trim()}
              className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors"
            >
              {loading ? 'Posting...' : 'Reply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForumPage = ({ user }: { user: FirebaseUser }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'likes'), where('userId', '==', user.uid));
    return onSnapshot(q, (snapshot) => {
      const likes = new Set(snapshot.docs.map(doc => doc.data().targetId));
      setUserLikes(likes);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'user_likes');
    });
  }, [user]);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    
    try {
      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        authorName: isAnonymous ? 'Anonymous' : user.displayName || 'User',
        content: newPost,
        likes: 0,
        replies: 0,
        isAnonymous,
        createdAt: new Date().toISOString()
      });
      
      setNewPost('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
    }
  };

  const handleLike = async (postId: string) => {
    if (userLikes.has(postId)) return;

    try {
      const batch = writeBatch(db);
      const likeId = `${user.uid}_${postId}`;
      const likeRef = doc(db, 'likes', likeId);
      const postRef = doc(db, 'posts', postId);
      
      batch.set(likeRef, {
        userId: user.uid,
        targetId: postId,
        targetType: 'post',
        createdAt: new Date().toISOString()
      });
      
      batch.update(postRef, {
        likes: increment(1)
      });
      
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}/like`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      <GlassCard className="p-6">
        <textarea
          value={newPost}
          onChange={(e) => setNewPost(e.target.value)}
          placeholder="Share your thoughts anonymously..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-white placeholder-indigo-300/30 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] resize-none mb-4"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div 
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
                isAnonymous ? "bg-indigo-500 border-indigo-500" : "border-white/20"
              )}
            >
              {isAnonymous && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
            <span className="text-indigo-200 text-sm">Post Anonymously</span>
          </label>
          <Button onClick={handlePost} className="px-8">Post</Button>
        </div>
      </GlassCard>

      <div className="space-y-6">
        {posts.map(post => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlassCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserIcon size={20} />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm">{post.authorName}</h4>
                  <p className="text-indigo-300/40 text-[10px] uppercase tracking-wider">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-indigo-100/80 leading-relaxed mb-6">
                {post.content}
              </p>
              <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                <button 
                  onClick={() => handleLike(post.id)}
                  disabled={userLikes.has(post.id)}
                  className={cn(
                    "flex items-center gap-2 transition-colors text-sm",
                    userLikes.has(post.id) ? "text-indigo-400" : "text-indigo-300/60 hover:text-indigo-400"
                  )}
                >
                  <ThumbsUp size={16} />
                  {post.likes}
                </button>
                <button 
                  onClick={() => setActivePostId(activePostId === post.id ? null : post.id)}
                  className={cn(
                    "flex items-center gap-2 transition-colors text-sm",
                    activePostId === post.id ? "text-indigo-400" : "text-indigo-300/60 hover:text-indigo-400"
                  )}
                >
                  <MessageSquare size={16} />
                  {post.replies}
                </button>
              </div>

              {activePostId === post.id && (
                <CommentSection postId={post.id} user={user} userLikes={userLikes} />
              )}
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const DashboardPage = ({ user, setCurrentPage }: { user: FirebaseUser, setCurrentPage: (page: string) => void }) => {
  const [moods, setMoods] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    const qMoods = query(collection(db, 'moods'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(7));
    const unsubMoods = onSnapshot(qMoods, (snap) => {
      setMoods(snap.docs.map(d => d.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'moods');
    });

    const qJournals = query(collection(db, 'journals'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    const unsubJournals = onSnapshot(qJournals, (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'journals');
    });

    const qQuiz = query(collection(db, 'quiz_results'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(10));
    const unsubQuiz = onSnapshot(qQuiz, (snap) => {
      setQuizResults(snap.docs.map(d => d.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'quiz_results');
    });

    const qAppts = query(collection(db, 'appointments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    const unsubAppts = onSnapshot(qAppts, (snap) => {
      setAppointments(snap.docs.map(d => d.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });

    const qMsgs = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'), limit(5));
    const unsubMsgs = onSnapshot(qMsgs, (snap) => {
      setMessages(snap.docs.map(d => d.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'messages');
    });

    const qPosts = query(collection(db, 'posts'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'), limit(5));
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => d.data()));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'posts');
    });

    return () => { 
      unsubMoods(); 
      unsubJournals(); 
      unsubQuiz(); 
      unsubAppts(); 
      unsubMsgs(); 
      unsubPosts(); 
    };
  }, [user.uid]);

  const saveMood = async (mood: string) => {
    setSelectedMood(mood);
    try {
      await addDoc(collection(db, 'moods'), {
        userId: user.uid,
        mood,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'moods');
    }
  };

  const moodIcons = [
    { label: 'Happy', icon: Smile, color: 'text-green-400' },
    { label: 'Calm', icon: Heart, color: 'text-blue-400' },
    { label: 'Meh', icon: Meh, color: 'text-yellow-400' },
    { label: 'Stressed', icon: Activity, color: 'text-orange-400' },
    { label: 'Sad', icon: Frown, color: 'text-indigo-400' },
  ];

  const data = useMemo(() => {
    const dailyMoods: Record<string, { sum: number, count: number, timestamp: string }> = {};
    
    moods.forEach(m => {
      const dateKey = new Date(m.timestamp).toISOString().split('T')[0];
      if (!dailyMoods[dateKey]) {
        dailyMoods[dateKey] = { sum: 0, count: 0, timestamp: m.timestamp };
      }
      const val = m.mood === 'Happy' ? 5 : m.mood === 'Calm' ? 4 : m.mood === 'Meh' ? 3 : m.mood === 'Stressed' ? 2 : 1;
      dailyMoods[dateKey].sum += val;
      dailyMoods[dateKey].count += 1;
    });

    return Object.entries(dailyMoods)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        name: new Date(data.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
        val: Math.round(data.sum / data.count)
      }));
  }, [moods]);

  const quizChartData = useMemo(() => {
    return quizResults.slice().reverse().map(q => ({
      name: q.quizTitle.substring(0, 8),
      score: Math.round((q.score / q.totalQuestions) * 100)
    }));
  }, [quizResults]);

  const stats = [
    { label: "Current Mood", value: moods[0]?.mood || "Unknown", icon: Activity, color: "text-orange-400" },
    { label: "Journal Entries", value: journals.length.toString(), icon: PenTool, color: "text-green-400" },
    { label: "Quiz Score Avg", value: quizResults.length > 0 ? `${Math.round(quizResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions), 0) / quizResults.length * 100)}%` : "0%", icon: Brain, color: "text-pink-400" },
    { label: "AI Chats", value: messages.length.toString(), icon: MessageCircle, color: "text-indigo-400" },
  ];

  const history = [
    ...moods.map(m => ({ type: 'mood', title: `Mood: ${m.mood}`, time: m.timestamp, icon: Smile, color: 'text-green-400' })),
    ...journals.map(j => ({ type: 'journal', title: `Journal: ${j.title}`, time: j.timestamp, icon: PenTool, color: 'text-indigo-400' })),
    ...quizResults.map(q => ({ type: 'quiz', title: `Quiz: ${q.quizTitle} (${q.score}/${q.totalQuestions})`, time: q.timestamp, icon: Brain, color: 'text-pink-400' })),
    ...appointments.map(a => ({ type: 'appointment', title: `Appointment with ${a.counsellorName}`, time: a.createdAt, icon: Calendar, color: 'text-blue-400' })),
    ...messages.filter(m => m.role === 'user').map(m => ({ type: 'chat', title: `AI Chat: ${m.content.substring(0, 30)}...`, time: m.timestamp, icon: MessageCircle, color: 'text-indigo-400' })),
    ...posts.map(p => ({ type: 'post', title: `Forum Post: ${p.content.substring(0, 30)}...`, time: p.createdAt, icon: Users, color: 'text-orange-400' })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 10);

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-4xl font-bold text-white">Wellness Dashboard</h2>
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
          <span className="text-sm text-indigo-200">How are you feeling?</span>
          <div className="flex gap-2">
            {moodIcons.map(m => (
              <button
                key={m.label}
                onClick={() => saveMood(m.label)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  selectedMood === m.label ? "bg-indigo-500 text-white" : "bg-white/5 text-indigo-300 hover:bg-white/10"
                )}
                title={m.label}
              >
                <m.icon size={20} />
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, i) => (
          <GlassCard key={i} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl bg-white/5", s.color)}>
                <s.icon size={24} />
              </div>
              <span className="text-indigo-300/40 text-xs font-bold uppercase">Live</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-1">{s.value}</h3>
            <p className="text-indigo-200/60 text-sm">{s.label}</p>
          </GlassCard>
        ))}
      </div>

    <div className="grid lg:grid-cols-2 gap-8">
      <GlassCard className="p-8">
        <h3 className="text-xl font-bold text-white mb-8">Mood Trends (Daily Avg)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold text-white mb-8">Quiz Performance (%)</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={10} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="score" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-white">Live History Feed</h3>
            <div className="flex items-center gap-2 text-indigo-400 text-xs animate-pulse">
              <div className="w-2 h-2 rounded-full bg-indigo-400" />
              Live
            </div>
          </div>
          <div className="space-y-6">
            {history.length === 0 && <p className="text-indigo-300/40 text-center py-10">No activity history yet.</p>}
            {history.map((item, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 transition-colors group-hover:bg-white/10", item.color)}>
                  <item.icon size={20} />
                </div>
                <div className="flex-1 border-b border-white/5 pb-4">
                  <h4 className="text-white text-sm font-medium mb-1">{item.title}</h4>
                  <p className="text-indigo-300/40 text-[10px] uppercase tracking-wider">
                    {new Date(item.time).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="space-y-8">
          <GlassCard className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-white">Recent Journal Entries</h3>
              <button 
                onClick={() => setCurrentPage('journal')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="space-y-4">
              {journals.length === 0 && <p className="text-indigo-300/40 text-center py-10">No journals yet. Start writing!</p>}
              {journals.slice(0, 3).map((j, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-white font-bold">{j.title}</h4>
                    <span className="text-[10px] text-indigo-400 uppercase">{new Date(j.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-indigo-200/60 text-sm line-clamp-2">{j.content}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-8">
            <h3 className="text-xl font-bold text-white mb-8">Upcoming Appointments</h3>
            <div className="space-y-4">
              {appointments.filter(a => a.status !== 'cancelled').length === 0 && (
                <p className="text-indigo-300/40 text-center py-10">No upcoming appointments.</p>
              )}
              {appointments.filter(a => a.status !== 'cancelled').slice(0, 3).map((a, i) => (
                <div key={i} className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-indigo-400" size={16} />
                      <h4 className="text-white font-bold">{a.counsellorName}</h4>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      a.status === 'confirmed' ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {a.status}
                    </span>
                  </div>
                  <p className="text-indigo-200/60 text-sm">{a.date} at {a.time}</p>
                </div>
              ))}
              <Button 
                variant="secondary" 
                className="w-full mt-4"
                onClick={() => setCurrentPage('booking')}
              >
                Book New Session
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

const JournalPage = ({ user }: { user: FirebaseUser }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [journals, setJournals] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'journals'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snap) => {
      setJournals(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'journals');
    });
  }, [user.uid]);

  const handleSave = async () => {
    if (!title || !content) return;
    try {
      await addDoc(collection(db, 'journals'), {
        userId: user.uid,
        title,
        content,
        timestamp: new Date().toISOString()
      });
      setTitle('');
      setContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'journals');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'journals', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `journals/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <h2 className="text-4xl font-bold text-white">Daily Journal</h2>
      <GlassCard className="p-8">
        <input 
          type="text" 
          placeholder="Entry Title..." 
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <textarea 
          placeholder="How was your day? What did you do?..." 
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white h-40 resize-none mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <Button onClick={handleSave} className="w-full">Save Entry</Button>
      </GlassCard>

      <div className="space-y-6">
        {journals.map(j => (
          <GlassCard key={j.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{j.title}</h3>
                <span className="text-indigo-400 text-sm">{new Date(j.timestamp).toLocaleDateString()}</span>
              </div>
              <button 
                onClick={() => handleDelete(j.id)}
                className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                title="Delete Entry"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-indigo-100/70 leading-relaxed whitespace-pre-wrap">{j.content}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};

const QuizzesForReliefPage = ({ user }: { user: FirebaseUser }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);

  const QUIZ_QUESTIONS: Record<string, { question: string; options: string[]; answer: string }[]> = {
    "Luminous": [
      { question: "Which element is often used in a Zen Garden to represent water?", options: ["Sand", "Grass", "Wood", "Metal"], answer: "Sand" },
      { question: "What is the primary purpose of a Zen Garden?", options: ["Meditation", "Farming", "Storage", "Exercise"], answer: "Meditation" },
      { question: "Which plant is common in Japanese gardens?", options: ["Maple", "Cactus", "Palm", "Sunflower"], answer: "Maple" },
      { question: "What does the 'Enso' circle represent in Zen?", options: ["Enlightenment", "Confusion", "End", "Square"], answer: "Enlightenment" }
    ],
    "Solace": [
      { question: "What is a quick way to reduce stress?", options: ["Deep Breathing", "Drinking Soda", "Shouting", "Running fast"], answer: "Deep Breathing" },
      { question: "Which hormone is known as the 'stress hormone'?", options: ["Cortisol", "Dopamine", "Serotonin", "Oxytocin"], answer: "Cortisol" },
      { question: "How many hours of sleep is recommended for adults?", options: ["7-9 hours", "4-5 hours", "12-14 hours", "2-3 hours"], answer: "7-9 hours" },
      { question: "Which sense is most connected to memory?", options: ["Smell", "Sight", "Touch", "Hearing"], answer: "Smell" }
    ],
    "Apex": [
      { question: "Which part of the brain is responsible for memory?", options: ["Hippocampus", "Cerebellum", "Medulla", "Skull"], answer: "Hippocampus" },
      { question: "What is 'Mindfulness'?", options: ["Being present", "Thinking about future", "Regretting past", "Sleeping"], answer: "Being present" },
      { question: "Which activity improves cognitive focus?", options: ["Puzzles", "Watching TV", "Eating junk", "Daydreaming"], answer: "Puzzles" },
      { question: "What is the 'Pomodoro' technique used for?", options: ["Time Management", "Cooking", "Sleeping", "Dancing"], answer: "Time Management" }
    ]
  };

  const quizzes = [
    { id: 1, title: "Luminous", type: "Relaxation", icon: Brain, color: "bg-green-500/20 text-green-400" },
    { id: 2, title: "Solace", type: "Stress Relief", icon: Gamepad2, color: "bg-blue-500/20 text-blue-400" },
    { id: 3, title: "Apex", type: "Focus", icon: Activity, color: "bg-purple-500/20 text-purple-400" },
  ];

  const startQuiz = (quizTitle: string) => {
    const questions = QUIZ_QUESTIONS[quizTitle].map(q => ({
      ...q,
      options: [...q.options].sort(() => Math.random() - 0.5)
    })).sort(() => Math.random() - 0.5);
    
    setShuffledQuestions(questions);
    setSelectedQuiz(quizTitle);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setScore(0);
  };

  const [shuffledQuestions, setShuffledQuestions] = useState<any[]>([]);

  const handleOptionSelect = (option: string) => {
    if (showAnswer) return;
    setSelectedOption(option);
    setShowAnswer(true);
    if (option === shuffledQuestions[currentQuestionIndex].answer) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = async () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowAnswer(false);
    } else {
      const finalScore = score + (selectedOption === shuffledQuestions[currentQuestionIndex].answer ? 1 : 0);
      alert(`Quiz Over! Your score: ${finalScore}/${shuffledQuestions.length}`);
      
      try {
        await addDoc(collection(db, 'quiz_results'), {
          userId: user.uid,
          quizTitle: selectedQuiz,
          score: finalScore,
          totalQuestions: shuffledQuestions.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'quiz_results');
      }

      setSelectedQuiz(null);
    }
  };

  if (selectedQuiz && shuffledQuestions.length > 0) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">{selectedQuiz} Quiz</h2>
          <button onClick={() => setSelectedQuiz(null)} className="text-indigo-300 hover:text-white transition-colors">Exit Quiz</button>
        </div>
        
        <GlassCard className="p-8 space-y-6">
          <div className="flex justify-between items-center text-sm text-indigo-300/60">
            <span>Question {currentQuestionIndex + 1} of {shuffledQuestions.length}</span>
            <span>Score: {score}</span>
          </div>
          
          <h3 className="text-2xl font-bold text-white">{currentQuestion.question}</h3>
          
          <div className="grid gap-4">
            {currentQuestion.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleOptionSelect(opt)}
                disabled={showAnswer}
                className={cn(
                  "w-full p-4 rounded-2xl text-left transition-all border",
                  showAnswer 
                    ? opt === currentQuestion.answer 
                      ? "bg-green-500/20 border-green-500 text-green-400" 
                      : opt === selectedOption 
                        ? "bg-red-500/20 border-red-500 text-red-400" 
                        : "bg-white/5 border-white/10 text-indigo-200/40"
                    : "bg-white/5 border-white/10 text-indigo-200 hover:bg-white/10 hover:border-indigo-500/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {showAnswer && opt === currentQuestion.answer && <CheckCircle2 size={18} />}
                  {showAnswer && opt === selectedOption && opt !== currentQuestion.answer && <AlertCircle size={18} />}
                </div>
              </button>
            ))}
          </div>

          {showAnswer && (
            <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-indigo-200 text-sm">
                  <span className="font-bold">Correct Answer:</span> {currentQuestion.answer}
                </p>
              </div>
              <Button onClick={nextQuestion} className="w-full">
                {currentQuestionIndex === shuffledQuestions.length - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </div>
          )}
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h2 className="text-4xl font-bold text-white">Quizzes for Relief</h2>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-indigo-300">Quizzes</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {quizzes.map(q => (
            <GlassCard key={q.id} className="p-6 hover:border-indigo-500/50 transition-all group">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6", q.color)}>
                <q.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{q.title}</h3>
              <p className="text-indigo-200/60 text-sm mb-6">{q.type}</p>
              <Button variant="secondary" className="w-full" onClick={() => startQuiz(q.title)}>Start Quiz</Button>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
};

const EmergencyPage = () => {
  const contacts = [
    { name: "Campus HealthCare", number: "9632567527", description: "Immediate medical assistance on campus" },
    { name: "Tele-MANAS", number: "14416", description: "National mental health helpline" },
    { name: "Ambulance", number: "108", description: "Emergency medical services" },
    { name: "Women Helpline", number: "14490", description: "Support for women in distress" },
    { name: "Child Helpline", number: "1098", description: "Support for children in need" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto text-red-400">
          <PhoneCall size={40} />
        </div>
        <h2 className="text-4xl font-bold text-white">Emergency Support</h2>
        <p className="text-indigo-200/60 max-w-xl mx-auto">
          If you or someone you know is in immediate danger, please contact these services immediately. 
          Help is always available.
        </p>
      </div>

      <div className="grid gap-6">
        {contacts.map((c, i) => (
          <GlassCard key={i} className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-red-500/5 transition-all border-red-500/10">
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-bold text-white mb-1">{c.name}</h3>
              <p className="text-indigo-200/60 text-sm">{c.description}</p>
            </div>
            <a 
              href={`tel:${c.number}`}
              className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-red-500/20"
            >
              <PhoneCall size={20} />
              {c.number}
            </a>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-8 bg-indigo-500/10 border-indigo-500/20">
        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
          <AlertCircle size={20} className="text-indigo-400" />
          Crisis Resources
        </h4>
        <p className="text-indigo-200/70 text-sm leading-relaxed">
          Our AI assistant and peer forum are for support only. They are not monitored 24/7 by professionals. 
          In case of a severe mental health crisis, please use the numbers above or visit the nearest hospital emergency room.
        </p>
      </GlassCard>
    </div>
  );
};

const StudentHistoryModal = ({ student, onClose }: { student: any, onClose: () => void }) => {
  const [history, setHistory] = useState<any>({
    moods: [],
    journals: [],
    appointments: [],
    quizzes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const [moodsSnap, journalsSnap, apptsSnap, quizSnap] = await Promise.all([
          getDocs(query(collection(db, 'moods'), where('userId', '==', student.uid), orderBy('timestamp', 'desc'))),
          getDocs(query(collection(db, 'journals'), where('userId', '==', student.uid), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'appointments'), where('userId', '==', student.uid), orderBy('createdAt', 'desc'))),
          getDocs(query(collection(db, 'quiz_results'), where('userId', '==', student.uid), orderBy('timestamp', 'desc')))
        ]);

        setHistory({
          moods: moodsSnap.docs.map(d => d.data()),
          journals: journalsSnap.docs.map(d => d.data()),
          appointments: apptsSnap.docs.map(d => d.data()),
          quizzes: quizSnap.docs.map(d => d.data())
        });
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `history_${student.uid}`);
        setLoading(false);
      }
    };
    fetchHistory();
  }, [student.uid]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0f172a] border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <img src={student.photoURL || undefined} alt="" className="w-12 h-12 rounded-full border-2 border-indigo-500/50" referrerPolicy="no-referrer" />
            <div>
              <h3 className="text-xl font-bold text-white">{student.displayName}</h3>
              <p className="text-indigo-200/40 text-sm">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-indigo-200/60">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <section>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Smile className="text-purple-400" size={20} /> Mood History
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {history.moods.map((m: any, i: number) => (
                    <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <div className="text-2xl mb-1">{m.mood}</div>
                      <div className="text-indigo-200/40 text-[10px] uppercase tracking-wider">
                        {m.timestamp && !isNaN(new Date(m.timestamp).getTime()) ? new Date(m.timestamp).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  ))}
                  {history.moods.length === 0 && <p className="text-indigo-200/20 text-sm italic">No mood logs found.</p>}
                </div>
              </section>

              <section>
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="text-blue-400" size={20} /> Journal Entries
                </h4>
                <div className="space-y-4">
                  {history.journals.map((j: any, i: number) => (
                    <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-indigo-100 font-medium">{j.title}</h5>
                        <span className="text-indigo-200/40 text-xs">
                          {j.createdAt && !isNaN(new Date(j.createdAt).getTime()) ? new Date(j.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <p className="text-indigo-200/60 text-sm line-clamp-3">{j.content}</p>
                    </div>
                  ))}
                  {history.journals.length === 0 && <p className="text-indigo-200/20 text-sm italic">No journal entries found.</p>}
                </div>
              </section>

              <div className="grid md:grid-cols-2 gap-8">
                <section>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="text-pink-400" size={20} /> Appointments
                  </h4>
                  <div className="space-y-3">
                    {history.appointments.map((a: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                        <div>
                          <div className="text-white text-sm font-medium">{a.counsellorName}</div>
                          <div className="text-indigo-200/40 text-xs">{a.date} at {a.time}</div>
                        </div>
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                          a.status === 'confirmed' ? "bg-green-500/20 text-green-400" :
                          a.status === 'pending' ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          {a.status}
                        </span>
                      </div>
                    ))}
                    {history.appointments.length === 0 && <p className="text-indigo-200/20 text-sm italic">No appointments found.</p>}
                  </div>
                </section>

                <section>
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Brain className="text-orange-400" size={20} /> Quiz Results
                  </h4>
                  <div className="space-y-3">
                    {history.quizzes.map((q: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center">
                        <div>
                          <div className="text-white text-sm font-medium">{q.quizType || 'Wellness Quiz'}</div>
                          <div className="text-indigo-200/40 text-xs">{new Date(q.timestamp).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-indigo-400 font-bold">
                            {q.score}/{q.total}
                          </div>
                          <div className="text-indigo-200/40 text-[10px]">
                            {q.timestamp && !isNaN(new Date(q.timestamp).getTime()) ? new Date(q.timestamp).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                    {history.quizzes.length === 0 && <p className="text-indigo-200/20 text-sm italic">No quiz results found.</p>}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const AdminDashboardPage = ({ user, userRole }: { user: any, userRole: string | null }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMoods: 0,
    totalAppointments: 0,
    totalQuizResults: 0
  });
  const [moodData, setMoodData] = useState<any[]>([]);
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [quizTrendData, setQuizTrendData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const fetchData = async () => {
    try {
      // Fetch all users
      const usersSnap = await getDocs(collection(db, 'users'));
      const studentList = usersSnap.docs.filter(d => d.data().role === 'student').map(d => d.data());
      setStudents(studentList);
      
      // Fetch all moods
      const moodsSnap = await getDocs(collection(db, 'moods'));
      const moods = moodsSnap.docs.map(d => d.data());
      
      // Fetch all appointments
      const appointmentsSnap = await getDocs(collection(db, 'appointments'));
      const appointments = appointmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllAppointments(appointments);
      
      // Fetch all quiz results
      const quizSnap = await getDocs(collection(db, 'quiz_results'));
      const quizResults = quizSnap.docs.map(d => d.data());

      setStats({
        totalStudents: studentList.length,
        totalMoods: moods.length,
        totalAppointments: appointments.length,
        totalQuizResults: quizResults.length
      });

      // Process Mood Data
      const moodCounts = moods.reduce((acc: any, m: any) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {});
      const moodChartData = Object.keys(moodCounts).map(name => ({
        name,
        value: moodCounts[name]
      }));
      setMoodData(moodChartData);

      // Process Appointment Data
      const apptCounts = appointments.reduce((acc: any, a: any) => {
        acc[a.status] = (acc[a.status] || 0) + 1;
        return acc;
      }, {});
      const apptChartData = [
        { name: 'Pending', count: apptCounts.pending || 0 },
        { name: 'Confirmed', count: apptCounts.confirmed || 0 },
        { name: 'Cancelled', count: apptCounts.cancelled || 0 }
      ];
      setAppointmentData(apptChartData);

      // Process Quiz Trend Data (Average score per day)
      const quizByDate: { [key: string]: { total: number, count: number } } = {};
      
      quizResults.forEach((q: any) => {
        if (!q.timestamp) return;
        const dateObj = new Date(q.timestamp);
        if (isNaN(dateObj.getTime())) return;
        
        const dateKey = dateObj.toISOString().split('T')[0];
        
        if (!quizByDate[dateKey]) {
          quizByDate[dateKey] = { total: 0, count: 0 };
        }
        
        const scorePercent = (typeof q.score === 'number' && typeof q.total === 'number' && q.total > 0) 
          ? (q.score / q.total) * 100 
          : 0;
          
        quizByDate[dateKey].total += scorePercent;
        quizByDate[dateKey].count += 1;
      });

      const quizChartData = Object.keys(quizByDate)
        .sort()
        .map(dateKey => ({
          date: new Date(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          score: Math.round(quizByDate[dateKey].total / quizByDate[dateKey].count)
        }));

      setQuizTrendData(quizChartData);

      // Recent Activities
      const activities = [
        ...moods.map(m => ({ type: 'Mood', user: 'Student', detail: m.mood, time: m.timestamp || new Date().toISOString() })),
        ...appointments.map((a: any) => ({ type: 'Appointment', user: a.counsellorName, detail: a.status, time: a.createdAt || new Date().toISOString() })),
        ...quizResults.map(q => ({ type: 'Quiz', user: 'Student', detail: `${q.score}/${q.total}`, time: q.timestamp || new Date().toISOString() }))
      ].sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      }).slice(0, 10);
      
      setRecentActivities(activities);
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin_analytics');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole !== 'admin') return;
    fetchData();
  }, []);

  const handleConfirmAppointment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'confirmed'
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status: 'cancelled'
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${id}`);
    }
  };

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-bold text-white mb-2">Admin Analytics</h2>
          <p className="text-indigo-200/60">Recognize trends and plan student wellness interventions.</p>
        </div>
        <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
          <Shield size={32} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <div className="text-indigo-200/60 text-sm">Total Students</div>
              <div className="text-2xl font-bold text-white">{stats.totalStudents}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Activity size={24} />
            </div>
            <div>
              <div className="text-indigo-200/60 text-sm">Mood Logs</div>
              <div className="text-2xl font-bold text-white">{stats.totalMoods}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-pink-500/20 text-pink-400">
              <Calendar size={24} />
            </div>
            <div>
              <div className="text-indigo-200/60 text-sm">Appointments</div>
              <div className="text-2xl font-bold text-white">{stats.totalAppointments}</div>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20 text-orange-400">
              <Brain size={24} />
            </div>
            <div>
              <div className="text-indigo-200/60 text-sm">Quizzes Taken</div>
              <div className="text-2xl font-bold text-white">{stats.totalQuizResults}</div>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard className="p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Smile className="text-indigo-400" />
            Student Mood Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {moodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {moodData.map((m, i) => (
              <div key={m.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-indigo-200/60 text-xs">{m.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Calendar className="text-indigo-400" />
            Appointment Status Overview
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={appointmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-8">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Activity className="text-indigo-400" />
            Recent Global Activity
          </h3>
          <div className="space-y-4">
            {recentActivities.map((act, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    act.type === 'Mood' ? "bg-purple-500/20 text-purple-400" :
                    act.type === 'Appointment' ? "bg-blue-500/20 text-blue-400" :
                    "bg-orange-500/20 text-orange-400"
                  )}>
                    {act.type === 'Mood' ? <Smile size={16} /> :
                     act.type === 'Appointment' ? <Calendar size={16} /> :
                     <Brain size={16} />}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{act.type}: {act.detail}</div>
                    <div className="text-indigo-200/40 text-xs">{act.user}</div>
                  </div>
                </div>
                <div className="text-indigo-200/40 text-xs">
                  {act.time && !isNaN(new Date(act.time).getTime()) ? new Date(act.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
          <Clock className="text-indigo-400" />
          Pending Appointments
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-indigo-300/60 text-sm">
                <th className="pb-4 font-medium">Student</th>
                <th className="pb-4 font-medium">Counsellor</th>
                <th className="pb-4 font-medium">Date & Time</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allAppointments.filter(a => a.status === 'pending').map((appt) => {
                const student = students.find(s => s.uid === appt.userId);
                return (
                  <tr key={appt.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <img src={student?.photoURL || undefined} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                        <span className="text-white font-medium">{student?.displayName || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-indigo-200/60 text-sm">{appt.counsellorName}</td>
                    <td className="py-4 text-indigo-200/60 text-sm">
                      {appt.date} at {appt.time}
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button 
                        onClick={() => handleConfirmAppointment(appt.id)}
                        className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                        title="Confirm"
                      >
                        <Check size={16} />
                      </button>
                      <button 
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {allAppointments.filter(a => a.status === 'pending').length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-indigo-200/20 italic">No pending appointments.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-8">
        <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
          <Users className="text-indigo-400" />
          Student Directory
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-indigo-300/60 text-sm">
                <th className="pb-4 font-medium">Student</th>
                <th className="pb-4 font-medium">Email</th>
                <th className="pb-4 font-medium">Joined</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((student) => (
                <tr key={student.uid} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <img src={student.photoURL || undefined} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                      <span className="text-white font-medium">{student.displayName}</span>
                    </div>
                  </td>
                  <td className="py-4 text-indigo-200/60 text-sm">{student.email}</td>
                  <td className="py-4 text-indigo-200/60 text-sm">{student.createdAt && !isNaN(new Date(student.createdAt).getTime()) ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td className="py-4 text-right">
                    <button 
                      onClick={() => setSelectedStudent(student)}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-bold uppercase tracking-wider"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <AnimatePresence>
        {selectedStudent && (
          <StudentHistoryModal 
            student={selectedStudent} 
            onClose={() => setSelectedStudent(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'student' | 'admin' | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing');
  const [loginType, setLoginType] = useState<'student' | 'admin'>('student');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState('English');

  const languages = ['English', 'Hindi', 'Kannada', 'Telugu', 'Tamil'];

  const handleFirestoreError = (error: any, operation: string, path: string) => {
    const errInfo = {
      error: error.message || String(error),
      code: error.code,
      operation,
      path,
      auth: {
        uid: auth.currentUser?.uid,
        email: auth.currentUser?.email,
      }
    };
    console.error(`Firestore Error [${operation}]:`, JSON.stringify(errInfo, null, 2));
    return errInfo;
  };

  useEffect(() => {
    const testConn = async () => {
      try {
        await getDoc(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConn();

    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        try {
          // Check bootstrap admin immediately
          if (u.email === 'gurupadappa4@gmail.com') {
            setUserRole('admin');
          }

          const userRef = doc(db, 'users', u.uid);
          let userSnap;
          try {
            userSnap = await getDoc(userRef);
          } catch (err: any) {
            handleFirestoreError(err, 'getDoc', userRef.path);
            if (u.email === 'gurupadappa4@gmail.com') {
              setUserRole('admin');
            } else {
              setUserRole('student');
            }
            return;
          }
          
          let role: 'student' | 'admin' = 'student';
          if (u.email === 'gurupadappa4@gmail.com') {
            role = 'admin';
          }

          if (!userSnap.exists()) {
            try {
              await setDoc(userRef, {
                uid: u.uid,
                displayName: u.displayName,
                email: u.email,
                photoURL: u.photoURL,
                role: role,
                createdAt: serverTimestamp()
              });
              setUserRole(role);
            } catch (err: any) {
              handleFirestoreError(err, 'setDoc', userRef.path);
              setUserRole(role); // Fallback to local role
            }
          } else {
            const userData = userSnap.data();
            setUserRole(userData.role || 'student');
          }
        } catch (error) {
          console.error("Error in auth state change:", error);
          if (u.email === 'gurupadappa4@gmail.com') {
            setUserRole('admin');
          } else {
            setUserRole('student');
          }
        }
      } else {
        setUserRole(null);
      }
      setUser(u);
      if (u && currentPage === 'landing') {
        setCurrentPage(u.email === 'gurupadappa4@gmail.com' ? 'admin-dashboard' : 'chat');
      }
    });
  }, [currentPage]);

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      
      if (loginType === 'admin' && u.email !== 'gurupadappa4@gmail.com') {
        await signOut(auth);
        alert("Access Denied: You are not an authorized administrator.");
        return;
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelled by user');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setUserRole(null);
    setLoginType('student');
    setCurrentPage('landing');
  };

  const navItems = userRole === 'admin' ? [
    { id: 'admin-dashboard', label: 'Analytics', icon: Shield },
    { id: 'resources', label: 'Resources', icon: BookOpen },
    { id: 'forum', label: 'Forum', icon: Users },
  ] : [
    { id: 'chat', label: 'AI Support', icon: MessageCircle },
    { id: 'booking', label: 'Appointments', icon: Calendar },
    { id: 'journal', label: 'Journal', icon: PenTool },
    { id: 'quizzes', label: 'Quizzes for Relief', icon: Brain },
    { id: 'resources', label: 'Psychoeducational Resource Hub', icon: BookOpen },
    { id: 'forum', label: 'Peer Forum', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'emergency', label: 'Emergency', icon: PhoneCall },
  ];

  return (
    <ErrorBoundary>
      <div className={cn(
        "min-h-screen transition-colors duration-500",
        isDarkMode ? "bg-[#0f172a] text-white" : "bg-indigo-50 text-slate-900"
      )}>
        {/* Navbar */}
        <nav className="fixed top-0 w-full z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl px-6 py-3">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentPage('landing')}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Heart size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">Serene<span className="text-indigo-400">Space</span></span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden xl:flex items-center gap-2">
              {user && navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={cn(
                    "px-3 py-2 rounded-xl text-[13px] font-medium transition-all flex items-center gap-2",
                    currentPage === item.id 
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                      : "text-indigo-200/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-white/5 rounded-xl px-3 py-1 border border-white/10">
                <Languages size={16} className="text-indigo-400" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent text-xs text-indigo-200 focus:outline-none cursor-pointer"
                >
                  {languages.map(l => <option key={l} value={l} className="bg-[#0f172a]">{l}</option>)}
                </select>
              </div>

              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl bg-white/5 text-indigo-200 hover:bg-white/10 transition-colors"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {user ? (
                <div className="flex items-center gap-4">
                  <img src={user.photoURL || undefined} alt="User" className="w-10 h-10 rounded-full border-2 border-indigo-500/50" referrerPolicy="no-referrer" />
                  <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-indigo-300/60 hover:text-white text-sm">
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  disabled={isLoggingIn}
                  className="px-6 py-2 rounded-xl text-sm"
                >
                  {isLoggingIn ? 'Signing in...' : 'Sign In'}
                </Button>
              )}

              <button 
                className="md:hidden p-2 text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-40 bg-[#0f172a]/95 backdrop-blur-2xl pt-24 px-6 md:hidden"
            >
              <div className="flex flex-col gap-4">
                {user && navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentPage(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={cn(
                      "p-6 rounded-3xl text-xl font-bold flex items-center gap-4 transition-all",
                      currentPage === item.id ? "bg-indigo-500 text-white" : "bg-white/5 text-indigo-200"
                    )}
                  >
                    <item.icon size={24} />
                    {item.label}
                  </button>
                ))}
                {user && (
                  <button onClick={handleLogout} className="p-6 rounded-3xl bg-red-500/10 text-red-400 text-xl font-bold flex items-center gap-4">
                    <LogOut size={24} />
                    Sign Out
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="pt-32 pb-20 px-6 min-h-screen relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              {currentPage === 'landing' && (
                <LandingPage 
                  onStart={handleLogin} 
                  loading={isLoggingIn} 
                  loginType={loginType}
                  setLoginType={setLoginType}
                />
              )}
              {currentPage === 'admin-dashboard' && user && userRole === 'admin' && <AdminDashboardPage user={user} userRole={userRole} />}
              {currentPage === 'chat' && user && <ChatPage user={user} language={language} />}
              {currentPage === 'booking' && user && <BookingPage user={user} />}
              {currentPage === 'journal' && user && <JournalPage user={user} />}
              {currentPage === 'quizzes' && user && <QuizzesForReliefPage user={user} />}
              {currentPage === 'resources' && <PsychoeducationalResourceHub />}
              {currentPage === 'forum' && user && <ForumPage user={user} />}
              {currentPage === 'dashboard' && user && <DashboardPage user={user} setCurrentPage={setCurrentPage} />}
              {currentPage === 'emergency' && <EmergencyPage />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 py-10 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Heart size={20} className="text-indigo-500" />
              <span className="text-indigo-200/60 text-sm">© 2026 SereneSpace. Built with love for students.</span>
            </div>
            <div className="flex gap-8 text-sm text-indigo-300/40">
              <a href="#" className="hover:text-indigo-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-300 transition-colors">Emergency Contacts</a>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
