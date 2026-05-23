import { useState, useEffect, useRef } from 'react';
import { useNotifiche } from '../../context/NotificheContext';

const KEYFRAMES = `
@keyframes tama-bounce {
  0%,100% { transform: translateY(0) scale(1); }
  45% { transform: translateY(-10px) scale(1.06); }
}
@keyframes tama-float {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes tama-think {
  0%,100% { transform: rotate(0deg); }
  30% { transform: rotate(-7deg); }
  70% { transform: rotate(7deg); }
}
@keyframes tama-wiggle {
  0%,100% { transform: rotate(0deg); }
  20% { transform: rotate(-12deg); }
  50% { transform: rotate(12deg); }
  80% { transform: rotate(-8deg); }
}
@keyframes tama-shake {
  0%,100% { transform: translateX(0); }
  20% { transform: translateX(-5px) rotate(-3deg); }
  40% { transform: translateX(5px) rotate(3deg); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
@keyframes tama-celebrate {
  0%,100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.25) rotate(-12deg); }
  50% { transform: scale(1.25) rotate(12deg); }
  75% { transform: scale(1.15) rotate(-6deg); }
}
@keyframes tama-sparkle {
  0%,100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
`;

function getStato(tasks, emails) {
  if (tasks === 0 && emails === 0) return 'felice';
  if (tasks > 10 || (tasks > 5 && emails > 5)) return 'sopraffatto';
  if (tasks > 5) return 'stressato';
  if (emails > 3) return 'indaffarato';
  if (tasks > 0) return 'pensieroso';
  return 'sereno';
}

// ── Facce SVG ──────────────────────────────────────────────────────────────

function FaceHappy() {
  return <>
    {/* ^^ eyes */}
    <path d="M16 26 Q20 21 24 26" stroke="#14532d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M36 26 Q40 21 44 26" stroke="#14532d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* big smile */}
    <path d="M15 38 Q30 52 45 38" stroke="#14532d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* cheeks */}
    <ellipse cx="11" cy="34" rx="5" ry="3.5" fill="#fda4af" opacity="0.55"/>
    <ellipse cx="49" cy="34" rx="5" ry="3.5" fill="#fda4af" opacity="0.55"/>
    {/* sparkles */}
    <g style={{animation:'tama-sparkle 0.7s ease-in-out infinite'}}>
      <text x="4"  y="14" fontSize="9" fill="#fbbf24">✦</text>
      <text x="46" y="10" fontSize="7" fill="#fbbf24">✦</text>
    </g>
  </>;
}

function FaceSereno() {
  return <>
    <circle cx="22" cy="26" r="3.5" fill="#1e3a8a"/>
    <circle cx="38" cy="26" r="3.5" fill="#1e3a8a"/>
    {/* small shine in eyes */}
    <circle cx="23.5" cy="24.5" r="1.2" fill="white"/>
    <circle cx="39.5" cy="24.5" r="1.2" fill="white"/>
    {/* light smile */}
    <path d="M21 40 Q30 47 39 40" stroke="#1e3a8a" strokeWidth="2" fill="none" strokeLinecap="round"/>
  </>;
}

function FacePensieroso() {
  return <>
    <circle cx="22" cy="26" r="3.5" fill="#78350f"/>
    <circle cx="38" cy="26" r="3.5" fill="#78350f"/>
    <circle cx="23.5" cy="24.5" r="1.2" fill="white"/>
    <circle cx="39.5" cy="24.5" r="1.2" fill="white"/>
    {/* neutral mouth */}
    <line x1="21" y1="42" x2="39" y2="42" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
    {/* thought dots */}
    <circle cx="47" cy="16" r="3"   fill="#78350f" opacity="0.35"/>
    <circle cx="52" cy="10" r="2.2" fill="#78350f" opacity="0.25"/>
    <circle cx="56" cy="5"  r="1.5" fill="#78350f" opacity="0.18"/>
  </>;
}

function FaceIndaffarato() {
  return <>
    {/* wide eyes */}
    <ellipse cx="22" cy="25" rx="5"   ry="5.5" fill="#7c2d12"/>
    <ellipse cx="22" cy="25" rx="2.5" ry="3"   fill="white"/>
    <ellipse cx="38" cy="25" rx="5"   ry="5.5" fill="#7c2d12"/>
    <ellipse cx="38" cy="25" rx="2.5" ry="3"   fill="white"/>
    {/* open O mouth */}
    <ellipse cx="30" cy="42" rx="6" ry="5" fill="#7c2d12"/>
    <ellipse cx="30" cy="43" rx="4" ry="3.2" fill="#dc2626" opacity="0.5"/>
    {/* sweat drop */}
    <path d="M47 17 Q49 12 51 17 Q51 22 47 22 Z" fill="#bfdbfe" opacity="0.8"/>
  </>;
}

function FaceStressato() {
  return <>
    {/* X eyes */}
    <line x1="17" y1="21" x2="25" y2="30" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="25" y1="21" x2="17" y2="30" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="35" y1="21" x2="43" y2="30" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="43" y1="21" x2="35" y2="30" stroke="#7f1d1d" strokeWidth="2.5" strokeLinecap="round"/>
    {/* frown */}
    <path d="M18 46 Q30 37 42 46" stroke="#7f1d1d" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* sweat drops */}
    <path d="M48 13 Q50 8 52 13 Q52 17 48 17 Z" fill="#bfdbfe" opacity="0.8"/>
    <path d="M44 7  Q45.5 3 47 7  Q47 10 44 10 Z" fill="#bfdbfe" opacity="0.6"/>
  </>;
}

function FaceSopraffatto() {
  return <>
    {/* spiral eyes (text) */}
    <text x="14" y="32" fontSize="14" textAnchor="middle" fill="#450a0a">@</text>
    <text x="46" y="32" fontSize="14" textAnchor="middle" fill="#450a0a">@</text>
    {/* big wavy frown */}
    <path d="M13 47 Q19 40 25 47 Q31 54 37 47 Q43 40 47 47"
      stroke="#450a0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* many sweat drops */}
    <path d="M50 10 Q52 5  54 10 Q54 14 50 14 Z" fill="#bfdbfe" opacity="0.85"/>
    <path d="M46 4  Q47.5 0 49 4  Q49 7  46 7  Z" fill="#bfdbfe" opacity="0.65"/>
    <path d="M8  12 Q9.5 7  11 12 Q11 16  8  16 Z" fill="#bfdbfe" opacity="0.7"/>
  </>;
}

const STATI = {
  felice:      { color:'#4ade80', stroke:'#16a34a', Face:FaceHappy,       anim:'tama-bounce 0.75s ease-in-out infinite',  label:'🎉 Ottimo lavoro!',          sub:'Tutto completato' },
  sereno:      { color:'#60a5fa', stroke:'#2563eb', Face:FaceSereno,      anim:'tama-float 2.5s ease-in-out infinite',    label:'😌 Situazione tranquilla',    sub:'Tutto sotto controllo' },
  pensieroso:  { color:'#fbbf24', stroke:'#d97706', Face:FacePensieroso,  anim:'tama-think 3s ease-in-out infinite',      label:'🤔 Task in sospeso',          sub:'Qualcosa da fare' },
  indaffarato: { color:'#fb923c', stroke:'#ea580c', Face:FaceIndaffarato, anim:'tama-wiggle 0.55s ease-in-out infinite',  label:'📬 Tante mail!',              sub:'Inbox in attesa' },
  stressato:   { color:'#f87171', stroke:'#dc2626', Face:FaceStressato,   anim:'tama-shake 0.35s ease-in-out infinite',   label:'😰 Troppe task!',             sub:'Serve aiuto' },
  sopraffatto: { color:'#ef4444', stroke:'#b91c1c', Face:FaceSopraffatto, anim:'tama-shake 0.22s ease-in-out infinite',  label:'🆘 Situazione critica!',      sub:'HELP!' },
};

export default function Tamagotchi() {
  const { taskCount = 0, emailCount = 0 } = useNotifiche();
  const [stato, setStato] = useState('sereno');
  const [celebrating, setCelebrating] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const prevTaskRef = useRef(taskCount);
  const celebTimerRef = useRef(null);

  useEffect(() => {
    const prev = prevTaskRef.current;
    prevTaskRef.current = taskCount;
    if (prev > 0 && taskCount < prev && taskCount >= 0) {
      // Task completata!
      clearTimeout(celebTimerRef.current);
      setCelebrating(true);
      celebTimerRef.current = setTimeout(() => setCelebrating(false), 1800);
    }
  }, [taskCount]);

  useEffect(() => {
    if (!celebrating) setStato(getStato(taskCount, emailCount));
  }, [taskCount, emailCount, celebrating]);

  const cfg = celebrating ? STATI.felice : (STATI[stato] || STATI.sereno);
  const { Face } = cfg;

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className="border-t border-white/10 pt-3 pb-2 flex flex-col items-center">
        <div
          className="relative cursor-default select-none"
          onMouseEnter={() => setShowTip(true)}
          onMouseLeave={() => setShowTip(false)}
        >
          {/* Character */}
          <svg
            viewBox="0 0 60 60"
            width="58"
            height="58"
            style={{ animation: celebrating ? 'tama-celebrate 0.4s ease-in-out 4' : cfg.anim, display:'block' }}
          >
            {/* Shadow */}
            <ellipse cx="30" cy="57" rx="18" ry="3" fill="black" opacity="0.12"/>
            {/* Body */}
            <circle cx="30" cy="30" r="27" fill={cfg.color} stroke={cfg.stroke} strokeWidth="1.5"/>
            {/* Shine */}
            <ellipse cx="20" cy="15" rx="8" ry="5.5" fill="white" opacity="0.28" transform="rotate(-20 20 15)"/>
            {/* Face */}
            <Face />
          </svg>

          {/* Tooltip */}
          {showTip && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-2xl w-44 text-center">
                <p className="font-semibold mb-1">{cfg.label}</p>
                <div className="text-white/60 space-y-0.5">
                  <p>Task aperti: <span className="text-white font-medium">{taskCount}</span></p>
                  <p>Email: <span className="text-white font-medium">{emailCount}</span></p>
                </div>
              </div>
              <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1"/>
            </div>
          )}
        </div>

        {/* State label */}
        <p className="text-[10px] text-white/40 mt-1 tracking-wide">
          {celebrating ? 'Ottimo! 🎉' : cfg.sub}
        </p>
      </div>
    </>
  );
}
