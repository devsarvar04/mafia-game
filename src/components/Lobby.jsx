import { useState } from 'react';
import { Users, Play, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sound } from '../lib/sound';

export default function Lobby({ room, players, isHost }) {
    const [starting, setStarting] = useState(false);
    const [err, setErr] = useState('');

    async function handleStartGame() {
        setStarting(true);
        setErr('');
        sound.click();

        const { error } = await supabase.rpc('start_game', { p_room_id: room.id });
        if (error) {
            setErr(error.message);
            setStarting(false);
        }
    }

    async function handleKickPlayer(playerId) {
        await supabase.from('players').delete().eq('id', playerId);
    }

    // O'QUVCHI EKRANI
    if (!isHost) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#090d16]">
                <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-6 rounded space-y-3">
                    <div className="text-xs uppercase tracking-widest text-blue-400 font-semibold">
                        Xona: {room.code}
                    </div>
                    <h2 className="text-xl font-bold text-white">Siz o'yinga kirdingiz!</h2>
                    <p className="text-sm text-slate-400">
                        O'qituvchi o'yinni boshlashini kuting. Ekranga diqqat bilan qarang.
                    </p>
                    <div className="pt-3 border-t border-slate-800 text-xs text-slate-500">
                        Jami ulangan o'quvchilar: <span className="text-slate-200 font-semibold">{players.length}</span>
                    </div>
                </div>
            </div>
        );
    }

    // O'QITUVCHI (PROYEKTOR) EKRANI
    return (
        <div className="min-h-screen flex flex-col p-6 max-w-6xl mx-auto">
            {/* Yuqori panel: Kahoot uslubida katta kod */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <span className="text-xs uppercase tracking-widest text-slate-400 block mb-1">
                        O'yinga ulanish kodi
                    </span>
                    <div className="text-5xl md:text-6xl font-mono font-bold tracking-widest text-white">
                        {room.code}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-3xl font-bold text-white flex items-center justify-end gap-2">
                            <Users className="w-7 h-7 text-blue-400" />
                            <span>{players.length}</span>
                        </div>
                        <span className="text-xs text-slate-400">O'quvchilar tayyor</span>
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={starting || players.length < 4}
                        className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-lg rounded flex items-center gap-2 transition-colors cursor-pointer"
                    >
                        <Play className="w-5 h-5" />
                        <span>O'yinni boshlash</span>
                    </button>
                </div>
            </div>

            {err && (
                <div className="mt-4 p-3 bg-red-950/70 border border-red-800 text-red-300 text-sm rounded">
                    {err}
                </div>
            )}

            {/* O'quvchilar ro'yxati */}
            <div className="mt-6 flex-1">
                {players.length === 0 ? (
                    <div className="h-64 border border-dashed border-slate-800 rounded flex items-center justify-center text-slate-500">
                        O'quvchilar kod orqali kirishini kutmoqdamiz (kamida 4 kishi)...
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {players.map((p) => (
                            <div
                                key={p.id}
                                className="bg-slate-900 border border-slate-800 px-4 py-3 rounded flex items-center justify-between group"
                            >
                                <span className="font-semibold text-slate-100 truncate">{p.nickname}</span>
                                <button
                                    onClick={() => handleKickPlayer(p.id)}
                                    title="O'chirish"
                                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}