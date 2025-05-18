import { Player } from '../types/types';
import { WebSocket } from 'ws';
import { PlayerRepository } from '../repositories/PlayerRepository';
import { MessageFormatter } from '../utils/MessageFormatter';

export class PlayerService {
  private playerRepo: PlayerRepository;

  constructor() {
    this.playerRepo = PlayerRepository.getInstance();
  }

  async registerPlayer(
    name: string,
    password: string,
    socket: WebSocket,
  ): Promise<Player> {
    const existingPlayer = this.playerRepo.findByName(name);

    if (existingPlayer) {
      if (existingPlayer.password !== password) {
        throw new Error('Invalid password');
      }
      this.playerRepo.updateSocket(name, socket);
      return existingPlayer;
    }

    return this.playerRepo.add(name, password, socket);
  }

  getPlayerBySocket(socket: WebSocket): Player | undefined {
    return this.playerRepo.findBySocket(socket);
  }

  getPlayerByName(name: string): Player | undefined {
    return this.playerRepo.findByName(name);
  }

  updatePlayerSocket(name: string, socket: WebSocket): void {
    this.playerRepo.updateSocket(name, socket);
  }

  incrementPlayerWins(name: string): void {
    this.playerRepo.incrementWins(name);
  }

  getWinners(): Player[] {
    return this.playerRepo.getWinners();
  }

  broadcastMessage(type: string, data: any): void {
    const players = this.playerRepo.getAllPlayers();
    MessageFormatter.sendToSockets(
      players.map((p) => p.socket),
      type,
      data,
    );
  }

  getPlayerIndex(name: string): number {
    return this.playerRepo.getPlayerNames().indexOf(name);
  }
}
