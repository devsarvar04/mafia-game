import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { sound } from '../lib/sound';

export default function NightAction({ room, players, myPlayer, secret, timeLeft, isHost }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [allyTarget, setAllyTarget] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const isMafiaTeam = secret?.role === 'mafia' || secret?.role === 'don';

    // Yangi tun boshlanganda tanlovlarni tozalash
    useEffect(() => {
        setSelectedIds([]);
        setAllyTarget(null);
    }, [room.day_number]);

    // Mafiya sheriklarining 1-tanlovini real-time Broadcast orqali ko'rish
    useEffect(() => {
        if (!isMafiaTeam || isHost) return;

        const channel = supabase
            .channel(`mafia-sync:${room.id}`)
            .on('broadcast', { event: 'target_pick' }, ({ payload }) => {
                if (payload.actorId !== myPlayer?.id) {
                    setAllyTarget(payload.targetId);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isMafiaTeam, isHost, room.id, myPlayer?.id]);

    // O'qituvchi (Proyektor) ekrani
    if (isHost) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#060911]">
                <div className="text-xs uppercase tracking-widest text-indigo-400 mb-2">
                    {room.day_number}-TUN
                </div>
                <div className="text-7xl font-mono font-bold text-white mb-4">{timeLeft}s</div>
                <h2 className="text-2xl font-bold text-slate-200">Shahar uxlamoqda...</h2>
                <p className="text-slate-400 mt-2 max-w-md">
                    Barcha tirik o‘quvchilar ekranida 3 ta shubhali shaxsni belgilashi shart!
                </p>
            </div>
        );
    }

    // O'lgan o'yinchi ekrani (bir xil to'q fonda, jim kuzatadi)
    if (!myPlayer?.is_alive) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-[#070a11]">
                <div className="max-w-sm w-full bg-[#0b0f19] border border-[#1a2234] p-6 rounded text-center space-y-2">
                    <div className="text-sm font-semibold text-[#475569]">SIZ O‘YINDAN CHIQQANSIZ</div>
                    <p className="text-xs text-[#334155]">
                        O‘yin tugaguncha jim kuzating va boshqalarga ishora qilmang.
                    </p>
                </div>
            </div>
        );
    }

    const aliveTargets = players.filter((p) => p.is_alive && p.id !== myPlayer.id);

    async function handlePick(targetId) {
        if (submitting || selectedIds.length >= 3 || selectedIds.includes(targetId)) return;

        const clickOrder = selectedIds.length + 1;
        setSubmitting(true);
        sound.click();

        // Optimistic UI: Darhol ekranda belgilaymiz
        const updated = [...selectedIds, targetId];
        setSelectedIds(updated);

        // Agar mafiya 1-tanlovni qilsa, sherigiga real-time xabar yuboradi
        if (isMafiaTeam && clickOrder === 1) {
            supabase.channel(`mafia-sync:${room.id}`).send({
                type: 'broadcast',
                event: 'target_pick',
                payload: { actorId: myPlayer.id, targetId },
            });
        }

        await supabase.from('actions').insert({
            room_id: room.id,
            day_number: room.day_number,
            phase: 'NIGHT',
            actor_id: myPlayer.id,
            target_id: targetId,
            click_order: clickOrder,
        });

        setSubmitting(false);
    }

    const checkedHistory = secret?.extra_info?.checked || [];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#070a11]">
            <div className="w-full max-w-sm bg-[#0b0f19] border border-[#1a2234] p-5 rounded space-y-4">
                {/* Yuqori sarlavha — hamma uchun bir xil */}
                <div className="flex items-center justify-between border-b border-[#141b29] pb-3">
                    <span className="text-xs font-semibold text-[#64748b]">
                        3 TA SHUBHALI SHAXSNI TANLANG ({selectedIds.length}/3)
                    </span>
                    <span className="text-sm font-mono font-bold text-[#64748b]">{timeLeft}s</span>
                </div>

                {/* Komissar uchun tekshiruv natijasi (past kontrastli) */}
                {secret?.role === 'sheriff' && checkedHistory.length > 0 && (
                    <div className="text-xs text-[#475569] bg-[#080b13] p-2 rounded border border-[#141b29]">
                        Tekshirilganlar:{' '}
                        {checkedHistory.map((c, i) => (
                            <span key={i} className="mr-2">
                                {c.name} ({c.is_evil ? 'Yovuz' : 'Tinch'})
                            </span>
                        ))}
                    </div>
                )}

                {/* O'yinchilar tugmalari — hamma uchun bir xil kulrang dizayn */}
                <div className="grid grid-cols-2 gap-2">
                    {aliveTargets.map((p) => {
                        const pickIndex = selectedIds.indexOf(p.id);
                        const isPicked = pickIndex !== -1;
                        const isAllyChoice = isMafiaTeam && allyTarget === p.id;

                        return (
                            <button
                                key={p.id}
                                onClick={() => handlePick(p.id)}
                                disabled={isPicked || selectedIds.length >= 3}
                                className={`px-3 py-3 rounded border text-left text-sm font-medium flex items-center justify-between transition-colors cursor-pointer ${isPicked
                                        ? 'bg-[#162033] border-[#334155] text-[#94a3b8]'
                                        : 'bg-[#080b13] border-[#141b29] text-[#475569] hover:border-[#263248]'
                                    }`}
                            >
                                <span className="truncate">{p.nickname}</span>
                                <span className="text-xs font-mono ml-1">
                                    {isPicked ? `#${pickIndex + 1}` : isAllyChoice ? '•' : ''}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Pastki holat yozuvi */}
                <div className="text-center text-xs text-[#334155] pt-1">
                    {selectedIds.length === 3
                        ? 'Tanlov qabul qilindi. Tong otishini kuting...'
                        : '3 tasini ham bosmasangiz ertaga ovoz berolmaysiz'}
                </div>
            </div>
        </div>
    );
}