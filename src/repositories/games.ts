import { Game, Room, Ship, Player, GamePlayerState } from '../types/types';

export class GameRepository {
  private static instance: GameRepository;
  private games: Map<string, Game>;

  private constructor() {
    this.games = new Map();
  }

  public static getInstance(): GameRepository {
    if (!GameRepository.instance) {
      GameRepository.instance = new GameRepository();
    }
    return GameRepository.instance;
  }

  public createFromRoom(room: Room): Game {
    const gameId = `game_${Date.now()}`;
    const game: Game = {
      gameId,
      players: {},
      turn: room.players[0].name,
      finished: false,
    };

    room.players.forEach((player) => {
      game.players[player.name] = {
        player,
        ships: [],
        ready: false,
      };
    });

    this.games.set(gameId, game);
    return game;
  }

  public findById(gameId: string): Game | undefined {
    return this.games.get(gameId);
  }

  public setShips(gameId: string, playerName: string, ships: Ship[]): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const playerState = game.players[playerName];
    if (!playerState) return false;

    playerState.ships = ships;
    playerState.ready = true;
    return true;
  }

  public isGameReady(gameId: string): boolean {
    const game = this.games.get(gameId);
    return game ? Object.values(game.players).every((p) => p.ready) : false;
  }

  public getOpponentState(
    game: Game,
    playerName: string,
  ): GamePlayerState | undefined {
    const opponentName = Object.keys(game.players).find(
      (name) => name !== playerName,
    );
    return opponentName ? game.players[opponentName] : undefined;
  }

  public processAttack(
    gameId: string,
    x: number,
    y: number,
    attackerName: string,
  ):
    | {
        hit: boolean;
        killed: boolean;
        gameOver: boolean;
      }
    | undefined {
    const game = this.games.get(gameId);
    if (!game) return undefined;

    const opponentState = this.getOpponentState(game, attackerName);
    if (!opponentState) return undefined;

    let hit = false;
    let killed = false;

    for (const ship of opponentState.ships) {
      if (this.isShipHit(ship, x, y)) {
        hit = true;
        ship.hits = (ship.hits || 0) + 1;
        killed = ship.hits === ship.length;
        break;
      }
    }

    const gameOver = opponentState.ships.every(
      (ship) => ship.hits === ship.length,
    );

    if (!hit) {
      game.turn = opponentState.player.name;
    }

    if (gameOver) {
      game.finished = true;
    }

    return { hit, killed, gameOver };
  }

  private isShipHit(ship: Ship, x: number, y: number): boolean {
    if (!ship.direction) {
      // horizontal
      return (
        y === ship.position.y &&
        x >= ship.position.x &&
        x < ship.position.x + ship.length
      );
    } else {
      // vertical
      return (
        x === ship.position.x &&
        y >= ship.position.y &&
        y < ship.position.y + ship.length
      );
    }
  }

  public generateRandomAttackCoordinates(): { x: number; y: number } {
    return {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
  }

  public removeGame(gameId: string): void {
    this.games.delete(gameId);
  }

  public isPlayerTurn(gameId: string, playerName: string): boolean {
    const game = this.games.get(gameId);
    return game ? game.turn === playerName : false;
  }
}
