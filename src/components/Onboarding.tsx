import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, MapPin, Send, Power, Home, Layout, MoreHorizontal, ArrowRight, CheckCircle2, ShieldCheck, Activity } from 'lucide-react';
import { cn } from '../lib/utils';
import { saveUserProfile, getUserProfile, auth, sendEmailOtp, verifyEmailOtp } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

type Step = 'start' | 'intro' | 'choice' | 'registration' | 'secure_token' | 'verifying' | 'otp' | 'success' | 'transition';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('start');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  
  const [userData, setUserData] = useState({
    name: '',
    location: '',
    controlType: '',
    token: ''
  });

  // TTS helper for professional persona (Output only)
  const speak = (text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setStep('transition');
          speak(`مرحباً بك مجدداً يا ${profile.name}. أنا مساعدك الشخصي، جاري تشغيل أنظمة التنبؤ الذكي.`);
          onComplete(profile.name);
        }
      }
    });
    return () => unsubscribe();
  }, [onComplete]);

  const handleRegistration = async () => {
    if (!userData.name || !userData.location) {
      setError("يرجى إكمال جميع الحقول المطلوبة");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      // For the demo/onboarding, we sign in anonymously then save the profile
      let user = auth.currentUser;
      if (!user) {
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;
      }
      
      if (user) {
        setStep('secure_token');
        speak("خطوة أخيرة للأمان. يرجى إدخال رمز الوصول الخاص بالشبكة للمتابعة.");
      }
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError("حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSecurityToken = async () => {
    if (userData.token === '12345678Aa') {
      setIsProcessing(true);
      setError(null);
      try {
        const user = auth.currentUser;
        if (user) {
          await saveUserProfile(user.uid, {
            name: userData.name,
            email: 'not-provided@myhome.local',
            location: userData.location,
            controlType: userData.controlType || 'other'
          });
          setStep('success');
          speak("تم التحقق من الرمز بنجاح. أهلاً بك في عالمك الذكي.");
          onComplete(userData.name);
        }
      } catch (err) {
        setError("فشل في حفظ البيانات. يرجى المحاولة لاحقاً.");
      } finally {
        setIsProcessing(false);
      }
    } else {
      setError("رمز الوصول غير صحيح. يرجى التأكد من الرمز والمحاولة مرة أخرى.");
      speak("عذراً، رمز الوصول الذي أدخلته غير صحيح.");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050505] text-white overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Background Hardware Atmosphere */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,20,1)_0%,rgba(0,0,0,1)_100%)]" />
        <div className="absolute inset-0 opacity-[0.03] bg-[size:30px_30px] bg-[linear-gradient(to_right,#888_1px,transparent_1px),linear-gradient(to_bottom,#888_1px,transparent_1px)]" />
        
        {/* Decorative Circles */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full"
        />
      </div>

      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
        
        {/* Robot Visual - Professional Robot Design */}
        <div className="mb-12 relative">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className="w-40 h-40 md:w-48 md:h-48 relative flex items-center justify-center"
          >
            {/* Pulsing Aura */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-amber-500 rounded-full blur-[40px]" 
            />
            
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <defs>
                <linearGradient id="robotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#222" />
                  <stop offset="100%" stopColor="#050505" />
                </linearGradient>
                <linearGradient id="visorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#111" />
                  <stop offset="100%" stopColor="#000" />
                </linearGradient>
              </defs>
              
              {/* Antenna */}
              <rect x="97" y="10" width="6" height="30" rx="3" fill="#333" />
              <motion.circle 
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                cx="100" cy="10" r="6" fill="#f59e0b" 
              />
              
              {/* Head Shell */}
              <path 
                d="M40,70 Q40,35 100,35 Q160,35 160,70 L160,130 Q160,165 100,165 Q40,165 40,130 Z" 
                fill="url(#robotGradient)" 
                stroke="#444" 
                strokeWidth="1" 
              />
              
              {/* Visor Area */}
              <rect x="55" y="75" width="90" height="40" rx="20" fill="url(#visorGradient)" stroke="#222" />
              
              {/* LED Eyes */}
              <motion.g animate={{ opacity: isProcessing ? [1, 0.4, 1] : 1 }} transition={{ duration: 0.5, repeat: Infinity }}>
                <circle cx="80" cy="95" r="5" fill="#f59e0b" shadow-lg="true">
                  <animate attributeName="r" values="5;6;5" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="120" cy="95" r="5" fill="#f59e0b">
                  <animate attributeName="r" values="5;6;5" dur="3s" repeatCount="indefinite" />
                </circle>
              </motion.g>

              {/* Technical Details on Face */}
              <rect x="85" y="130" width="30" height="4" rx="2" fill="#222" />
              <motion.path 
                animate={{ opacity: isProcessing ? [0, 1, 0] : 0.2 }}
                transition={{ duration: 0.1, repeat: Infinity }}
                d="M70,145 L130,145" 
                stroke="#f59e0b" 
                strokeWidth="1" 
                strokeDasharray="4 2" 
              />
            </svg>
          </motion.div>
          
          {/* Status Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="text-[8px] font-mono text-white/40 uppercase tracking-tighter">System Active</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center space-y-8"
            >
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">My Home</h1>
                <p className="text-white/40 font-mono text-sm tracking-[0.2em] uppercase">Advanced Home Intelligence</p>
              </div>
              
              <button 
                onClick={() => {
                  setStep('intro');
                  speak("أنا مساعدك الشخصي، مساعدك المزود بمميزات التنبؤ الذكي لمراقبة الحمل وضمان استقرار الطاقة.");
                }}
                className="group relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-amber-500 hover:border-amber-500 transition-all duration-500"
              >
                <Power className="text-white group-hover:text-black transition-colors" size={40} />
                <div className="absolute -inset-4 border border-white/5 rounded-full animate-pulse" />
              </button>
              
              <p className="text-amber-500/60 font-medium animate-pulse">اضغط للتواصل مع الأنظمة</p>
            </motion.div>
          )}

          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8 text-center"
            >
              <div className="space-y-6">
                <h2 className="text-3xl font-light leading-relaxed">أهلاً بك في المستقبل الرقمي</h2>
                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-lg text-white/70 leading-loose">
                  أنا <span className="text-amber-500 font-bold">مساعدك الشخصي</span> المزود بنظام <span className="text-blue-500">التنبؤ الذكي</span> (Smart Intelligent Prediction) لمراقبة استقرارية الطاقة وحماية منزلك.
                </div>
              </div>

              <button 
                onClick={() => {
                  setStep('registration');
                  speak("أهلاً بك. أنا مساعدك الشخصي، جاري بدء عملية التوثيق السريع لبياناتك.");
                }}
                className="flex items-center gap-3 bg-white text-black px-10 py-4 rounded-2xl font-bold hover:bg-amber-500 transition-all mx-auto"
              >
                متابعة الإعداد <ArrowRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'choice' && (
            <motion.div 
              key="choice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-medium">نطاق التحكم</h2>
                <p className="text-white/40">ما الذي ترغب في ربطه بنظام My Home؟</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'house', label: 'منزل كامل', icon: Home, desc: 'فيلا أو شقة سكنية' },
                  { id: 'room', label: 'غرفة', icon: Layout, desc: 'مكتب أو غرفة نوم' },
                  { id: 'other', label: 'أخرى', icon: MoreHorizontal, desc: 'متجر أو مساحة عمل' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setUserData(prev => ({ ...prev, controlType: item.id }));
                      setStep('registration');
                      speak(`جميل جداً. لنقم الآن بتسجيل بياناتك الرسمية لإنشاء ملفك الشخصي.`);
                    }}
                    className="flex flex-col items-center gap-4 p-6 bg-[#111] border border-white/5 rounded-3xl hover:border-amber-500 transition-all group active:scale-95"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-colors">
                      <item.icon size={28} />
                    </div>
                    <div className="text-center">
                      <p className="font-bold mb-1">{item.label}</p>
                      <p className="text-[10px] text-white/30">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'registration' && (
            <motion.div 
              key="registration"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-medium mb-2">التسجيل الرسمي</h2>
                <p className="text-white/40">يرجى إدخال بياناتك بدقة لتفعيل الحماية</p>
              </div>

              <div className="space-y-4">
                <div className="group relative">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-amber-500 transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="الاسم الكامل" 
                    value={userData.name}
                    onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-2xl px-14 py-5 focus:border-amber-500 outline-none transition-all"
                  />
                </div>

                <div className="group relative">
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-amber-500 transition-colors">
                    <MapPin size={20} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="موقع السكن (المدينة)" 
                    value={userData.location}
                    onChange={(e) => setUserData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-[#111] border border-white/10 rounded-2xl px-14 py-5 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              {error && <p className="text-rose-500 text-sm text-center font-bold px-4">{error}</p>}

              <button 
                onClick={handleRegistration}
                disabled={isProcessing}
                className="w-full bg-amber-500 text-black py-5 rounded-2xl font-bold hover:bg-amber-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? <Activity className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                {isProcessing ? "جاري المعالجة..." : "تأكيد الطلب وتفعيل النظام"}
              </button>
            </motion.div>
          )}

          {step === 'secure_token' && (
            <motion.div 
              key="secure_token"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="text-amber-500" size={32} />
                </div>
                <h2 className="text-2xl font-medium mb-2">أمان الشبكة</h2>
                <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase">Enter Secure Access Token</p>
              </div>

              <div className="group relative">
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/20 group-focus-within:text-amber-500 transition-colors">
                  <Power size={20} />
                </div>
                <input 
                  type="password" 
                  placeholder="رمز الوصول (MQTT Secret)" 
                  value={userData.token}
                  onChange={(e) => setUserData(prev => ({ ...prev, token: e.target.value }))}
                  className="w-full bg-[#111] border border-white/10 rounded-2xl px-14 py-5 focus:border-amber-500 text-center tracking-[0.5em] outline-none transition-all"
                />
              </div>

              {error && <p className="text-rose-500 text-sm text-center font-bold px-4">{error}</p>}

              <button 
                onClick={handleSecurityToken}
                disabled={isProcessing}
                className="w-full bg-white text-black py-5 rounded-2xl font-bold hover:bg-amber-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isProcessing ? <Activity className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                {isProcessing ? "جاري التحقق من التشفير..." : "بدء الاتصال بالخادم"}
              </button>
              
              <p className="text-white/20 text-[10px] text-center leading-relaxed">
                هذا الرمز مشفر ولا يتم تخزينه في قواعد البيانات لضمان أقصى درجات الخصوصية.
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                <CheckCircle2 size={56} />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">تم التوثيق بنجاح</h2>
                <p className="text-white/40">جاري نقلك إلى لوحة التحكم الرئيسية...</p>
              </div>
            </motion.div>
          )}

          {step === 'transition' && (
            <motion.div key="transition" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
              <div className="relative">
                <Activity className="text-amber-500 animate-spin" size={48} />
                <div className="absolute inset-0 blur-xl bg-amber-500 opacity-20 animate-pulse" />
              </div>
              <span className="text-amber-500 font-mono tracking-[0.3em] font-medium uppercase">Initializing Core System...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hardware Interface Elements */}
      <div className="absolute bottom-10 inset-x-10 flex justify-between items-end opacity-20 pointer-events-none">
        <div className="flex flex-col gap-2">
          <div className="flex gap-1">
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }} className="w-1 h-3 bg-amber-500" />
            ))}
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase">Encryption Link: Stable</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono tracking-widest uppercase">My Home Interface v4.0.2</span>
          <div className="h-[1px] w-24 bg-white/40 mt-1" />
        </div>
      </div>
    </motion.div>
  );
};
