import { Game, Room, Ship, Player, GamePlayerState } from '../types/types';
import { GameRepository } from '../repositories/games';
import { PlayerService } from './PlayerService';
import { WebSocket } from 'ws';

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
      playerState.player.socket?.send(
        JSON.stringify({
          type: 'start_game',
          data: JSON.stringify({
            ships: playerState.ships,
            currentPlayerIndex: playerId,
          }),
          id: 0,
        }),
      );
    });

    this.broadcastTurn(game);
  }

  private notifyGameCreation(game: Game): void {
    Object.entries(game.players).forEach(([playerName, playerState]) => {
      playerState.player.socket?.send(
        JSON.stringify({
          type: 'create_game',
          data: JSON.stringify({
            idGame: game.gameId,
            idPlayer: playerName,
          }),
          id: 0,
        }),
      );
    });
  }

  private endGame(game: Game, winnerId: string): void {
    const winner = game.players[winnerId].player;
    this.playerService.incrementPlayerWins(winner.name);

    Object.values(game.players).forEach(({ player }) => {
      player.socket?.send(
        JSON.stringify({
          type: 'finish',
          data: JSON.stringify({
            winPlayer: winnerId,
          }),
          id: 0,
        }),
      );
    });

    this.gameRepo.removeGame(game.gameId);
    this.broadcastWinnersUpdate();
  }

  private broadcastTurn(game: Game): void {
    Object.values(game.players).forEach(({ player }) => {
      player.socket?.send(
        JSON.stringify({
          type: 'turn',
          data: JSON.stringify({
            currentPlayer: game.turn,
          }),
          id: 0,
        }),
      );
    });
  }

  private broadcastAttackResult(
    game: Game,
    x: number,
    y: number,
    attackerId: string,
    status: 'miss' | 'killed' | 'shot',
  ): void {
    Object.values(game.players).forEach(({ player }) => {
      player.socket?.send(
        JSON.stringify({
          type: 'attack',
          data: JSON.stringify({
            position: { x, y },
            currentPlayer: attackerId,
            status,
          }),
          id: 0,
        }),
      );
    });
  }

  private broadcastWinnersUpdate(): void {
    const winnersData = this.playerService.getWinners().map((p) => ({
      name: p.name,
      wins: p.wins,
    }));

    this.playerService.broadcastMessage(
      JSON.stringify({
        type: 'update_winners',
        data: JSON.stringify(winnersData),
        id: 0,
      }),
    );
  }
}
