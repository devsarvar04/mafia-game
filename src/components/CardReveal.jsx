import { useEffect, useState } from 'react';
import { sound } from '../lib/sound';

const ROLE_STYLES = {
    mafia: {
        label: 'MAFIYA',
        color: '#ef4444',
        glow: '0 0 45px rgba(239, 68, 68, 0.75)',
        evil: true,
    },
    don: {
        label: 'MAFIYA DONI',
        color: '#dc2626',
        glow: '0 0 50px rgba(220, 38, 38, 0.85)',
        evil: true,
    },
    maniac: {
        label: 'MANIAK',
        color: '#a855f7',
        glow: '0 0 45px rgba(168, 85, 247, 0.75)',
        evil: true,
    },
    sheriff: {
        label: 'KOMISSAR',
        color: '#3b82f6',
        glow: '0 0 45px rgba(59, 130, 246, 0.75)',
        evil: false,
    },
    doctor: {
        label: 'DOKTOR',
        color: '#10b981',
        glow: '0 0 45px rgba(16, 185, 129, 0.75)',
        evil: false,
    },
    civilian: {
        label: 'TINCH AHOLI',
        color: '#94a3b8',
        glow: '0 0 35px rgba(148, 163, 184, 0.5)',
        evil: false,
    },
};

export default function CardReveal({ queue = [] }) {
    const [index, setIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const current = queue[index];

    useEffect(() => {
        if (!current) return;

        setIsFlipped(false);
        sound.heartbeat();

        const heartbeatInterval = setInterval(() => sound.heartbeat(), 450);

        // 1.5 soniyadan keyin karta aylanadi va rol rangida porlaydi
        const flipTimer = setTimeout(() => {
            clearInterval(heartbeatInterval);
            setIsFlipped(true);
            sound.cardFlip();

            const style = ROLE_STYLES[current.role] || ROLE_STYLES.civilian;
            setTimeout(() => {
                if (style.evil) sound.revealEvil();
                else sound.revealGood();
            }, 200);
        }, 1500);

        // 5 soniyadan keyin navbatdagi kartaga o'tadi
        const nextTimer = setTimeout(() => {
            if (index + 1 < queue.length) {
                setIndex((prev) => prev + 1);
            }
        }, 5000);

        return () => {
            clearInterval(heartbeatInterval);
            clearTimeout(flipTimer);
            clearTimeout(nextTimer);
        };
    }, [index, current, queue.length]);

    if (!current) return null;

    const roleInfo = ROLE_STYLES[current.role] || ROLE_STYLES.civilian;
    const isRoleFirst = current.mode === 'ROLE_FIRST';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#060911]">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-6">
                {current.reason || 'Shaxsiyati ochilmoqda'} ({index + 1} / {queue.length})
            </div>

            {/* 3D Karta konteyneri */}
            <div className="perspective-1000 w-72 h-96">
                <div
                    className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : 'animate-card-shake'
                        }`}
                >
                    {/* KARTANING OLD TOMONI */}
                    <div className="absolute inset-0 backface-hidden bg-slate-900 border-2 border-slate-700 rounded-xl flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-2xl font-bold text-slate-300 mb-4">
                            ?
                        </div>
                        <div className="text-3xl font-bold text-white break-words">
                            {isRoleFirst ? roleInfo.label : current.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-3 uppercase tracking-widest">
                            Shaxsiyat aniqlanmoqda...
                        </div>
                    </div>

                    {/* KARTANING ORQA TOMONI (Porlash effekti bilan) */}
                    <div
                        style={{
                            borderColor: isFlipped ? roleInfo.color : '#334155',
                            boxShadow: isFlipped ? roleInfo.glow : 'none',
                        }}
                        className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-950 border-2 rounded-xl flex flex-col items-center justify-center p-6 text-center transition-shadow duration-500"
                    >
                        <div className="text-sm uppercase tracking-widest text-slate-400 mb-2">
                            {isRoleFirst ? roleInfo.label : current.name}
                        </div>
                        <div
                            style={{ color: roleInfo.color }}
                            className="text-3xl font-extrabold tracking-wide uppercase"
                        >
                            {isRoleFirst ? current.name : roleInfo.label}
                        </div>
                        <div className="mt-6 px-3 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-400">
                            O‘yindan chiqdi
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}