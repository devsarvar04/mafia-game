import { useEffect, useState } from 'react';
import { ensureAuth } from './lib/supabase';
import { useRoomSync } from './hooks/useRoomSync';
import Home from './components/Home';
import Lobby from './components/Lobby';
import RoleCard from './components/RoleCard';
import NightAction from './components/NightAction';
import CardReveal from './components/CardReveal';
import DayPhase from './components/DayPhase';
import GameOver from './components/GameOver';

export default function App() {
  const [roomId, setRoomId] = useState(() => localStorage.getItem('mafia_room_id'));
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    ensureAuth().then((user) => setUserId(user.id));
  }, []);

  const { room, players, secret, timeLeft } = useRoomSync(roomId, userId);

  function handleExit() {
    localStorage.removeItem('mafia_room_id');
    setRoomId(null);
  }

  if (!roomId || !userId) {
    return (
      <Home
        onEnterRoom={(id, uid) => {
          setRoomId(id);
          setUserId(uid);
        }}
      />
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        Xonaga ulanmoqda...
      </div>
    );
  }

  const isHost = room.host_user_id === userId;
  const myPlayer = players.find((p) => p.user_id === userId);

  switch (room.phase) {
    case 'LOBBY':
      return <Lobby room={room} players={players} isHost={isHost} />;

    case 'ROLE_REVEAL':
      return <RoleCard roomId={room.id} secret={secret} timeLeft={timeLeft} isHost={isHost} />;

    case 'NIGHT':
      return (
        <NightAction
          room={room}
          players={players}
          myPlayer={myPlayer}
          secret={secret}
          timeLeft={timeLeft}
          isHost={isHost}
        />
      );

    case 'REVEAL_ANIMATION':
      return <CardReveal queue={room.reveal_queue} />;

    case 'DAY_DISCUSSION':
    case 'NOMINATION_VOTE':
    case 'DEFENSE_SPEECH':
    case 'VERDICT_VOTE':
      return (
        <DayPhase
          room={room}
          players={players}
          myPlayer={myPlayer}
          timeLeft={timeLeft}
          isHost={isHost}
        />
      );

    case 'GAME_OVER':
      return <GameOver room={room} players={players} isHost={isHost} onExit={handleExit} />;

    default:
      return null;
  }
}