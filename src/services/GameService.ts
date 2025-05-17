import { Game, Room, Ship, Player, GamePlayerState } from '../types/types';
import { GameRepository } from '../repositories/GameRepository';
import { PlayerService } from './PlayerService';
import { MessageFormatter } from '../utils/MessageFormatter';

export interface AttackResult {
  hit: boolean;
  killed: boolean;
  gameOver: boolean;
}

export class GameService {
  private gameRepo: GameRepository;
  private playerService: PlayerService;

  constructor() {
    this.gameRepo = GameRepository.getInstance();
    this.playerService = new PlayerService();
  }

  createFromRoom(room: Room): Game {
    const game = this.gameRepo.createFromRoom(room);
    this.notifyGameCreation(game);
    return game;
  }

  setShips(gameId: string, playerName: string, ships: Ship[]): boolean {
    const success = this.gameRepo.setShips(gameId, playerName, ships);

    if (success && this.isGameReady(gameId)) {
      this.startGame(gameId);
    }

    return success;
  }

  processAttack(
    gameId: string,
    x: number,
    y: number,
    attackerId: string,
  ): AttackResult | undefined {
    const result = this.gameRepo.processAttack(gameId, x, y, attackerId);
    if (!result) return undefined;

    const game = this.getGameById(gameId);
    if (!game) return undefined;

    this.broadcastAttackResult(
      game,
      x,
      y,
      attackerId,
      result.hit ? (result.killed ? 'killed' : 'shot') : 'miss',
    );

    if (result.gameOver) {
      this.endGame(game, attackerId);
    } else if (!result.hit) {
      this.broadcastTurn(game);
    }

    return result;
  }

  isPlayerTurn(gameId: string, playerName: string): boolean {
    return this.gameRepo.isPlayerTurn(gameId, playerName);
  }

  getGameById(gameId: string): Game | undefined {
    return this.gameRepo.findById(gameId);
  }

  generateRandomAttackCoordinates(): { x: number; y: number } {
    return this.gameRepo.generateRandomAttackCoordinates();
  }

  private isGameReady(gameId: string): boolean {
    return this.gameRepo.isGameReady(gameId);
  }

  private startGame(gameId: string): void {
    const game = this.getGameById(gameId);
    if (!game) return;

    Object.entries(game.players).forEach(([playerId, playerState]) => {
      MessageFormatter.sendMessage(playerState.player.socket, 'start_game', {
        ships: playerState.ships,
        currentPlayerIndex: playerId,
      });
    });

    this.broadcastTurn(game);
  }

  private notifyGameCreation(game: Game): void {
    Object.entries(game.players).forEach(([playerName, playerState]) => {
      MessageFormatter.sendMessage(playerState.player.socket, 'create_game', {
        idGame: game.gameId,
        idPlayer: playerName,
      });
    });
  }

  private endGame(game: Game, winnerId: string): void {
    const winner = game.players[winnerId].player;
    this.playerService.incrementPlayerWins(winner.name);

    const sockets = Object.values(game.players).map(
      ({ player }) => player.socket,
    );
    MessageFormatter.sendToSockets(sockets, 'finish', { winPlayer: winnerId });

    this.gameRepo.removeGame(game.gameId);
    this.broadcastWinnersUpdate();
  }

  private broadcastTurn(game: Game): void {
    const sockets = Object.values(game.players).map(
      ({ player }) => player.socket,
    );
    MessageFormatter.sendToSockets(sockets, 'turn', {
      currentPlayer: game.turn,
    });
  }

  private broadcastAttackResult(
    game: Game,
    x: number,
    y: number,
    attackerId: string,
    status: 'miss' | 'killed' | 'shot',
  ): void {
    const sockets = Object.values(game.players).map(
      ({ player }) => player.socket,
    );
    MessageFormatter.sendToSockets(sockets, 'attack', {
      position: { x, y },
      currentPlayer: attackerId,
      status,
    });
  }

  private broadcastWinnersUpdate(): void {
    const winnersData = this.playerService.getWinners().map((p) => ({
      name: p.name,
      wins: p.wins,
    }));

    this.playerService.broadcastMessage('update_winners', winnersData);
  }
}
