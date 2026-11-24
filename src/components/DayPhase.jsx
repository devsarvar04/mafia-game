import { useEffect, useState } from 'react';
import { ShieldCheck, UserX, FastForward, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sound } from '../lib/sound';

export default function DayPhase({ room, players, myPlayer, timeLeft, isHost }) {
    const [votedTarget, setVotedTarget] = useState(null);
    const [verdictChoice, setVerdictChoice] = useState(null);

    // Bosqich o'zgarganda mahalliy tanlovlarni tozalash
    useEffect(() => {
        setVotedTarget(null);
        setVerdictChoice(null);
    }, [room.phase, room.day_number]);

    const alivePlayers = players.filter((p) => p.is_alive);
    const accusedPlayer = players.find((p) => p.id === room.accused_player_id);

    // O'qituvchi (Host) bosqichni muddatidan oldin o'tkazishi uchun
    async function handleSkipPhase() {
        sound.click();
        await supabase.rpc('advance_phase', { p_room_id: room.id });
    }

    // 1. Nomzodga ovoz berish
    async function handleNominationVote(targetId) {
        if (votedTarget || !myPlayer?.is_alive || !myPlayer?.can_vote) return;
        sound.click();
        setVotedTarget(targetId);

        await supabase.from('actions').insert({
            room_id: room.id,
            day_number: room.day_number,
            phase: 'NOMINATION_VOTE',
            actor_id: myPlayer.id,
            target_id: targetId,
            click_order: 1,
        });
    }

    // 2. Hukm ovozi: QOLSIN ('SAVE') yoki CHIQARILSIN ('KICK')
    async function handleVerdictVote(choice) {
        if (verdictChoice || !myPlayer?.is_alive || myPlayer.id === room.accused_player_id) return;
        sound.click();
        setVerdictChoice(choice);

        await supabase.from('actions').insert({
            room_id: room.id,
            day_number: room.day_number,
            phase: 'VERDICT_VOTE',
            actor_id: myPlayer.id,
            vote_choice: choice,
            click_order: 1,
        });
    }

    // ==========================================
    // O'QITUVCHI (PROYEKTOR) EKRANI
    // ==========================================
    if (isHost) {
        return (
            <div className="min-h-screen flex flex-col p-6 max-w-5xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded flex items-center justify-between">
                    <div>
                        <span className="text-xs uppercase tracking-widest text-amber-400 font-semibold">
                            {room.day_number}-KUN
                        </span>
                        <h2 className="text-2xl font-bold text-white mt-1">
                            {room.phase === 'DAY_DISCUSSION' && 'Umumiy muhokama vaqti'}
                            {room.phase === 'NOMINATION_VOTE' && 'Nomzodga ovoz berish'}
                            {room.phase === 'DEFENSE_SPEECH' && `So‘nggi so‘z: ${accusedPlayer?.nickname || ''}`}
                            {room.phase === 'VERDICT_VOTE' && `Hukm: ${accusedPlayer?.nickname || ''} qolsinmi?`}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-5xl font-mono font-bold text-white">{timeLeft}s</div>
                        <button
                            onClick={handleSkipPhase}
                            title="Keyingi bosqichga o'tish"
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded flex items-center gap-1 text-sm cursor-pointer"
                        >
                            <FastForward className="w-4 h-4" />
                            <span>O‘tkazish</span>
                        </button>
                    </div>
                </div>

                {/* So'nggi so'z yoki Hukm paytida ayblanuvchi kartasi */}
                {(room.phase === 'DEFENSE_SPEECH' || room.phase === 'VERDICT_VOTE') && accusedPlayer && (
                    <div className="mt-6 bg-amber-950/30 border border-amber-700/50 p-6 rounded text-center space-y-2">
                        <div className="text-xs uppercase tracking-widest text-amber-400">Shubha ostidagi o‘yinchi</div>
                        <div className="text-4xl font-bold text-white">{accusedPlayer.nickname}</div>
                        <p className="text-sm text-slate-300">
                            {room.phase === 'DEFENSE_SPEECH'
                                ? 'O‘zingizni oqlash uchun sinfni ishontiring!'
                                : 'O‘quvchilar o‘z telefonida Qolsin yoki Chiqarilsin tugmasini bosmoqda...'}
                        </p>
                    </div>
                )}

                {/* Tirik o'yinchilar holati */}
                <div className="mt-6">
                    <div className="text-xs uppercase tracking-wider text-slate-400 mb-3">
                        Tirik o‘yinchilar ({alivePlayers.length})
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {players.map((p) => (
                            <div
                                key={p.id}
                                className={`p-3 rounded border flex items-center justify-between ${p.is_alive
                                        ? 'bg-slate-900 border-slate-800 text-slate-100'
                                        : 'bg-slate-950/50 border-slate-900 text-slate-600 line-through'
                                    }`}
                            >
                                <span className="font-medium truncate">{p.nickname}</span>
                                {p.is_alive && !p.can_vote && (
                                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">
                                        Uyquchi
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ==========================================
    // O'QUVCHI EKRANI
    // ==========================================
    if (!myPlayer?.is_alive) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-sm w-full bg-slate-900 border border-slate-800 p-6 rounded text-center space-y-2">
                    <div className="text-sm font-bold text-slate-300">SIZ O‘YINDAN CHIQQANSIZ</div>
                    <p className="text-xs text-slate-500">Katta ekrandagi muhokamani kuzating.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                        {room.day_number}-KUN
                    </span>
                    <span className="text-sm font-mono font-bold text-white">{timeLeft}s</span>
                </div>

                {/* 1. MUHOKAMA */}
                {room.phase === 'DAY_DISCUSSION' && (
                    <div className="py-6 text-center space-y-2">
                        <MessageSquare className="w-8 h-8 text-amber-400 mx-auto" />
                        <h3 className="font-bold text-white">Jonli muhokama</h3>
                        <p className="text-xs text-slate-400">
                            Sinfdoshlaringiz bilan gaplashing va kim mafiya ekanini aniqlang.
                        </p>
                    </div>
                )}

                {/* 2. NOMZODGA OVOZ BERISH */}
                {room.phase === 'NOMINATION_VOTE' && (
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-white">Kimni ayblaysiz?</div>
                        {!myPlayer.can_vote ? (
                            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400">
                                Tunda 3 ta tugma bosmaganingiz uchun bu kun ovoz bera olmaysiz.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {alivePlayers
                                    .filter((p) => p.id !== myPlayer.id)
                                    .map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => handleNominationVote(p.id)}
                                            disabled={!!votedTarget}
                                            className={`p-3 rounded border text-left text-sm font-medium transition-colors cursor-pointer ${votedTarget === p.id
                                                    ? 'bg-amber-600/20 border-amber-500 text-amber-300'
                                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                                }`}
                                        >
                                            {p.nickname}
                                        </button>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 3. SO'NGGI SO'Z */}
                {room.phase === 'DEFENSE_SPEECH' && (
                    <div className="py-6 text-center space-y-2">
                        <div className="text-xs text-slate-400">So‘nggi so‘z berildi:</div>
                        <div className="text-2xl font-bold text-amber-400">{accusedPlayer?.nickname}</div>
                        <p className="text-xs text-slate-400">
                            {accusedPlayer?.id === myPlayer.id
                                ? 'Hozir gapiring! Sinfni aybsiz ekaningizga ishontiring!'
                                : 'Uning gapini tinglang, hozir hukm chiqarasiz.'}
                        </p>
                    </div>
                )}

                {/* 4. HUKM: QOLSIN YOKI CHIQARILSIN */}
                {room.phase === 'VERDICT_VOTE' && (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-xs text-slate-400">Hukm chiqaring:</div>
                            <div className="text-xl font-bold text-white mt-1">{accusedPlayer?.nickname}</div>
                        </div>

                        {accusedPlayer?.id === myPlayer.id ? (
                            <div className="p-4 bg-slate-950 border border-slate-800 rounded text-center text-xs text-slate-400">
                                Siz ayblanuvchisiz, boshqalar hukm chiqarishini kuting...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleVerdictVote('SAVE')}
                                    disabled={!!verdictChoice}
                                    className={`py-4 px-3 rounded border font-bold text-sm flex flex-col items-center gap-1 transition-colors cursor-pointer ${verdictChoice === 'SAVE'
                                            ? 'bg-emerald-600 border-emerald-400 text-white'
                                            : 'bg-slate-950 border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                                        }`}
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    <span>O‘YINDA QOLSIN</span>
                                </button>

                                <button
                                    onClick={() => handleVerdictVote('KICK')}
                                    disabled={!!verdictChoice}
                                    className={`py-4 px-3 rounded border font-bold text-sm flex flex-col items-center gap-1 transition-colors cursor-pointer ${verdictChoice === 'KICK'
                                            ? 'bg-red-600 border-red-400 text-white'
                                            : 'bg-slate-950 border-red-800/60 text-red-400 hover:bg-red-950/40'
                                        }`}
                                >
                                    <UserX className="w-5 h-5" />
                                    <span>CHIQARILSIN</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}