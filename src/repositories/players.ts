import { WebSocket } from 'ws';
import { Player } from '../types/types';

export class PlayerRepository {
  private static instance: PlayerRepository;
  private players: Map<string, Player>;

  private constructor() {
    this.players = new Map();
  }

  public static getInstance(): PlayerRepository {
    if (!PlayerRepository.instance) {
      PlayerRepository.instance = new PlayerRepository();
    }
    return PlayerRepository.instance;
  }

  public add(name: string, password: string, socket: WebSocket): Player {
    const player: Player = {
      name,
      password,
      socket,
      wins: 0,
    };
    this.players.set(name, player);
    return player;
  }

  public findByName(name: string): Player | undefined {
    return this.players.get(name);
  }

  public findBySocket(ws: WebSocket): Player | undefined {
    return Array.from(this.players.values()).find((p) => p.socket === ws);
  }

  public updateSocket(name: string, socket: WebSocket): void {
    const player = this.players.get(name);
    if (player) {
      player.socket = socket;
    }
  }

  public incrementWins(name: string): void {
    const player = this.players.get(name);
    if (player) {
      player.wins++;
    }
  }

  public getWinners(): Player[] {
    return Array.from(this.players.values()).filter((p) => p.wins > 0);
  }

  public getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }

  public getPlayerNames(): string[] {
    return Array.from(this.players.keys());
  }

  public broadcast(message: string): void {
    this.players.forEach((player) => {
      player.socket?.send(message);
    });
  }
}
