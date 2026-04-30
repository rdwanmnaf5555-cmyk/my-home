import React, { useState, useEffect, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  Lightbulb, 
  Zap, 
  AlertTriangle, 
  Home, 
  Settings, 
  Activity,
  Power,
  ChevronRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { cn } from './lib/utils';
import { SmartHomeState } from './types';
import { Onboarding } from './components/Onboarding';
import { HomeDashboard } from './components/HomeDashboard';
import { auth, getUserProfile } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

// --- Main App ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setUserName(profile.name);
          setShowOnboarding(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Activity className="text-amber-500 animate-spin" size={48} />
          <span className="text-amber-500 font-mono tracking-widest text-[10px] uppercase">My Home Security System</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 text-[10px] text-white/20 hover:text-white transition-colors underline"
          >
            إذا استغرق الأمر وقتاً طويلاً، اضغط لإعادة التحميل
          </button>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={(name) => { setUserName(name); setShowOnboarding(false); }} />;
  }

  return <HomeDashboard userName={userName} />;
}
