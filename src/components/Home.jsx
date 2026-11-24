import { useState } from 'react';
import { Users, Play, Monitor } from 'lucide-react';
import { supabase, ensureAuth } from '../lib/supabase';
import { sound } from '../lib/sound';

export default function Home({ onEnterRoom }) {
    const [code, setCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // O'qituvchi uchun yangi xona yaratish
    async function handleCreateRoom() {
        setError('');
        setLoading(true);
        sound.click();

        try {
            const user = await ensureAuth();
            const randomCode = Math.floor(1000 + Math.random() * 9000).toString();

            const { data, error: roomErr } = await supabase
                .from('rooms')
                .insert({ code: randomCode, host_user_id: user.id })
                .select()
                .single();

            if (roomErr) throw roomErr;
            localStorage.setItem('mafia_room_id', data.id);
            onEnterRoom(data.id, user.id);
        } catch (err) {
            setError(err.message || 'Xona yaratishda xatolik');
        } finally {
            setLoading(false);
        }
    }

    // O'quvchi uchun kod va ism bilan kirish
    async function handleJoinRoom(e) {
        e.preventDefault();
        if (!code.trim() || !nickname.trim()) return;

        setError('');
        setLoading(true);
        sound.click();

        try {
            const user = await ensureAuth();

            const { data: roomData, error: findErr } = await supabase
                .from('rooms')
                .select('*')
                .eq('code', code.trim())
                .single();

            if (findErr || !roomData) throw new Error('Bunday xona kodi topilmadi');
            if (roomData.phase !== 'LOBBY') throw new Error("O'yin allaqachon boshlangan");

            // Bir xil ism bor-yo'qligini tekshirish
            const { data: existingPlayers } = await supabase
                .from('players')
                .select('nickname')
                .eq('room_id', roomData.id);

            let finalName = nickname.trim().slice(0, 18);
            const sameNames = (existingPlayers || []).filter((p) =>
                p.nickname.toLowerCase().startsWith(finalName.toLowerCase())
            );
            if (sameNames.length > 0) {
                finalName = `${finalName} ${sameNames.length + 1}`;
            }

            const { error: joinErr } = await supabase.from('players').upsert(
                {
                    room_id: roomData.id,
                    user_id: user.id,
                    nickname: finalName,
                },
                { onConflict: 'room_id,user_id' }
            );

            if (joinErr) throw joinErr;

            localStorage.setItem('mafia_room_id', roomData.id);
            onEnterRoom(roomData.id, user.id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16]">
            <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white">MAFIA CLASS</h1>
                    <p className="text-sm text-slate-400">Sinfxona uchun tezkor psixologik o'yin</p>
                </div>

                {error && (
                    <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 text-sm rounded">
                        {error}
                    </div>
                )}

                {/* O'quvchi kirish formasi */}
                <form onSubmit={handleJoinRoom} className="bg-slate-900 border border-slate-800 p-6 rounded space-y-4">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm uppercase tracking-wider">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span>O'quvchi sifatida kirish</span>
                    </div>

                    <div>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="Xona kodi (masalan: 4829)"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded text-center text-2xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            maxLength={18}
                            placeholder="Ismingiz (familiyasiz)"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || code.length < 4 || !nickname.trim()}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Play className="w-4 h-4" />
                        <span>O'yinga qo'shilish</span>
                    </button>
                </form>

                {/* O'qituvchi (Host) tugmasi */}
                <div className="pt-2 border-t border-slate-800/80">
                    <button
                        onClick={handleCreateRoom}
                        disabled={loading}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                        <Monitor className="w-4 h-4 text-emerald-400" />
                        <span>O'qituvchi ekrani (Yangi xona ochish)</span>
                    </button>
                </div>
            </div>
        </div>
    );
}