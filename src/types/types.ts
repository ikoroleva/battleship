import { WebSocket } from 'ws';

export type ShipKind = 'small' | 'medium' | 'large' | 'huge';

export interface Position {
  x: number;
  y: number;
}

export interface Ship {
  position: Position;
  direction: boolean; // true - vertical, false - horizontal
  length: number;
  type: ShipKind;
  hits: number;
}

export interface Player {
  name: string;
  password: string;
  socket: WebSocket | null;
  wins: number;
}

export interface Room {
  roomId: string;
  players: Player[];
}

export interface GamePlayerState {
  player: Player;
  ships: Ship[];
  ready: boolean;
}

export interface Game {
  gameId: string;
  players: Record<string, GamePlayerState>;
  turn: string;
  finished: boolean;
}

export interface WSMessage {
  type: string;
  data: string;
  id: 0;
}
