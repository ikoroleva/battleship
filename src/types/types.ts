import { WebSocket } from 'ws';

type ShipKind = 'small' | 'medium' | 'large' | 'huge';

interface Position {
  x: number;
  y: number;
}

interface Ship {
  position: Position;
  direction: boolean; // true - horizontal, false - vertical
  length: number;
  type: ShipKind;
  hits: number;
}

interface Player {
  name: string;
  password: string;
  socket: WebSocket | null;
  wins: number;
}

interface Room {
  roomId: string;
  players: Player[];
}

interface GamePlayerState {
  player: Player;
  ships: Ship[];
  ready: boolean;
}

interface Game {
  gameId: string;
  players: Record<string, GamePlayerState>;
  turn: string;
  finished: boolean;
}

interface WSMessage<T = unknown> {
  type: string;
  data: T | string;
  id: 0;
}
