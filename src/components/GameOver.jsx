import { useEffect, useState } from 'react';
import { Trophy, RotateCcw, Trash2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sound } from '../lib/sound';

const WINNER_TEXT = {
    TOWN: { title: 'TINCH AHOLI G‘ALABA QOZONDI!', color: 'text-emerald-400' },
    MAFIA: { title: 'MAFIYA SHAHARNI EGALLADI!', color: 'text-red-400' },
    MANIAC: { title: 'MANIAK YOLG‘IZ G‘OLIB BO‘LDI!', color: 'text-purple-400' },
};

const ROLE_BADGES = {
    mafia: { label: 'Mafiya', style: 'bg-red-950/80 text-red-400 border-red-800/60' },
    don: { label: 'Mafiya Doni', style: 'bg-red-950 text-red-300 border-red-700' },
    maniac: { label: 'Maniak', style: 'bg-purple-950/80 text-purple-400 border-purple-800/60' },
    sheriff: { label: 'Komissar', style: 'bg-blue-950/80 text-blue-400 border-blue-800/60' },
    doctor: { label: 'Doktor', style: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' },
    civilian: { label: 'Tinch aholi', style: 'bg-slate-800 text-slate-300 border-slate-700' },
};

export default function GameOver({ room, players, isHost, onExit }) {
    const [results, setResults] = useState([]);
    const [busy, setBusy] = useState(false);

    const info = WINNER_TEXT[room.winner] || WINNER_TEXT.TOWN;

    useEffect(() => {
        supabase.rpc('get_game_results', { p_room_id: room.id }).then(({ data }) => {
            if (data) setResults(data);
        });
    }, [room.id]);

    // 1. Xuddi shu o'quvchilar bilan yangi partiya boshlash
    async function handlePlayAgain() {
        setBusy(true);
        sound.click();

        await Promise.all([
            supabase.from('actions').delete().eq('room_id', room.id),
            supabase.from('player_secrets').delete().eq('room_id', room.id),
            supabase.from('players').update({ is_alive: true, can_vote: true }).eq('room_id', room.id),
        ]);

        await supabase
            .from('rooms')
            .update({
                phase: 'LOBBY',
                winner: null,
                day_number: 1,
                accused_player_id: null,
                reveal_queue: [],
            })
            .eq('id', room.id);

        setBusy(false);
    }

    // 2. Xonani bazadan butunlay o'chirish (hamma bosh sahifaga qaytadi)
    async function handleDeleteRoom() {
        setBusy(true);
        sound.click();

        const { error } = await supabase.from('rooms').delete().eq('id', room.id);
        if (!error) {
            onExit();
        } else {
            setBusy(false);
        }
    }

    // Agar RPC hali javob bermagan bo'lsa, oddiy ro'yxatni ko'rsatib turamiz
    const displayList =
        results.length > 0
            ? results
            : players.map((p) => ({
                player_id: p.id,
                nickname: p.nickname,
                is_alive: p.is_alive,
                role: null,
            }));

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#090d16]">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded text-center space-y-6">
                <div className="space-y-2">
                    <Trophy className={`w-14 h-14 mx-auto ${info.color}`} />
                    <h1 className={`text-2xl sm:text-3xl font-extrabold ${info.color}`}>{info.title}</h1>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">
                        Barcha o‘yinchilarning maxfiy rollari ochildi
                    </p>
                </div>

                {/* O'yinchilar va ularning rollari ro'yxati */}
                <div className="text-left space-y-2 border-y border-slate-800 py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {displayList.map((item) => {
                            const badge = ROLE_BADGES[item.role] || {
                                label: 'Yuklanmoqda...',
                                style: 'bg-slate-800 text-slate-400 border-slate-700',
                            };

                            return (
                                <div
                                    key={item.player_id}
                                    className="bg-slate-950 border border-slate-800/80 px-3.5 py-2.5 rounded flex items-center justify-between gap-2"
                                >
                                    <div className="min-w-0">
                                        <div className="text-sm font-semibold text-slate-100 truncate">
                                            {item.nickname}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                            {item.is_alive ? 'Omon qoldi' : 'O‘yindan chiqqan'}
                                        </div>
                                    </div>

                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded border shrink-0 ${badge.style}`}>
                                        {badge.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Boshqaruv tugmalari */}
                <div className="flex flex-wrap gap-3 justify-center">
                    {isHost ? (
                        <>
                            <button
                                onClick={handlePlayAgain}
                                disabled={busy}
                                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-semibold rounded flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Yana bir partiya o‘ynash</span>
                            </button>

                            <button
                                onClick={handleDeleteRoom}
                                disabled={busy}
                                className="px-5 py-3 bg-red-950/80 hover:bg-red-900/80 border border-red-800 text-red-200 font-semibold rounded flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>Xonani butunlay o‘chirish</span>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onExit}
                            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded flex items-center gap-2 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Bosh sahifaga qaytish</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}