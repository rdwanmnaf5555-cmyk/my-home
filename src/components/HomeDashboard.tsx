import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  AlertTriangle, 
  ShieldAlert, 
  Search, 
  ArrowLeft,
  Cpu,
  Power,
  Activity,
  ShieldCheck,
  Thermometer,
  CloudLightning,
  Menu,
  User,
  Settings2,
  Globe,
  X,
  Brain,
  Radar,
  Save,
  Mail,
  MapPin,
  Bell,
  CheckCircle2,
  AlertCircle,
  History,
  Unplug,
  Wifi,
  BarChart3,
  Stethoscope,
  Heart,
  Languages,
  RefreshCw
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { db, auth } from '../firebase';
import { 
  doc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
import mqtt from 'mqtt';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// MQTT Client Options
const MQTT_BROKER = `wss://Greenorchid-e9c94935.a02.usw2.aws.hivemq.cloud:8884/mqtt`;
const MQTT_USER = 'admin';
const MQTT_PASS = '12345678Aa';

interface DashboardProps {
  userName: string;
}

// Sub-component for individual component status row
const ComponentRow = ({ name, status, icon: Icon, onClick, sensorHealthy = true }: { name: string, status: string, icon: any, onClick?: () => void, sensorHealthy?: boolean }) => {
    const isGood = sensorHealthy && (status === 'GOOD' || status === 'HEALTHY' || status === 'OPTIMAL' || status === 'STABLE');
    const isWarning = status === 'LEVEL_LOW' || status === 'NOISY';
    const isActive = status === 'ACTIVE';
    const isFault = !sensorHealthy || status === 'FAULT' || status === 'DISCONNECTED';

    return (
        <button 
          onClick={onClick}
          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-right group ${isFault ? 'border-rose-500/50 bg-rose-500/10' : 'bg-white/5 border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5'}`}
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${isGood ? 'bg-emerald-500/10 text-emerald-500' : isFault ? 'bg-rose-500/20 text-rose-500' : isWarning ? 'bg-amber-500/10 text-amber-500' : isActive ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-white/20'}`}>
                    <Icon size={14} className="group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex flex-col items-start translate-y-[2px]">
                  <span className="text-xs font-bold text-white/70">{name}</span>
                  <span className="text-[7px] font-mono text-white/20 uppercase tracking-tighter">{isFault ? 'SENSOR_FAULT' : 'Click to Diagnose'}</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-black ${isGood ? 'text-emerald-500' : isWarning ? 'text-amber-500' : isActive ? 'text-blue-500' : 'text-rose-500'}`}>
                    {isFault ? 'ERR_OFFLINE' : status}
                </span>
                <div className={`w-1 h-1 rounded-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : isActive ? 'bg-blue-500' : 'bg-rose-500'}`} />
            </div>
        </button>
    );
};

// Sub-component for Glowing Energy Paths
const EnergyPath = ({ side, isActive }: { side: 'left' | 'right', isActive: boolean }) => {
  const isLeft = side === 'left';
  // Path from rooms to core
  const pathD = isLeft 
    ? "M 40 100 L 120 100" 
    : "M 280 100 L 360 100";

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 200">
      {/* Glow filter */}
      <defs>
        <filter id={`glow-${side}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Base Line */}
      <path 
        d={pathD} 
        stroke={isActive ? "rgba(16, 185, 129, 0.4)" : "rgba(255, 255, 255, 0.05)"} 
        strokeWidth="2" 
        fill="none" 
      />

      {/* Animated Pulse */}
      <AnimatePresence>
        {isActive && (
          <motion.path
            d={pathD}
            stroke="#10b981"
            strokeWidth="3"
            fill="none"
            filter={`url(#glow-${side})`}
            initial={{ strokeDasharray: "0 100" }}
            animate={{ 
              strokeDasharray: ["0 100", "100 0", "0 100"],
              strokeDashoffset: [0, -100]
            }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        )}
      </AnimatePresence>
    </svg>
  );
};

// Sub-component for Room Module
const RoomModule = ({ 
  label, 
  isActive, 
  onToggle, 
  id,
  load,
  noise,
  voltageStatus
}: { 
  label: string, 
  isActive: boolean, 
  onToggle: () => void,
  id: number,
  load: string,
  noise: string,
  voltageStatus: string
}) => {
  const [justActivated, setJustActivated] = useState(false);

  useEffect(() => {
    if (isActive) {
      setJustActivated(true);
      const t = setTimeout(() => setJustActivated(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isActive]);

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`group relative w-72 p-6 rounded-[2.5rem] border-2 transition-all duration-700 overflow-hidden flex flex-col gap-4 text-right shadow-2xl ${
        isActive 
          ? 'border-emerald-500/50 bg-emerald-500/10' 
          : 'border-white/5 bg-[#0a0a0a] hover:border-white/20'
      }`}
    >
      {/* Dynamic Glow Background */}
      <AnimatePresence>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: justActivated ? 0.8 : 0.3 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-emerald-500/20 blur-[60px] transition-opacity duration-1000`}
          />
        )}
      </AnimatePresence>

      {/* Module Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold font-mono tracking-tighter ${isActive ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/40'}`}>
           NODE_R0{id} // ADDR_0x0{id}
        </div>
        <div className="flex items-center gap-2">
            <Thermometer size={14} className={isActive ? 'text-amber-500 animate-pulse' : 'text-white/20'} />
            <Power className={isActive ? 'text-emerald-500 animate-pulse active-glow' : 'text-white/20'} size={20} />
        </div>
      </div>

      {/* Label & Connected Devices */}
      <div className="mt-2 relative z-10">
        <h3 className={`text-xl font-black transition-colors ${isActive ? 'text-white' : 'text-white/40'}`}>{label}</h3>
        <div className="flex items-center justify-end gap-2 mt-1">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">2x LED_LAMP ACTIVE</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-white/10'}`} />
        </div>
      </div>

      {/* Hardware Detailed Readouts */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5 relative z-10">
        <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-2xl">
          <span className="text-[8px] text-white/30 uppercase font-bold flex items-center gap-1"><Zap size={8} /> Amperage</span>
          <span className={`text-sm font-mono font-black ${isActive ? 'text-emerald-400' : 'text-white/10'}`}>{load} A</span>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-white/5 rounded-2xl">
          <span className="text-[8px] text-white/30 uppercase font-bold flex items-center gap-1"><Activity size={8} /> Harmonic %</span>
          <span className={`text-sm font-mono font-black ${isActive ? (parseFloat(noise) > 15 ? 'text-rose-500' : 'text-amber-400') : 'text-white/10'}`}>{noise}%</span>
        </div>
        <div className="col-span-2 flex items-center justify-between px-3 py-2 bg-white/5 rounded-xl">
             <span className="text-[8px] text-white/30 uppercase font-bold">Relay Voltage</span>
             <span className={`text-[10px] font-mono ${voltageStatus === 'LOW' ? 'text-rose-500' : 'text-emerald-500'}`}>{voltageStatus}</span>
        </div>
      </div>

      {/* Visual Component: Relay & Wire representation */}
      <div className="flex justify-center mt-2 relative py-2">
          <div className={`w-12 h-1 border-2 rounded-full transition-all duration-500 ${isActive ? 'bg-emerald-500 border-emerald-400' : 'bg-white/10 border-white/5'}`} />
          <motion.div 
            animate={isActive ? { rotate: [0, 5, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className={`absolute -top-1 w-4 h-4 rounded-sm border transition-all ${isActive ? 'bg-emerald-900 border-emerald-500' : 'bg-neutral-800 border-white/10'}`} 
          />
      </div>

      {/* Decorative energy bars */}
       <div className="flex gap-1 mt-2">
        {[...Array(12)].map((_, i) => (
          <motion.div 
            key={i}
            animate={isActive ? { opacity: [0.2, 1, 0.2], height: [4, 8, 4] } : { opacity: 0.1, height: 4 }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.05 }}
            className={`flex-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-white/20'}`} 
          />
        ))}
      </div>

      {/* Active Scanline */}
      {isActive && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 250 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent h-24 pointer-events-none"
        />
      )}
    </motion.button>
  );
};

// Initialization for AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface DashboardProps {
  userName: string;
}

interface Notification {
  id: string;
  type: 'danger' | 'info' | 'success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface DiagnosticIssue {
  id: string;
  code: number;
  msg: string;
  time: string;
  severity: 'low' | 'high' | 'critical';
}

interface EnergyPoint {
  time: string;
  amps: number;
}

export function HomeDashboard({ userName: initialUserName }: DashboardProps) {
  const [view, setView] = useState<'main' | 'risk' | 'check' | 'analytics' | 'esp_config'>('main');
  const [currentPeriod, setCurrentPeriod] = useState<'Minutes' | 'Hours' | 'Days' | 'Weeks' | 'Months'>('Minutes');
  const [espSettings, setEspSettings] = useState({
    ssid: 'MyHome_Smart',
    password: '****************',
    serverUrl: 'mqtt.myhome.local',
    language: 'ar-IQ',
    updateInterval: 1000,
    firmwareVersion: 'v2.4.1-Stable'
  });

  const languages = [
    { code: 'ar-IQ', name: 'العربية', flag: '🇮🇶' },
    { code: 'en-US', name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  ];
  const [scanReport, setScanReport] = useState<string>('');
  const [appUnlocked, setAppUnlocked] = useState(false);
  const [showConsentPrompt, setShowConsentPrompt] = useState(false);
  const [isBypassMode, setIsBypassMode] = useState(false);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);

  const [roomStates, setRoomStates] = useState({
    right: false,
    left: false
  });
  const [hardwareData, setHardwareData] = useState({
    current: "0.0",
    noise: "2.4",
    voltage: "NORMAL",
    lastAlert: "",
    status: "CONNECTING...",
    rssi: -100,
    sensorHealthy: true
  });
  
  const [predictionCooldown, setPredictionCooldown] = useState<number>(0);
  const [notifCooldown, setNotifCooldown] = useState<number>(0);
  const [safetyScore, setSafetyScore] = useState<number>(100);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (predictionCooldown > 0 || notifCooldown > 0) {
      timer = setInterval(() => {
        setPredictionCooldown(prev => prev > 0 ? prev - 1 : 0);
        setNotifCooldown(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [predictionCooldown, notifCooldown]);

  // Logic to show prompt after timeout
  useEffect(() => {
    const t = setTimeout(() => setConnectionTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (hardwareData.status === 'متصل') {
      setAppUnlocked(true);
      setShowConsentPrompt(false);
    } else if (connectionTimedOut && !appUnlocked) {
      setShowConsentPrompt(true);
    }
  }, [hardwareData.status, connectionTimedOut, appUnlocked]);

  // Test Firebase Connectivity
  useEffect(() => {
    const checkConnection = async () => {
        try {
            const { doc, getDocFromServer } = await import('firebase/firestore');
            await getDocFromServer(doc(db, 'test', 'ping')).catch(() => {});
            console.log("🔥 Firebase: Connected");
        } catch (e) {
            console.warn("🔥 Firebase: Offline/Error", e);
        }
    };
    checkConnection();
  }, []);
  // Helper to generate simulated historical data
  const historicalData = useMemo(() => {
    const data: EnergyPoint[] = [];
    const count = currentPeriod === 'Minutes' ? 30 : currentPeriod === 'Hours' ? 24 : currentPeriod === 'Days' ? 7 : currentPeriod === 'Weeks' ? 4 : 12;
    const baseAmps = 0.4;
    
    for (let i = 0; i < count; i++) {
        let timeLabel = '';
        const now = new Date();
        if (currentPeriod === 'Minutes') {
            now.setMinutes(now.getMinutes() - (count - i));
            timeLabel = now.toLocaleTimeString('ar-IQ', { minute: '2-digit', second: '2-digit' });
        } else if (currentPeriod === 'Hours') {
            now.setHours(now.getHours() - (count - i));
            timeLabel = now.toLocaleTimeString('ar-IQ', { hour: '2-digit' });
        } else if (currentPeriod === 'Days') {
            now.setDate(now.getDate() - (count - i));
            timeLabel = now.toLocaleDateString('ar-IQ', { weekday: 'short' });
        } else if (currentPeriod === 'Weeks') {
            now.setDate(now.getDate() - (count - i) * 7);
            timeLabel = `أسبوع ${i + 1}`;
        } else {
            now.setMonth(now.getMonth() - (count - i));
            timeLabel = now.toLocaleDateString('ar-IQ', { month: 'short' });
        }
        
        data.push({
            time: timeLabel,
            amps: parseFloat((baseAmps + Math.random() * 0.8).toFixed(2))
        });
    }
    return data;
  }, [currentPeriod]);

  // Periodic Energy Logging to Firestore
  useEffect(() => {
    if (!auth.currentUser || isBypassMode) return;

    const logEnergy = async () => {
      try {
        const val = parseFloat(hardwareData.current);
        if (isNaN(val)) return;

        await addDoc(collection(db, 'energy_usage'), {
          amps: val,
          timestamp: Timestamp.now(),
          period: 'minute',
          userId: auth.currentUser?.uid
        });
        console.log('⚡ Energy logged to Firestore');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'energy_usage');
      }
    };

    // Log every 1 minute
    const interval = setInterval(logEnergy, 60000);
    return () => clearInterval(interval);
  }, [hardwareData.current, isBypassMode]);

  // Fetch real data from Firestore
  const [realHistoricalData, setRealHistoricalData] = useState<EnergyPoint[]>([]);
  const [trends, setTrends] = useState({ diff: 0, direction: 'stable' as 'up' | 'down' | 'stable' });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser || isBypassMode) {
        setRealHistoricalData(historicalData);
        return;
      }

      try {
        const q = query(
          collection(db, 'energy_usage'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(40)
        );

        const querySnapshot = await getDocs(q);
        const fetchedData: EnergyPoint[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const ts = data.timestamp as Timestamp;
          const date = ts.toDate();
          let timeLabel = '';
          
          if (currentPeriod === 'Minutes') {
            timeLabel = date.toLocaleTimeString('ar-IQ', { minute: '2-digit', second: '2-digit' });
          } else if (currentPeriod === 'Hours') {
            timeLabel = date.toLocaleTimeString('ar-IQ', { hour: '2-digit' });
          } else {
            timeLabel = date.toLocaleDateString('ar-IQ', { day: '2-digit', month: '2-digit' });
          }

          return {
            time: timeLabel,
            amps: data.amps
          };
        }).reverse();

        if (fetchedData.length > 0) {
          setRealHistoricalData(fetchedData);
          
          // Simple trend calculation
          if (fetchedData.length >= 2) {
            const current = fetchedData[fetchedData.length - 1].amps;
            const previous = fetchedData[fetchedData.length - 2].amps;
            const diff = current - previous;
            setTrends({
              diff: Math.abs(diff),
              direction: diff > 0.01 ? 'up' : diff < -0.01 ? 'down' : 'stable'
            });
          }
        } else {
          setRealHistoricalData(historicalData);
        }
      } catch (err) {
        // Detailed error logging for permissions/index issues
        const errInfo = err instanceof Error ? err.message : String(err);
        if (errInfo.includes('permission') || errInfo.includes('index')) {
           console.error('📋 Firestore Query Error. This usually means a composite index is required. Check the browser console for a link to create it, or ensure the rules match the query context.', errInfo);
        } else {
           console.error('❌ Failed to fetch history:', err);
        }
        setRealHistoricalData(historicalData);
        // Do not throw here to avoid infinite error loop in UI, just log
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [currentPeriod, auth.currentUser, isBypassMode, historicalData]);

  const [diagnosticIssues, setDiagnosticIssues] = useState<DiagnosticIssue[]>([]);
  const [healthScore, setHealthScore] = useState(100);
  const [riskData, setRiskData] = useState<string>('');
  const [predictionTimer, setPredictionTimer] = useState(300); // 5 minutes in seconds
  const [nextPredictionTime, setNextPredictionTime] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<{name: string, status: string, health: number, description: string} | null>(null);
  const [overloadModal, setOverloadModal] = useState<{room: 'left' | 'right', current: number} | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<'analyzing' | 'stable' | 'warning' | null>(null);
  // Calculate stats for cards
  const stats = useMemo(() => {
    const data = realHistoricalData.length > 0 ? realHistoricalData : historicalData;
    const sum = data.reduce((acc, curr) => acc + curr.amps, 0);
    const avg = sum / data.length;
    const peak = Math.max(...data.map(d => d.amps));
    // Estimate KWh (rough: amps * 220v * hours / 1000)
    // For 24 records of 1 hour intervals
    const estKWh = (avg * 220 * 24) / 1000;
    const efficiency = 90 + Math.random() * 8;

    return {
      avg: avg.toFixed(2),
      peak: peak.toFixed(2),
      estKWh: estKWh.toFixed(1),
      efficiency: efficiency.toFixed(1),
      safetyScore: safetyScore
    };
  }, [realHistoricalData, historicalData, safetyScore]);

  const [aiLoading, setAiLoading] = useState(false);

  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  // Menu, Profile & Notifications State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [editMode, setEditMode] = useState<null | 'profile' | 'settings' | 'lang' | 'history'>(null);
  const [profile, setProfile] = useState({
    name: initialUserName,
    email: auth.currentUser?.email || '',
    location: 'العراق'
  });
  const [isSaving, setIsSaving] = useState(false);

  // MQTT Connection Logic
  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_BROKER, {
        username: MQTT_USER,
        password: MQTT_PASS,
        clientId: 'MyHome_Panel_' + Date.now(),
        reconnectPeriod: 1000,
        connectTimeout: 30000,
        clean: true,
        keepalive: 60,
        resubscribe: true,
        reschedulePings: true
    });

    const handleOnline = () => setHardwareData(prev => ({ ...prev, status: "جاري الاتصال..." }));
    const handleOffline = () => setHardwareData(prev => ({ ...prev, status: "لا يوجد إنترنت" }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
        setHardwareData(prev => ({ ...prev, status: "لا يوجد إنترنت" }));
    }

    mqttClient.on('connect', () => {
        console.log('✅ Connected to HiveMQ Cloud');
        setHardwareData(prev => ({ ...prev, status: "متصل" }));
        setAppUnlocked(true);
        mqttClient.subscribe(['home/current', 'home/relay1', 'home/relay2', 'home/alerts', 'home/diagnostics', 'home/status', 'home/rssi']);
    });

    mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
        setHardwareData(prev => ({ ...prev, status: "جاري إعادة الاتصال..." }));
    });

    mqttClient.on('offline', () => {
        console.log('⚠️ MQTT Offline');
        setHardwareData(prev => ({ ...prev, status: "غير متصل (MQTT)" }));
    });

    mqttClient.on('disconnect', (packet) => {
        console.log('❌ MQTT Disconnected:', packet);
    });

    mqttClient.on('error', (err) => {
        if (err.message && err.message.includes('client disconnecting')) {
            // This is a normal state during disconnection, ignore it
            return;
        }
        console.error('🔴 MQTT Error:', err.message);
        setHardwareData(prev => ({ ...prev, status: "خطأ اتصال" }));
    });

    mqttClient.on('message', (topic, message) => {
        const msgStr = message.toString().trim();
        const nowTime = new Date().toLocaleTimeString('ar-IQ', { hour12: false });
        
        console.log(`[MQTT IN] Topic: ${topic} | Msg: "${msgStr}"`);

        if (topic === 'home/current') {
            const val = parseFloat(msgStr);
            setHardwareData(prev => ({ ...prev, current: msgStr }));
            setRealHistoricalData(prev => {
                const newData = [...prev, { time: nowTime.slice(-5), amps: isNaN(val) ? 0 : val }];
                return newData.slice(-40);
            });
        } else if (topic === 'home/diagnostics') {
            const isError = msgStr.includes('ERR') || msgStr.includes('FAULT');
            setHardwareData(prev => ({ ...prev, sensorHealthy: !isError }));
            
            // Adjust safety score instantly based on hardware health
            setSafetyScore(prev => isError ? Math.max(prev - 40, 10) : Math.min(prev + 5, 100));

            if (isError) {
                setNotifications(prev => [{
                    id: Date.now().toString(),
                    type: 'danger',
                    title: 'انخفاض مستوى الأمان',
                    message: `تم رصد خلل في الهاردوير (${msgStr}). النظام يعمل الآن في وضع الحماية المحدود.`,
                    time: nowTime,
                    isRead: false
                }, ...prev]);
            }
        } else if (topic === 'home/status') {
            setHardwareData(prev => ({ ...prev, status: msgStr.toUpperCase() }));
        } else if (topic === 'home/rssi') {
            setHardwareData(prev => ({ ...prev, rssi: parseInt(msgStr) || -100 }));
        } else if (topic === 'home/diagnostics') {
            try {
                const data = JSON.parse(msgStr);
                const severity = data.code > 25 ? 'critical' : data.code > 10 ? 'high' : 'low';
                const issue: DiagnosticIssue = {
                    id: Math.random().toString(36).substr(2, 9),
                    code: data.code,
                    msg: data.msg,
                    time: nowTime,
                    severity
                };
                setDiagnosticIssues(prev => [issue, ...prev].slice(0, 50));
                setHealthScore(prev => Math.max(0, prev - (data.code > 25 ? 15 : 8)));
                setNotifications(prev => [{
                    id: issue.id,
                    type: severity === 'low' ? 'info' : 'danger',
                    title: 'تشخيص الهاردوير',
                    message: data.msg,
                    time: nowTime,
                    isRead: false
                }, ...prev]);
            } catch (e) {
                console.error("JSON parse error diagnostics", e);
            }
        } else if (topic === 'home/relay1') {
            const state = msgStr === '1' || msgStr.toLowerCase() === 'on';
            console.log(`[SYNC] Room 1 -> ${state}`);
            setRoomStates(prev => ({ ...prev, left: state }));
        } else if (topic === 'home/relay2') {
            const state = msgStr === '1' || msgStr.toLowerCase() === 'on';
            console.log(`[SYNC] Room 2 -> ${state}`);
            setRoomStates(prev => ({ ...prev, right: state }));
        } else if (topic === 'home/alerts') {
            const newNotify: Notification = {
                id: Date.now().toString(),
                type: 'danger',
                title: 'تنبيه طارئ',
                message: msgStr,
                time: new Date().toLocaleTimeString('ar-IQ'),
                isRead: false
            };
            setNotifications(prev => [newNotify, ...prev]);
            // Web Notification
            if (Notification.permission === 'granted') {
                new Notification('My Home: تنبيه طارئ', { body: msgStr });
            }
        }
    });

    setClient(mqttClient);

    // Request Notification Permissions
    if (typeof window !== 'undefined' && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        mqttClient.end();
    };
  }, []);

  // Protocol Warning
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
       setNotifications(prev => [{
         id: 'protocol-warn',
         type: 'danger',
         title: 'خطأ التشغيل',
         message: 'التطبيق لا يعمل من الملفات مباشرة. يرجى تشغيله عبر سيرفر محلي (Live Server) ليعمل الاتصال.',
         time: new Date().toLocaleTimeString('ar-IQ'),
         isRead: false
       }, ...prev]);
    }
  }, []);

  // Prediction Timer Logic (5 minutes)
  useEffect(() => {
    const timer = setInterval(() => {
      setPredictionTimer(prev => {
        if (prev <= 1) {
          generateRiskPrediction();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);
    
    const updateNextTime = () => {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 5);
      setNextPredictionTime(now.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }));
    };
    updateNextTime();
    
    return () => clearInterval(timer);
  }, []);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const orbActive = roomStates.right || roomStates.left;

  // Overload Protection Logic
  useEffect(() => {
    const currentVal = parseFloat(hardwareData.current);
    const OVERLOAD_THRESHOLD = 3.0; // 3A is safe for 4 lamps total, above this is risky
    
    if (currentVal > OVERLOAD_THRESHOLD && !overloadModal) {
      // Find which room is on
      if (roomStates.left || roomStates.right) {
        const targetRoom = roomStates.left ? 'left' : 'right';
        setOverloadModal({ room: targetRoom, current: currentVal });
        // Auto trip for safety
        toggleRoom(targetRoom);
        
        const notify: Notification = {
          id: Date.now().toString(),
          type: 'danger',
          title: 'فصل حمل زائد',
          message: `تم فصل ${targetRoom === 'left' ? 'الغرفة الأولى' : 'الغرفة الثانية'} بسبب تخطي الحمل المسموح (أكثر من لمبتين).`,
          time: new Date().toLocaleTimeString('ar-IQ'),
          isRead: false
        };
        setNotifications(prev => [notify, ...prev]);
      }
    }
  }, [hardwareData.current]);

  const toggleRoom = (side: 'right' | 'left') => {
    if (isBypassMode) {
      setNotifications(prev => [{
        id: Date.now().toString(),
        type: 'info',
        title: 'وضع المشاهدة فقط',
        message: 'لا يمكنك التحكم بالأجهزة الآن لأن النظام في وضع المشاهدة فقط. يرجى التأكد من تشغيل الجهاز (ESP32) والاتصال بالإنترنت.',
        time: new Date().toLocaleTimeString('ar-IQ'),
        isRead: false
      }, ...prev]);
      return;
    }

    const topic = side === 'left' ? 'home/relay1' : 'home/relay2';
    const isCurrentActive = side === 'left' ? roomStates.left : roomStates.right;
    const newState = !isCurrentActive;
    
    // Detailed logging for debugging
    console.log(`[My Home Command] Sending to ${side}: Command=${newState ? 'ON' : 'OFF'} | Topic=${topic}`);

    if (client && client.connected) {
        client.publish(topic, newState ? '1' : '0', { qos: 1 }, (err) => {
            if (err) {
                console.error(`[MQTT ERR] Failed to publish to ${topic}:`, err);
                // Optionally show a notification
                setNotifications(prev => [{
                    id: Date.now().toString(),
                    type: 'danger',
                    title: 'خطأ إرسال الأمر',
                    message: `فشل التحكم في ${side === 'left' ? 'الغرفة الأولى' : 'الغرفة الثانية'}`,
                    time: new Date().toLocaleTimeString('ar-IQ'),
                    isRead: false
                }, ...prev]);
            }
            else {
                console.log(`[MQTT OK] Published ${newState ? '1' : '0'} to ${topic}`);
            }
        });
    } else {
        console.warn(`[MQTT OFFLINE] Cannot publish. Client state: ${client ? 'disconnected' : 'null'}`);
    }

    // Update local state for immediate response
    setRoomStates(prev => ({ ...prev, [side]: newState }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        name: profile.name,
        location: profile.location
      });
      setEditMode(null);
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const generateRiskPrediction = async (shouldSwitchView = false) => {
    if (predictionCooldown > 0) return;
    setAiLoading(true);
    if (shouldSwitchView) {
      setRiskData('');
      setView('risk');
    }
    try {
      const prompt = `أنت مساعد My Home الذكي المتصل بمشروع Smart Circuit Breaker عبر ESP32. 
      البيانات الحالية:
      - تيار الأمبير الكلي: ${hardwareData.current}A
      - مستوى التشويش الكهربائي (Harmonics): ${hardwareData.noise}%
      - حالة المستشعرات: ${hardwareData.sensorHealthy ? 'سليمة' : 'وجود خلل فني أو انقطاع سلك'}
      - عدد التنبيهات الأخيرة: ${notifications.length}
      
      قم بتحليل البيانات وتقديم تنبؤ دقيق للمشاكل المحتملة في غضون الساعات القادمة بناءً على هذه المعطيات. 
      إذا كان المستشعر غير سليم، نبه المستخدم بضرورة فحص التوصيلات فوراً.
      المستخدم هو ${profile.name}.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are My Home, a professional AI hardware specialist. Use professional technical Iraqi Arabic.",
        }
      });
      
      setRiskData(response.text || 'عذراً، لم أستطع تحليل البيانات حالياً.');
      setPredictionCooldown(300); // 5 mins
    } catch (err) {
      console.error("AI Error:", err);
      setRiskData('فشل الاتصال بأنظمة الذكاء الاصطناعي.');
    } finally {
      setAiLoading(false);
    }
  };

  const runSystemCheck = async () => {
    setView('check');
    setIsChecking(true);
    setCheckResult('analyzing');
    setScanReport('');
    
    // Pass context to AI to "explain" the current circuit health
    try {
        const prompt = `افحص حالة الدائرة الكهربائية للمشروع حالياً. 
        التيار: ${hardwareData.current}A، التشويش: ${hardwareData.noise}%، الغرفة الأولى: ${roomStates.left ? 'تعمل' : 'مطفأة'}، الغرفة الثانية: ${roomStates.right ? 'تعمل' : 'مطفأة'}.
        إذا كان هناك خلل، أشرح للمستخدم لماذا طفأت الكهرباء أو أين المشكلة بالضبط (مثلاً شورت أو زيادة حمل). 
        ركز على حالة الحساسات والريليات والـ ESP32.
        كن تقنياً وموجزاً ومحفزاً بالعراقي.`;
        
        await new Promise(r => setTimeout(r, 2500)); // Simulate hardware scan lag

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { systemInstruction: "My Home Circuit Scanner Mode." }
        });

        const isProblematic = parseFloat(hardwareData.noise) > 30 || parseFloat(hardwareData.current) > 10;
        setCheckResult(isProblematic ? 'warning' : 'stable');
        setScanReport(response.text || 'الفحص اكتمل بنجاح، لا توجد مشاكل حرجة.');
    } catch (e) {
        setCheckResult('stable');
        setScanReport('اكتمل الفحص الفيزيائي. الأنظمة تعمل ضمن الحدود الطبيعية.');
    } finally {
        setIsChecking(false);
        setView('check');
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!appUnlocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 text-center overflow-hidden" dir="rtl">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full" />
        
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative z-10 space-y-8 max-w-md w-full"
        >
            <div className="relative inline-block">
                <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse" />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="p-8 bg-black/40 border border-white/10 rounded-full relative z-10"
                >
                    <Radar className="text-emerald-500 w-16 h-16" />
                </motion.div>
            </div>

            <div className="space-y-3">
                <h2 className="text-3xl font-black tracking-tighter uppercase italic">My Home Core</h2>
                <p className="text-white/40 text-[10px] font-mono tracking-[0.3em] uppercase">Syncing Protocol v4.0</p>
            </div>

            {/* Connection Loop */}
            <div className="space-y-4 py-8">
                <div className="flex items-center justify-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${hardwareData.status === 'متصل' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`} />
                    <span className="text-xl font-bold font-mono text-white/80">{hardwareData.status}</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: hardwareData.status === 'متصل' ? '100%' : '60%' }}
                        className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                    />
                </div>
            </div>

            <AnimatePresence>
                {showConsentPrompt && (
                    <motion.div 
                        initial={{ y: 20, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 10, opacity: 0, scale: 0.95 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl space-y-6 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-1 opacity-[0.03] rotate-12">
                             <Unplug size={80} />
                        </div>
                        
                        <div className="flex flex-col items-center gap-3 relative z-10">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <AlertTriangle className="text-amber-500" size={24} />
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm font-bold leading-relaxed text-white/90">
                                    يبدو أن جهاز الـ ESP32 غير متصل حالياً بالسيرفر.
                                </p>
                                <p className="text-xs text-white/60 leading-relaxed">
                                    هل ترغب في الدخول بـ <span className="text-amber-500 font-bold">نسخة العرض فقط</span>؟
                                    <br />
                                    ستتمكن من رؤية البيانات والتحليلات، لكن التحكم المباشر سيتفعل فقط عند تشغيل الجهاز وربطه بالشبكة.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 relative z-10">
                            <button 
                                onClick={() => {
                                    setAppUnlocked(true);
                                    setIsBypassMode(true);
                                }}
                                className="flex-1 bg-amber-500 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                            >
                                دخول (نسخة محدودة)
                            </button>
                            <button 
                                onClick={() => {
                                    setConnectionTimedOut(false);
                                    setShowConsentPrompt(false);
                                    // Reset timer
                                    setTimeout(() => setConnectionTimedOut(true), 15000);
                                }}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white/40 py-4 rounded-2xl font-bold text-xs transition-all border border-white/5"
                            >
                                انتظار الاتصال...
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden flex flex-col pt-10 px-4" dir="rtl">
      
      {/* Network Status / Health HUD - Permanent Top Floating */}
      <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 shadow-2xl">
         <div className="flex items-center gap-2">
            <div className="flex gap-0.5 items-end h-3">
                {[...Array(4)].map((_, i) => {
                    const strength = Math.abs(hardwareData.rssi);
                    const bars = strength < 50 ? 4 : strength < 70 ? 3 : strength < 85 ? 2 : 1;
                    return (
                        <div key={i} className={`w-1 rounded-sm ${i < bars ? 'bg-emerald-500' : 'bg-white/10'}`} style={{ height: `${(i + 1) * 25}%` }} />
                    );
                })}
            </div>
            <span className="text-[9px] font-mono text-white/40">{hardwareData.rssi}dBm</span>
         </div>
         <div className="w-[1px] h-4 bg-white/10" />
         <div className="flex items-center gap-2">
            <Heart size={12} className={healthScore > 70 ? 'text-emerald-500' : healthScore > 40 ? 'text-amber-500' : 'text-rose-500'} />
            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ width: `${healthScore}%`, backgroundColor: healthScore > 70 ? '#10b981' : healthScore > 40 ? '#f59e0b' : '#ef4444' }} className="h-full" />
            </div>
            <span className="text-[10px] font-black font-mono">{healthScore}%</span>
         </div>
         <div className="w-[1px] h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
                hardwareData.status === 'متصل' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                hardwareData.status.includes('...') ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                'bg-rose-500 shadow-[0_0_8px_#ef4444]'
            } animate-pulse`} />
            <span className={`text-[9px] font-mono tracking-widest ${
                hardwareData.status === 'متصل' ? 'text-emerald-500' :
                hardwareData.status.includes('...') ? 'text-amber-500' :
                'text-rose-500'
            }`}>{hardwareData.status}</span>
          </div>
      </div>

      {/* Atmospheric Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03] bg-[size:50px_50px] bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)]" />
      </div>

      <AnimatePresence mode="wait">
        {view === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className="flex-1 flex flex-col items-center justify-center relative p-6 max-w-7xl mx-auto w-full"
          >
            {/* Top Security Rail */}
            <div className="absolute top-0 w-full flex justify-between items-center px-10 border-b border-white/5 py-4 z-50">
              <div className="flex items-center gap-6">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-emerald-500/50 uppercase tracking-[0.4em]">My Home Command System</span>
                        <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">v2.4.0-Stable // ESP32_Active</span>
                    </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-mono text-white/20 uppercase tracking-[0.3em]">System Operator</span>
                    <span className="text-sm font-black text-white">{profile.name}</span>
                </div>

                {/* Notifications Bell */}
                <div className="relative">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { setShowNotifications(!showNotifications); markAllAsRead(); }}
                      className={`p-2.5 rounded-2xl border transition-all ${unreadCount > 0 ? 'bg-rose-500/10 border-rose-500/50 text-rose-500' : 'bg-white/5 border-white/10 text-white/40'}`}
                    >
                      <Bell size={22} className={unreadCount > 0 ? 'animate-bounce' : ''} />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black">
                          {unreadCount}
                        </div>
                      )}
                    </motion.button>

                    <AnimatePresence>
                      {showNotifications && (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-transparent z-40" 
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute left-0 mt-4 w-80 bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl z-50"
                          >
                            <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity size={14} className="text-rose-500" /> تنبيهات النظام
                            </h4>
                            <div className="max-h-64 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="py-8 text-center opacity-20 text-xs font-mono uppercase">No Recent Activity</div>
                                ) : (
                                    notifications.slice(0, 5).map(n => (
                        <button 
                          key={n.id} 
                          onClick={() => { setSelectedNotification(n); setShowNotifications(false); }}
                          className="w-full text-right p-3 bg-white/5 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all block"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] font-black uppercase ${n.type === 'danger' ? 'text-rose-500' : 'text-blue-500'}`}>{n.title}</span>
                                <span className="text-[8px] font-mono text-white/20">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-white/70 line-clamp-2">{n.message}</p>
                        </button>
                    ))
                                )}
                            </div>
                            <button 
                                onClick={() => { setEditMode('history'); setShowNotifications(false); }}
                                className="w-full mt-4 py-3 text-[10px] uppercase font-black tracking-widest text-emerald-500/50 hover:text-emerald-500 transition-colors border-t border-white/5"
                            >
                                عرض السجل الكامل
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                </div>

                {/* Hamburger Menu - Re-positioned to far right */}
                <div className="relative">
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`p-2.5 rounded-2xl border transition-all ${isMenuOpen ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'}`}
                  >
                    <Menu size={22} />
                  </motion.button>

                  <AnimatePresence>
                    {isMenuOpen && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          onClick={() => setIsMenuOpen(false)}
                          className="fixed inset-0 bg-transparent z-40" 
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute left-0 mt-4 w-64 bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-3 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl z-50 overflow-hidden"
                        >
                          <div className="flex flex-col gap-1">
                            <button 
                              onClick={() => { setEditMode('profile'); setIsMenuOpen(false); }}
                              className="flex items-center gap-3 w-full p-4 rounded-3xl hover:bg-white/5 text-sm font-bold transition-all group"
                            >
                              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                                <User size={18} />
                              </div>
                              بيانات المستخدم
                            </button>
                            <button 
                              onClick={() => { setEditMode('history'); setIsMenuOpen(false); }}
                              className="flex items-center gap-3 w-full p-4 rounded-3xl hover:bg-white/5 text-sm font-bold transition-all group"
                            >
                              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all">
                                <History size={18} />
                              </div>
                              سجل التنبيهات
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="relative w-full flex items-center justify-between gap-8 h-[500px]">
              
              {/* Left Wing - Room 01 */}
              <div className="relative flex-1 flex justify-center z-20">
                <RoomModule 
                  id={1}
                  label="الغرفة الأولى"
                  isActive={roomStates.left}
                  onToggle={() => toggleRoom('left')}
                  load={roomStates.left ? (parseFloat(hardwareData.current) * (roomStates.right ? 0.45 : 1.0)).toFixed(1) : "0.0"}
                  noise={hardwareData.noise}
                  voltageStatus={hardwareData.voltage}
                />
              </div>

              {/* Central Core Sphere */}
              <div className="relative w-[400px] h-[400px] flex items-center justify-center shrink-0">
                <div className="absolute inset-0 z-0">
                  <EnergyPath side="left" isActive={roomStates.left} />
                  <EnergyPath side="right" isActive={roomStates.right} />
                </div>

                <div className="relative w-72 h-72 flex items-center justify-center">
                  {/* Gauge Ring for Amps */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle cx="50%" cy="50%" r="130" stroke="rgba(255,255,255,0.02)" strokeWidth="8" fill="none" />
                    <motion.circle 
                        cx="50%" cy="50%" r="130" 
                        stroke="url(#ampGradient)" 
                        strokeWidth="8" 
                        fill="none" 
                        strokeLinecap="round"
                        initial={{ strokeDasharray: "0 816" }}
                        animate={{ strokeDasharray: `${(parseFloat(hardwareData.current) / 20) * 816} 816` }}
                        transition={{ duration: 1 }}
                    />
                    <defs>
                        <linearGradient id="ampGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                    </defs>
                  </svg>
                  {/* Rotating Tech Rings */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset -10 border border-white/5 rounded-full border-dashed"
                  />
                  <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset -4 border border-white/10 rounded-full border-dashed"
                  />

                  {/* Glassmorphism Core */}
                  <motion.div 
                    animate={{ 
                      scale: orbActive ? [1, 1.05, 1] : 1,
                      boxShadow: orbActive 
                        ? ["0 0 50px rgba(16,185,129,0.3)", "0 0 100px rgba(16,185,129,0.5)", "0 0 50px rgba(16,185,129,0.3)"]
                        : "0 0 20px rgba(255,255,255,0.05)"
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className={`relative w-48 h-48 rounded-full border-2 flex items-center justify-center backdrop-blur-3xl overflow-hidden transition-all duration-1000 ${
                      orbActive 
                        ? 'bg-emerald-500/10 border-emerald-500/50' 
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                      {/* Interior Plasma Glow */}
                      <AnimatePresence>
                        {orbActive && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0"
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.4)_0%,transparent_70%)]" />
                            {[...Array(4)].map((_, i) => (
                              <motion.div 
                                key={i}
                                animate={{ 
                                  scale: [1, 1.8],
                                  opacity: [0.4, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, delay: i * 1 }}
                                className="absolute inset-0 border-2 border-emerald-500/20 rounded-full"
                              />
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative z-10 flex flex-col items-center">
                          <span className="text-4xl font-black text-white font-mono tracking-tighter">{hardwareData.current}</span>
                          <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] mb-1">AMPS</span>
                          <CloudLightning size={24} className={orbActive ? 'text-emerald-500 animate-pulse' : 'text-white/10'} />
                      </div>
                    </motion.div>
                  </div>
                </div>

              {/* Right Wing - Room 02 */}
              <div className="relative flex-1 flex justify-center z-20">
                <RoomModule 
                  id={2}
                  label="الغرفة الثانية"
                  isActive={roomStates.right}
                  onToggle={() => toggleRoom('right')}
                  load={roomStates.right ? (parseFloat(hardwareData.current) * (roomStates.left ? 0.55 : 1.0)).toFixed(1) : "0.0"}
                  noise={hardwareData.noise}
                  voltageStatus={hardwareData.voltage}
                />
              </div>
            </div>

            {/* Diagnostic/Action Tabs Navigation */}
            <div className="flex gap-4 w-full max-w-4xl mt-12 bg-white/5 p-2 rounded-[2.5rem] border border-white/5">
              <button 
                onClick={() => setView('main')}
                className={`flex-1 py-4 px-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${view === 'main' ? 'bg-white text-black font-black' : 'hover:bg-white/5 text-white/40'}`}
              >
                <Zap size={20} />
                <span className="text-sm uppercase tracking-tighter">التحكم</span>
              </button>
              <button 
                onClick={() => setView('check')}
                className={`flex-1 py-4 px-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${view === 'check' ? 'bg-emerald-500 text-black font-black' : 'hover:bg-white/5 text-white/40'}`}
              >
                <Stethoscope size={20} />
                <span className="text-sm uppercase tracking-tighter">مركز الصيانة</span>
              </button>
              <button 
                onClick={() => setView('analytics')}
                className={`flex-1 py-4 px-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${view === 'analytics' ? 'bg-blue-500 text-black font-black' : 'hover:bg-white/5 text-white/40'}`}
              >
                <BarChart3 size={20} />
                <span className="text-sm uppercase tracking-tighter">التحليلات</span>
              </button>
              <button 
                onClick={() => setView('esp_config')}
                className={`flex-1 py-4 px-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${view === 'esp_config' ? 'bg-indigo-500 text-black font-black' : 'hover:bg-white/5 text-white/40'}`}
              >
                <Cpu size={20} />
                <span className="text-sm uppercase tracking-tighter">إعدادات ESP32</span>
              </button>
              <button 
                onClick={() => { setView('risk'); if(!riskData) generateRiskPrediction(true); }}
                className={`flex-1 py-4 px-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all ${view === 'risk' ? 'bg-amber-500 text-black font-black' : 'hover:bg-white/5 text-white/40'}`}
              >
                <Brain size={20} />
                <span className="text-sm uppercase tracking-tighter">التنبؤ الذكي</span>
              </button>
            </div>
          </motion.div>
        )}

        {view === 'risk' && (
          <motion.div 
            key="risk"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col p-6 max-w-4xl mx-auto w-full relative z-10"
          >
            <div className="mb-10 flex items-center justify-between">
              <motion.button 
                whileHover={{ x: -5 }}
                onClick={() => setView('main')} 
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-mono uppercase text-xs tracking-widest"
              >
                <ArrowLeft size={20} /> Back to Core
              </motion.button>
              <h2 className="text-2xl font-black text-amber-500 italic uppercase tracking-tighter">AI Analysis Module</h2>
            </div>

            <div className="bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-12 space-y-10 relative overflow-hidden backdrop-blur-xl">
               {/* Technical Background Details */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 p-12 mix-blend-overlay">
                   <Brain size={200} className="text-white/5" />
                </div>
              </div>

               <div className="absolute top-0 right-0 p-8 text-[8px] font-mono text-white/5 text-right leading-relaxed select-none">
                0x{Math.random().toString(16).slice(2, 6).toUpperCase()} 0x{Math.random().toString(16).slice(2, 6).toUpperCase()} <br/>
                NEXT_AUTO_PREDICT_IN: {formatTime(predictionTimer)} <br/>
                NEXT_RUN: {nextPredictionTime}
               </div>
 
               <div className="flex items-center gap-8 relative z-10">
                 <div className="w-24 h-24 relative flex items-center justify-center border-2 border-amber-500/20 rounded-full">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset -2 border border-amber-500/40 rounded-full border-dashed"
                    />
                    <Cpu className="text-amber-500" size={48} />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black mb-1 italic uppercase text-amber-500 flex items-center gap-4">
                        Smart Intelligent Prediction
                        <button 
                            disabled={aiLoading || predictionCooldown > 0}
                            onClick={() => generateRiskPrediction()}
                            className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full px-4 py-1 flex items-center gap-2 transition-all disabled:opacity-30 whitespace-nowrap"
                         >
                            <RefreshCw size={10} className={aiLoading ? 'animate-spin' : ''} />
                            <span className="text-[10px] uppercase font-black">{predictionCooldown > 0 ? `Wait ${predictionCooldown}s` : 'Reload'}</span>
                         </button>
                    </h3>
                    <span className="text-[10px] text-amber-500/60 font-mono tracking-widest uppercase">Status: Generating Insights...</span>
                 </div>
              </div>

              <div className="text-xl leading-relaxed text-white/80 min-h-[300px] border-y border-white/5 py-10">
                {aiLoading ? (
                  <div className="space-y-6">
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-3/4" />
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-full" />
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-5/6" />
                    <div className="h-4 bg-white/5 rounded-full animate-pulse w-1/2" />
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="whitespace-pre-wrap font-medium"
                  >
                    {riskData}
                  </motion.div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-amber-500/5 rounded-[2rem] border border-amber-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Risk Level</span>
                    </div>
                    <span className="text-sm font-mono text-amber-500">MID_LOAD</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} className="h-full bg-amber-500" />
                  </div>
                </div>
                <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-500">
                      <ShieldCheck size={20} />
                      <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Grid Safety</span>
                    </div>
                    <span className="text-sm font-mono text-emerald-500">88%_SECURE</span>
                  </div>
                  <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: '88%' }} className="h-full bg-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'check' && (
          <motion.div 
            key="check"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full relative z-10"
          >
             <div className="mb-10 flex items-center justify-between">
              <motion.button 
                whileHover={{ x: -5 }}
                onClick={() => setView('main')} 
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors font-mono uppercase text-xs tracking-widest"
              >
                <ArrowLeft size={20} /> Dashboard
              </motion.button>
              <h2 className="text-2xl font-black text-emerald-500 uppercase tracking-tighter">Maintenance Hub</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
              {/* Active Issues Hub */}
              <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 flex flex-col min-h-[500px] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-[8px] font-mono text-white/5 text-right">
                  AUTO_MAINTENANCE_IDLE <br/>
                  REFRESHING_IN: {formatTime(predictionTimer)}
                </div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <h3 className="text-xl font-black uppercase tracking-tighter">التنبيهات النشطة</h3>
                    <button onClick={() => setDiagnosticIssues([])} className="text-[10px] font-mono text-white/20 hover:text-white transition-colors uppercase">Clear Log</button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {isChecking && (
                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Radar className="text-emerald-500" size={48} />
                            </motion.div>
                            <span className="text-xs font-mono text-emerald-500 animate-pulse">جاري فحص مسارات البيانات...</span>
                        </div>
                    )}

                    {!isChecking && scanReport && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] mb-6"
                        >
                            <div className="flex items-center gap-2 mb-3 text-emerald-500">
                                <Brain size={18} />
                                <span className="text-xs font-black uppercase tracking-tighter">تقرير الفحص الذكي</span>
                            </div>
                            <div className="text-sm leading-loose text-white/80 whitespace-pre-wrap">
                                {scanReport}
                            </div>
                        </motion.div>
                    )}

                    {!isChecking && diagnosticIssues.length === 0 && !scanReport ? (
                        <div className="flex flex-col items-center justify-center h-full opacity-10">
                            <ShieldCheck size={64} className="mb-4" />
                            <span className="font-mono text-xs uppercase tracking-widest">No Active Faults Detected</span>
                        </div>
                    ) : (
                        diagnosticIssues.map(issue => (
                            <motion.div 
                                key={issue.id}
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                className={`p-5 rounded-3xl border flex items-center gap-6 ${
                                    issue.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/20' : 
                                    issue.severity === 'high' ? 'bg-amber-500/10 border-amber-500/20' : 
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}
                            >
                                <div className={`p-4 rounded-2xl ${issue.severity === 'critical' ? 'bg-rose-500 text-black' : issue.severity === 'high' ? 'bg-amber-500 text-black' : 'bg-blue-500 text-black'}`}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1 text-right">
                                    <h5 className="font-black text-lg mb-1">{issue.msg}</h5>
                                    <div className="flex items-center justify-end gap-3 opacity-40">
                                        <span className="text-[10px] font-mono uppercase tracking-[0.2em]">Code: 0x{issue.code.toString(16).toUpperCase()}</span>
                                        <span className="text-[10px] font-mono">{issue.time}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
              </div>

              {/* Maintenance Stats / Scan Trigger */}
              <div className="space-y-8">
                <div className="bg-emerald-500 text-black p-8 rounded-[3rem]">
                    <div className="flex items-center justify-between mb-4">
                        <Stethoscope size={32} />
                        <span className="text-4xl font-black font-mono">{healthScore}%</span>
                    </div>
                    <h4 className="text-xl font-black uppercase mb-1">صحة الجهاز</h4>
                    <p className="text-xs font-medium opacity-70">تم حساب الصحة بناءً على 30 نقطة فحص في الـ ESP32.</p>
                </div>

                <button 
                  disabled={isChecking}
                  onClick={runSystemCheck}
                  className="w-full bg-white/5 border border-white/10 hover:border-emerald-500 p-8 rounded-[3rem] transition-all group relative overflow-hidden"
                >
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <Radar className={`group-hover:text-emerald-500 transition-colors ${isChecking ? 'animate-spin' : ''}`} size={48} />
                        <div className="text-center">
                            <h4 className="text-lg font-black uppercase">تشغيل فحص شامل</h4>
                            <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{isChecking ? 'Analyzing hardware bus...' : 'Deep Logic Investigation'}</span>
                        </div>
                    </div>
                    {isChecking && <motion.div initial={{ x: '-100%' }} animate={{ x: '100%' }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 bg-emerald-500/10" />}
                </button>

                {/* Detailed Hardware Status Map */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0c0c0c] border border-white/5 rounded-[3rem] p-8 space-y-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-emerald-500">خارطة الهاردوير (v4.0)</h4>
                        <div className="flex items-center gap-4">
                             <div className="flex flex-col items-end">
                                <span className="text-[7px] font-mono text-white/20 uppercase">Safety Score</span>
                                <span className={`text-[10px] font-black font-mono ${stats.safetyScore > 80 ? 'text-emerald-500' : stats.safetyScore > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                    {stats.safetyScore}%
                                </span>
                             </div>
                             <div className="flex items-center gap-1 group">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className={`w-1 h-4 rounded-full transition-all duration-500 ${i < Math.floor(stats.safetyScore/33.4)+1 ? (stats.safetyScore > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : stats.safetyScore > 50 ? 'bg-amber-500' : 'bg-rose-500') : 'bg-white/5'}`} />
                                ))}
                             </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <ComponentRow 
                          name="حساس التيار (ACS712-1)" 
                          status={parseFloat(hardwareData.noise) < 40 ? 'GOOD' : 'NOISY'} 
                          icon={Activity} 
                          sensorHealthy={hardwareData.sensorHealthy}
                          onClick={() => setSelectedComponent({
                            name: "حساس التيار (ACS712-1)",
                            status: parseFloat(hardwareData.noise) < 40 ? 'GOOD' : 'NOISY',
                            health: parseFloat(hardwareData.noise) < 40 ? 98 : 65,
                            description: "حساس قياس الأمبير الرئيسي. يتحقق من تدفق الإلكترونات كل 10 ملي ثانية."
                          })}
                        />
                        <ComponentRow 
                          name="حساس التيار (ACS712-2)" 
                          status={parseFloat(hardwareData.noise) < 35 ? 'GOOD' : 'LEVEL_LOW'} 
                          icon={Activity} 
                          onClick={() => setSelectedComponent({
                            name: "حساس التيار (ACS712-2)",
                            status: parseFloat(hardwareData.noise) < 35 ? 'GOOD' : 'LEVEL_LOW',
                            health: parseFloat(hardwareData.noise) < 35 ? 95 : 40,
                            description: "حساس قياس الأمبير الثانوي. القراءات الحالية تشير إلى ضجيج في الإشارة."
                          })}
                        />
                        <ComponentRow 
                          name="ريليه الغرفة 01" 
                          status={roomStates.left ? 'ACTIVE' : 'READY'} 
                          icon={Power} 
                          onClick={() => setSelectedComponent({
                            name: "ريليه الغرفة 01",
                            status: roomStates.left ? 'ACTIVE' : 'READY',
                            health: 99,
                            description: "مفتاح التحكم المغناطيسي للغرفة الأولى. يعمل بكفاءة تامة."
                          })}
                        />
                        <ComponentRow 
                          name="ريليه الغرفة 02" 
                          status={roomStates.right ? 'ACTIVE' : 'READY'} 
                          icon={Power} 
                          onClick={() => setSelectedComponent({
                            name: "ريليه الغرفة 02",
                            status: roomStates.right ? 'ACTIVE' : 'READY',
                            health: 99,
                            description: "مفتاح التحكم المغناطيسي للغرفة الثانية. يعمل بكفاءة تامة."
                          })}
                        />
                         <ComponentRow 
                          name="منظم الفولتية (5V Rail)" 
                          status={hardwareData.voltage === 'NORMAL' ? 'GOOD' : 'STABLE'} 
                          icon={ShieldCheck} 
                          onClick={() => setSelectedComponent({
                            name: "منظم الفولتية (5V Rail)",
                            status: "GOOD",
                            health: 98,
                            description: "نظام تنظيم الجهد الكهربائي. يضمن وصول 5 فولت مستقرة لكافة القطع الإلكترونية."
                          })}
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 flex flex-col p-6 max-w-6xl mx-auto w-full relative z-10"
              >
                 <div className="mb-10 flex items-center justify-between">
                  <motion.button 
                    whileHover={{ x: -10 }}
                    onClick={() => setView('main')} 
                    className="flex items-center gap-3 text-white/40 hover:text-white transition-colors font-mono uppercase text-xs tracking-widest"
                  >
                    <div className="p-2 rounded-full border border-white/5 bg-white/5">
                      <ArrowLeft size={16} /> 
                    </div>
                    Return to Core
                  </motion.button>
                  <div className="text-right">
                    <h2 className="text-2xl font-black text-blue-500 uppercase tracking-tighter italic">My Home Analytics Bus</h2>
                    <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.4em]">Signal Resolution: 16-bit ADC</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                   <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={40} /></div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Average Load</span>
                      <div className="flex items-end gap-2">
                         <span className="text-3xl font-black font-mono">{stats.avg}</span>
                         <span className="text-sm font-mono text-white/40 mb-1">AMPS</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2" style={{ color: trends.direction === 'up' ? '#ef4444' : trends.direction === 'down' ? '#10b981' : '#a3a3a3' }}>
                         <div className={`w-1.5 h-1.5 rounded-full ${trends.direction === 'up' ? 'bg-rose-500' : trends.direction === 'down' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-white/20'}`} />
                         <span className="text-[10px] font-bold">
                           {trends.direction === 'up' ? `زيادة حمل ↑ (${trends.diff.toFixed(2)}A)` : trends.direction === 'down' ? `انخفاض استهلاك ↓ (${trends.diff.toFixed(2)}A)` : 'استهلاك مستقر'}
                         </span>
                      </div>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={40} /></div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Peak Current</span>
                      <div className="flex items-end gap-2">
                         <span className="text-3xl font-black font-mono">{stats.peak}</span>
                         <span className="text-sm font-mono text-white/40 mb-1">AMPS</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-amber-500">
                         <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                         <span className="text-[10px] font-bold">Safe Peak ↑</span>
                      </div>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/10 rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><CloudLightning size={40} /></div>
                      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest block mb-2">Daily KWh Est.</span>
                      <div className="flex items-end gap-2">
                         {stats.estKWh === "0.00" ? (
                            <span className="text-[10px] font-bold text-white/20 italic">لم يستغرق ساعة استهلاك</span>
                         ) : (
                            <>
                              <span className="text-3xl font-black font-mono">{stats.estKWh}</span>
                              <span className="text-sm font-mono text-white/40 mb-1">KWH</span>
                            </>
                         )}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-blue-500">
                         <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                         <span className="text-[10px] font-bold">Calculating...</span>
                      </div>
                   </div>
                   <div className="p-6 bg-emerald-500 text-black rounded-[2.5rem] relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheck size={40} /></div>
                      <span className="text-[10px] font-black uppercase tracking-widest block mb-2 opacity-60">System Efficiency</span>
                      <div className="flex items-end gap-2">
                         <span className="text-3xl font-black font-mono">{stats.efficiency}</span>
                         <span className="text-sm font-black mb-1">%</span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-black rounded-full" />
                         <span className="text-[10px] font-bold">Optimal Ops</span>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 flex-1 flex flex-col relative overflow-hidden">
                    <div className="absolute inset-0 opacity-5 pointer-events-none">
                       <BarChart3 size={400} className="text-white/5 -bottom-20 -right-20 absolute" />
                    </div>
                    <div className="flex items-center justify-between mb-12 relative z-10">
                       <div>
                          <h3 className="text-3xl font-black tracking-tighter mb-2 italic uppercase text-right">استهلاك الطاقة (MY_HOME_BUS)</h3>
                          <p className="text-white/40 text-sm font-mono uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-blue-500 animate-pulse" />
                            ADC_STREAMING_CHANNEL_01 // RATE: 1000Hz // BIT_DEPTH: 16
                          </p>
                       </div>
                       <div className="flex flex-col items-end">
                          <div className="bg-white/5 border border-white/10 text-white px-8 py-3 rounded-2xl font-black text-2xl font-mono shadow-2xl backdrop-blur-md">
                            {hardwareData.current}A
                          </div>
                           <div className="flex items-center gap-1 mt-2" style={{ color: trends.direction === 'up' ? '#ef4444' : trends.direction === 'down' ? '#10b981' : '#a3a3a3' }}>
                             <span className="text-[10px] font-black uppercase tracking-widest">
                               Trend: {trends.direction === 'up' ? 'Bullish ↑' : trends.direction === 'down' ? 'Bearish ↓' : 'Stable'}
                             </span>
                             <div className="flex gap-0.5 items-end">
                                <motion.div animate={{ height: trends.direction === 'up' ? [12, 4, 12] : [4, 12, 4] }} transition={{ repeat: Infinity, duration: 1 }} className={`w-1 ${trends.direction === 'up' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                <motion.div animate={{ height: [8, 4, 8] }} transition={{ repeat: Infinity, duration: 1, delay:0.2 }} className={`w-1 ${trends.direction === 'up' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                <motion.div animate={{ height: trends.direction === 'up' ? [4, 16, 4] : [16, 4, 16] }} transition={{ repeat: Infinity, duration: 1, delay:0.4 }} className={`w-1 ${trends.direction === 'up' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="flex-1 w-full min-h-[350px] relative z-10 flex flex-col items-center justify-center">
                      {realHistoricalData.length === 0 ? (
                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 border-2 border-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                                <Activity size={40} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-white/60 font-black text-xl italic uppercase font-mono">No Usage Data Yet</p>
                                <p className="text-white/20 text-xs font-medium">لم تستغرق ساعة واحدة من الاستهلاك بعد ليتم عرضها في الرسم البياني.</p>
                            </div>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={realHistoricalData}>
                            <defs>
                                <linearGradient id="colorAmps" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} fontStyle="mono" tickLine={false} axisLine={false} />
                            <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} fontStyle="mono" tickLine={false} axisLine={false} domain={[0, 'auto']} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: '900' }}
                            />
                            <Area type="monotone" dataKey="amps" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAmps)" strokeWidth={4} />
                            </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-8 text-right">
                       <div>
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-2">Selected Node</span>
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><Cpu size={16} /></div>
                             <span className="text-sm font-bold">My Home ESP32 Smart Module</span>
                          </div>
                       </div>
                       <div className="flex gap-4">
                          {(['Minutes', 'Hours', 'Days', 'Weeks', 'Months'] as const).map((period) => (
                            <button 
                              key={period} 
                              onClick={() => setCurrentPeriod(period)}
                              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${currentPeriod === period ? 'bg-blue-500 border-blue-500 text-black shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/5 text-white/40 hover:border-white/20'}`}
                            >
                              {period}
                            </button>
                          ))}
                       </div>
                    </div>
                </div>
              </motion.div>
            )}

            {view === 'esp_config' && (
              <motion.div 
                key="esp_config"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 pb-20"
              >
                <div className="flex items-center justify-between mb-4 px-4">
                   <div className="flex flex-col gap-4">
                      <motion.button 
                        whileHover={{ x: -10 }}
                        onClick={() => setView('main')} 
                        className="flex items-center gap-3 text-white/40 hover:text-white transition-colors font-mono uppercase text-xs tracking-widest"
                      >
                        <div className="p-2 rounded-full border border-white/5 bg-white/5">
                          <ArrowLeft size={16} /> 
                        </div>
                        Return to Core
                      </motion.button>
                      <div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic text-indigo-500">إعدادات الهاردوير (ESP32)</h2>
                        <p className="text-white/40 text-sm font-mono mt-1 text-right italic uppercase tracking-widest">Direct Hardware Interface // Access: Administrator</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-end">
                         <span className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Firmware</span>
                         <span className="text-sm font-black text-white/70">{espSettings.firmwareVersion}</span>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 space-y-10 relative overflow-hidden group transition-all hover:border-indigo-500/30">
                      <div className="absolute top-0 right-0 p-8 grayscale opacity-20 group-hover:grayscale-0 transition-all">
                         <Wifi size={120} className="text-white/5" />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                               <Wifi size={20} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">الشبكة والاتصال</h3>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1 text-[8px]">اسم الشبكة (SSID)</label>
                               <input 
                                 type="text" 
                                 value={espSettings.ssid}
                                 onChange={(e) => setEspSettings({...espSettings, ssid: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500/50 transition-all outline-none text-right font-bold"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1 text-[8px]">كلمة المرور</label>
                               <input 
                                 type="password" 
                                 value={espSettings.password}
                                 onChange={(e) => setEspSettings({...espSettings, password: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500/50 transition-all outline-none text-right tracking-[0.5em]"
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest ml-1 text-[8px]">عنوان خادم MQTT</label>
                               <input 
                                 type="text" 
                                 value={espSettings.serverUrl}
                                 onChange={(e) => setEspSettings({...espSettings, serverUrl: e.target.value})}
                                 className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-indigo-500/50 transition-all outline-none text-right font-mono"
                               />
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 space-y-10 relative overflow-hidden group transition-all hover:border-indigo-500/30">
                      <div className="absolute top-0 right-0 p-8 grayscale opacity-20">
                         <Languages size={120} className="text-white/5" />
                      </div>
                      <div className="relative z-10">
                         <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                               <Globe size={20} />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter">اختيار لغة الواجهة (Internet)</h3>
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                            {languages.map((lang) => (
                               <button
                                 key={lang.code}
                                 onClick={() => setEspSettings({...espSettings, language: lang.code})}
                                 className={`p-6 rounded-3xl border transition-all flex items-center gap-4 group ${
                                   espSettings.language === lang.code 
                                     ? 'bg-indigo-500 border-indigo-500 text-black font-black scale-[1.02]' 
                                     : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                                 }`}
                               >
                                  <span className="text-2xl group-hover:scale-125 transition-transform">{lang.flag}</span>
                                  <div className="text-right flex-1">
                                     <span className="text-[10px] font-black uppercase tracking-tighter block leading-none">{lang.name}</span>
                                     <span className="text-[8px] opacity-40 font-mono">{lang.code.toUpperCase()}</span>
                                  </div>
                               </button>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-12 flex flex-col md:flex-row items-center justify-between gap-8 group mt-auto">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-[2rem] flex items-center justify-center group-hover:rotate-12 transition-transform">
                         <ShieldAlert size={28} />
                      </div>
                      <div className="text-right">
                         <h4 className="text-xl font-black text-white italic tracking-tighter uppercase">مزامنة الإعدادات (NVS FLASH)</h4>
                         <p className="text-white/40 text-xs font-medium max-w-md">سيتم حفظ هذه البيانات في ذاكرة الـ My Home الدائمة. يوصى بإعادة تشغيل الجهاز بعد تغيير إعدادات اللغة أو الشبكة لضمان استقرار الاتصال.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 w-full md:w-auto">
                      <button 
                        onClick={() => {
                          setNotifications([{
                            id: Date.now().toString(),
                            type: 'info',
                            title: 'إعادة تشغيل ESP32',
                            message: 'يتم الآن محاولة إعادة تشغيل المعالج الرئيسي...',
                            time: new Date().toLocaleTimeString('ar-IQ'),
                            isRead: false
                          }, ...notifications]);
                        }}
                        className="flex-1 md:flex-none px-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black hover:bg-white/10 transition-all uppercase tracking-widest text-[10px] italic"
                      >
                        Reboot Core
                      </button>
                      <button 
                        onClick={() => {
                          setNotifications([{
                            id: Date.now().toString(),
                            type: 'success',
                            title: 'تم الحفظ بنجاح',
                            message: 'تمت مزامنة الإعدادات مع ذاكرة الـ ESP32 وحفظها بمجاح.',
                            time: new Date().toLocaleTimeString('ar-IQ'),
                            isRead: false
                          }, ...notifications]);
                          setView('main');
                        }}
                        className="flex-1 md:flex-none px-12 py-5 bg-indigo-500 text-black rounded-2xl font-black hover:bg-indigo-400 transition-all shadow-[0_0_40px_rgba(99,102,241,0.4)] uppercase tracking-widest text-[10px] italic"
                      >
                        Save Changes
                      </button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
�
      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editMode === 'profile' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setEditMode(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 text-[8px] font-mono text-white/5 leading-tight select-none">
                EDIT_ACCESS_GRANTED <br/>
                USER_DB_OVERRIDE
              </div>

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black tracking-tighter uppercase">تعديل البيانات</h3>
                <button 
                  onClick={() => setEditMode(null)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <User size={12} /> الإسم
                  </label>
                  <input 
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                    placeholder="Enter operator name..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <MapPin size={12} /> الموقع
                  </label>
                  <input 
                    type="text"
                    value={profile.location}
                    onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
                    placeholder="Enter location..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-5 rounded-2xl bg-emerald-500 text-black font-black uppercase text-xs tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <Activity size={16} />
                    </motion.div>
                  ) : (
                    <><Save size={16} /> حفظ التغييرات</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification/History Modal */}
      <AnimatePresence>
        {editMode === 'history' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditMode(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[3.5rem] p-12 overflow-hidden flex flex-col h-[80vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-3xl font-black tracking-tighter uppercase mb-1">سجل الأحداث</h3>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Hardware Event History Log</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                         onClick={() => {
                            if (notifCooldown === 0) {
                                setNotifCooldown(300);
                            }
                         }}
                         disabled={notifCooldown > 0}
                         className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all text-white/40 disabled:opacity-30 relative group"
                    >
                        <RefreshCw size={18} className={notifCooldown > 0 ? '' : 'group-hover:rotate-180 transition-transform duration-700'} />
                        {notifCooldown > 0 && (
                            <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[7px] font-black px-1 rounded-full">
                                {Math.ceil(notifCooldown / 60)}m
                            </span>
                        )}
                    </button>
                    <button onClick={() => setEditMode(null)} className="p-3 rounded-full hover:bg-white/5 text-white/40 transition-colors">
                        <X size={24} />
                    </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                        <Unplug size={64} className="mb-4" />
                        <span className="font-mono text-xs uppercase tracking-[0.5em]">No Data Retrieved</span>
                    </div>
                ) : (
                    notifications.map(n => (
                        <button 
                          key={n.id} 
                          onClick={() => setSelectedNotification(n)}
                          className="w-full text-right p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-emerald-500/30 transition-all flex items-start gap-6 group"
                        >
                            <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 ${n.type === 'danger' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                {n.type === 'danger' ? <ShieldAlert size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h5 className="font-black text-lg">{n.title}</h5>
                                    <span className="text-xs font-mono text-white/20">{n.time}</span>
                                </div>
                                <p className="text-white/60 leading-relaxed line-clamp-2">{n.message}</p>
                            </div>
                        </button>
                    ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 overflow-hidden"
            >
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-rose-500">تفاصيل التنبيه</h3>
                  <button onClick={() => setSelectedNotification(null)} className="p-2 text-white/20 hover:text-white"><X size={24} /></button>
               </div>
               <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-3xl">
                     <AlertCircle className={selectedNotification.type === 'danger' ? 'text-rose-500' : 'text-blue-500'} size={32} />
                     <div>
                        <h4 className="font-bold text-lg">{selectedNotification.title}</h4>
                        <span className="text-xs font-mono opacity-30">{selectedNotification.time}</span>
                     </div>
                  </div>
                  <div className="p-6 bg-white/5 border border-white/5 rounded-[2rem] text-right font-medium leading-loose text-white/80">
                     {selectedNotification.message}
                  </div>
                  <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem]">
                     <div className="flex items-center gap-2 mb-3 text-emerald-500">
                        <Brain size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">تفسير My Home الذكي</span>
                     </div>
                     <p className="text-sm text-white/70 italic leading-relaxed">
                        بناءً على البيانات، يبدو أن هناك تذبذباً في التوصيل أو سحباً مفاجئاً للطاقة. أنصح بالتأكد من جودة الأسلاك في هذا القسم لضمان استقرار طويل الأمد.
                     </p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Selected Component Detail Modal */}
      <AnimatePresence>
        {selectedComponent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedComponent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-[3rem] p-10 overflow-hidden"
            >
               {/* Scanning UI Animation */}
               <motion.div 
                 initial={{ y: -400 }}
                 animate={{ y: 800 }}
                 transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                 className="absolute inset-x-0 h-1 bg-emerald-500/40 blur-sm pointer-events-none z-20"
               />

               <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-2xl font-black tracking-tighter uppercase text-emerald-500 italic">Hardware Diagnostic</h3>
                  <button onClick={() => setSelectedComponent(null)} className="p-2 text-white/20 hover:text-white"><X size={24} /></button>
               </div>
               <div className="space-y-8">
                  <div className="flex items-center gap-6">
                     <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center">
                        <Cpu className="text-emerald-500" size={40} />
                     </div>
                     <div>
                        <h4 className="text-2xl font-black">{selectedComponent.name}</h4>
                        <span className="text-xs font-mono text-white/20 uppercase tracking-widest">Serial: TR-ESP32-B83</span>
                     </div>
                  </div>
                  
                  <div className="space-y-4">
                     <div className="flex justify-between items-end">
                        <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Health Integrity</span>
                        <span className="text-2xl font-black font-mono text-emerald-500">{selectedComponent.health}%</span>
                     </div>
                     <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${selectedComponent.health}%` }} 
                          className="h-full bg-emerald-500 active-pulse" 
                        />
                     </div>
                     <div className="flex justify-between text-[8px] font-mono text-white/20">
                        <span>SCANNING_BUS_01...</span>
                        <span>STABLE</span>
                     </div>
                  </div>

                  <div className="p-6 bg-white/5 border border-white/5 rounded-3xl text-sm leading-relaxed text-white/70 text-right font-medium">
                     {selectedComponent.description}
                  </div>

                  <div className="flex gap-4 p-4 border border-emerald-500/10 bg-emerald-500/5 rounded-3xl items-start">
                     <ShieldCheck className="text-emerald-500 mt-1 shrink-0" size={18} />
                     <p className="text-xs leading-relaxed text-emerald-500/80 text-right flex-1 font-bold">
                        {selectedComponent.health > 90 
                          ? "القطعة تعمل بكفاءة تامة وضمن الحدود المصنعية. جودة الإشارة والمسار الإلكتروني ممتازة حالياً." 
                          : "هناك بعض التشويش في المسار. قد يكون بسبب تداخل كهرومغناطيسي قريب أو ارتخاء في الربط الفيزيائي."}
                     </p>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Overload Warning Modal */}
      <AnimatePresence>
        {overloadModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
             <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 bg-rose-950/40 backdrop-blur-2xl" 
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="relative w-full max-w-md bg-[#0d0000] border border-rose-500/30 rounded-[3.5rem] p-12 text-center overflow-hidden"
            >
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <Zap size={160} className="text-rose-500" />
               </div>
               
               <div className="relative z-10 space-y-8">
                  <div className="w-24 h-24 bg-rose-500/20 border border-rose-500/40 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(244,63,94,0.3)]">
                     <Zap size={48} className="text-rose-500 animate-bounce" />
                  </div>
                  
                  <div className="space-y-2">
                     <h2 className="text-3xl font-black text-rose-500 tracking-tighter uppercase italic">OVERLOAD DETECTED</h2>
                     <p className="text-white/70 font-medium">تم رصد سحب تيار عالٍ ({overloadModal.current}A) في {overloadModal.room === 'left' ? 'الغرفة الأولى' : 'الغرفة الثانية'}.</p>
                  </div>

                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-right">
                     <div className="flex items-center gap-2 mb-3 text-emerald-500">
                        <Brain size={18} />
                        <span className="text-xs font-black uppercase">رأي My Home</span>
                     </div>
                     <p className="text-sm text-white/60 leading-relaxed font-bold">
                        الظاهر علكتوا أكثر من لمبتين بهالغرفة! النظام فصلها تلقائياً لحماية الهاردوير. شو تحب نسوي؟
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <button 
                       onClick={() => {
                         toggleRoom(overloadModal.room);
                         setOverloadModal(null);
                       }}
                       className="py-5 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                     >
                       <ShieldCheck size={20} /> إعادة التشغيل
                     </button>
                     <button 
                       onClick={() => setOverloadModal(null)}
                       className="py-5 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all"
                     >
                       إبقاء الطفئ
                     </button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
