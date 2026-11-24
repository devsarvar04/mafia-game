import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function useRoomSync(roomId, userId) {
    const [room, setRoom] = useState(null);
    const [players, setPlayers] = useState([]);
    const [secret, setSecret] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const advancingRef = useRef(false);

    // Dastlabki ma'lumotlarni yuklash va Realtime sinxronizatsiya
    useEffect(() => {
        if (!roomId || !userId) return;

        async function loadInitial() {
            const [{ data: roomData }, { data: playersData }] = await Promise.all([
                supabase.from('rooms').select('*').eq('id', roomId).single(),
                supabase.from('players').select('*').eq('room_id', roomId).order('joined_at', { ascending: true }),
            ]);

            if (roomData) {
                setRoom(roomData);
            } else {
                // Agar xona topilmasa yoki o'chirilgan bo'lsa
                localStorage.removeItem('mafia_room_id');
                window.location.reload();
                return;
            }

            if (playersData) setPlayers(playersData);
        }

        loadInitial();

        // Faqat kerakli xona uchun Realtime kanal
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
                (payload) => {
                    if (payload.eventType === 'DELETE') {
                        localStorage.removeItem('mafia_room_id');
                        window.location.reload();
                        return;
                    }
                    if (payload.new) setRoom(payload.new);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    // Agar joriy foydalanuvchining o'zi o'qituvchi tomonidan o'chirilgan bo'lsa
                    if (payload.eventType === 'DELETE' && payload.old?.user_id === userId) {
                        localStorage.removeItem('mafia_room_id');
                        window.location.reload();
                        return;
                    }

                    supabase
                        .from('players')
                        .select('*')
                        .eq('room_id', roomId)
                        .order('joined_at', { ascending: true })
                        .then(({ data }) => data && setPlayers(data));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, userId]);

    // O'yin boshlanganda maxfiy rolni olish (faqat o'ziga tegishli qator)
    useEffect(() => {
        if (!room || room.phase === 'LOBBY' || room.host_user_id === userId) {
            setSecret(null);
            return;
        }

        supabase
            .from('player_secrets')
            .select('*')
            .eq('room_id', roomId)
            .eq('user_id', userId)
            .single()
            .then(({ data }) => {
                if (data) setSecret(data);
            });
    }, [room?.phase, roomId, userId]);

    // Taymer hisoblagichi va Host uchun avtomatik bosqich o'tkazish
    useEffect(() => {
        if (!room?.phase_ends_at || room.phase === 'LOBBY' || room.phase === 'GAME_OVER') {
            setTimeLeft(0);
            return;
        }

        advancingRef.current = false;

        const interval = setInterval(() => {
            const diff = Math.max(0, Math.ceil((new Date(room.phase_ends_at).getTime() - Date.now()) / 1000));
            setTimeLeft(diff);

            if (diff === 0 && room.host_user_id === userId && !advancingRef.current) {
                advancingRef.current = true;
                supabase.rpc('advance_phase', { p_room_id: roomId });
            }
        }, 250);

        return () => clearInterval(interval);
    }, [room?.phase, room?.phase_ends_at, room?.host_user_id, roomId, userId]);

    return { room, players, secret, timeLeft };
}