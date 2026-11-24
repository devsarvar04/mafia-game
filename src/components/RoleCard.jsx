import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ROLE_DATA = {
    civilian: {
        title: 'SIZ: TINCH AHOLI',
        desc: 'Kunduzi mafiyani topib ovoz bering. Tunda 3 ta shubhali shaxsni belgilang.',
    },
    mafia: {
        title: 'SIZ: MAFIYA A’ZOSI',
        desc: 'Tunda 1-bosgan odamingiz o‘ladi. Qolgan 2 tasi shunchaki chalg‘ituvchi belgi.',
    },
    don: {
        title: 'SIZ: MAFIYA DONI',
        desc: 'Tunda 1-bosgan odamingiz o‘ladi va komissarligi maxfiy tarzda tekshiriladi.',
    },
    doctor: {
        title: 'SIZ: SHAHAR DOKTORI',
        desc: 'Tunda 1-bosgan odamingiz saqlanadi. Qolgan 2 tasi shunchaki chalg‘ituvchi.',
    },
    sheriff: {
        title: 'SIZ: KOMISSAR',
        desc: 'Tunda 1-bosgan odamingiz tekshiriladi. Qolgan 2 tasi chalg‘ituvchi belgi.',
    },
    maniac: {
        title: 'SIZ: YOLG‘IZ MANIAK',
        desc: 'Yolg‘iz g‘alaba uchun o‘ynaysiz. Tunda 1-bosgan odamingiz yashirincha o‘ladi.',
    },
};

export default function RoleCard({ roomId, secret, timeLeft, isHost }) {
    const [allies, setAllies] = useState([]);

    // Mafiya va Don uchun sheriklarni yuklash
    useEffect(() => {
        if (!secret || !['mafia', 'don'].includes(secret.role)) return;

        supabase.rpc('get_mafia_allies', { p_room_id: roomId }).then(({ data }) => {
            if (data) setAllies(data);
        });
    }, [roomId, secret]);

    // O'qituvchi (Proyektor) ekrani
    if (isHost) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <div className="text-6xl font-mono font-bold text-blue-400 mb-4">{timeLeft}s</div>
                <h2 className="text-2xl font-bold text-white">Rollar tarqatildi!</h2>
                <p className="text-slate-400 mt-2 max-w-md">
                    O‘quvchilar o‘z ekranlaridagi maxfiy kartani o‘qib olishmoqda. Yon atrofga qaramang!
                </p>
            </div>
        );
    }

    const info = ROLE_DATA[secret?.role] || ROLE_DATA.civilian;

    // O'quvchi ekrani: Past kontrastli, yon tomondan ko'rinmaydigan bir xil karta
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#070a11]">
            <div className="w-full max-w-sm bg-[#0b0f19] border border-[#1a2234] p-6 rounded space-y-4">
                <div className="flex items-center justify-between text-xs text-[#334155] font-mono">
                    <span>MAXFIY KARTA</span>
                    <span>{timeLeft}s</span>
                </div>

                {/* Yon tomondan o'qilmasligi uchun past kontrastli kulrang shrift (#475569) */}
                <div className="py-4 border-y border-[#141b29] space-y-2">
                    <h2 className="text-lg font-bold tracking-wide text-[#64748b]">{info.title}</h2>
                    <p className="text-sm leading-relaxed text-[#475569] min-h-[44px]">{info.desc}</p>
                </div>

                {/* Faqat mafiyalar uchun sheriklar ro'yxati (bir xil kichik shriftda) */}
                <div className="text-xs text-[#334155] min-h-[20px]">
                    {allies.length > 1 ? (
                        <span>Sheriklar: {allies.map((a) => a.nickname).join(', ')}</span>
                    ) : (
                        <span>Ekranni boshqalarga ko‘rsatmang</span>
                    )}
                </div>
            </div>
        </div>
    );
}