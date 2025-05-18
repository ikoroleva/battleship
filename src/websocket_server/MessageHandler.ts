import { WebSocket } from 'ws';
import { WSMessage } from '../types/types';
import { PlayerService } from '../services/PlayerService';
import { RoomService } from '../services/RoomService';
import { GameService } from '../services/GameService';
import { MessageFormatter } from '../utils/MessageFormatter';

export class MessageHandler {
  private static instance: MessageHandler;
  private playerService: PlayerService;
  private roomService: RoomService;
  private gameService: GameService;

  private constructor() {
    this.playerService = new PlayerService();
    this.roomService = new RoomService();
    this.gameService = new GameService();
  }

  public static getInstance(): MessageHandler {
    if (!MessageHandler.instance) {
      MessageHandler.instance = new MessageHandler();
    }
    return MessageHandler.instance;
  }

  public handleMessage(ws: WebSocket, message: string): void {
    try {
      const parsedMessage = JSON.parse(message) as WSMessage;

      switch (parsedMessage.type) {
        case 'reg':
          this.handleRegistration(ws, parsedMessage);
          break;
        case 'create_room':
          this.handleCreateRoom(ws, parsedMessage);
          break;
        case 'add_user_to_room':
          this.handleAddUserToRoom(ws, parsedMessage);
          break;
        case 'add_ships':
          this.handleAddShips(ws, parsedMessage);
          break;
        case 'attack':
          this.handleAttack(ws, parsedMessage);
          break;
        case 'randomAttack':
          this.handleRandomAttack(ws, parsedMessage);
          break;
        default:
          console.log(`Unhandled message type: ${parsedMessage.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendError(ws, 'Invalid message format');
    }
  }

  private async handleRegistration(
    ws: WebSocket,
    message: WSMessage,
  ): Promise<void> {
    const data = JSON.parse(message.data);
    const { name, password } = data;

    try {
      const player = await this.playerService.registerPlayer(
        name,
        password,
        ws,
      );

      MessageFormatter.sendMessage(ws, 'reg', {
        name: player.name,
        index: this.playerService.getPlayerIndex(player.name),
        error: false,
        errorText: '',
      });

      this.roomService.broadcastRoomUpdate();
      const winnersData = this.playerService.getWinners().map((p) => ({
        name: p.name,
        wins: p.wins,
      }));

      this.playerService.broadcastMessage('update_winners', winnersData);
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : 'Registration failed',
      );
    }
  }

  private handleCreateRoom(ws: WebSocket, message: WSMessage): void {
    const player = this.playerService.getPlayerBySocket(ws);
    if (!player) {
      this.sendError(ws, 'Player not found');
      return;
    }

    this.roomService.createRoom(player);
    this.roomService.broadcastRoomUpdate();
  }

  private handleAddUserToRoom(ws: WebSocket, message: WSMessage): void {
    const data = JSON.parse(message.data);
    const { indexRoom } = data;

    const player = this.playerService.getPlayerBySocket(ws);
    if (!player) {
      this.sendError(ws, 'Player not found');
      return;
    }

    try {
      const room = this.roomService.addPlayerToRoom(indexRoom, player);
      if (!room) {
        this.sendError(ws, 'Room not found');
        return;
      }

      if (room.players.length === 2) {
        const game = this.gameService.createFromRoom(room);
        this.roomService.removeRoom(room.roomId);
      }

      this.roomService.broadcastRoomUpdate();
    } catch (error) {
      this.sendError(
        ws,
        error instanceof Error ? error.message : 'Failed to join room',
      );
    }
  }

  private handleAddShips(ws: WebSocket, message: WSMessage): void {
    const data = JSON.parse(message.data);
    const { gameId, ships, indexPlayer } = data;

    if (!this.gameService.setShips(gameId, indexPlayer, ships)) {
      this.sendError(ws, 'Failed to set ships');
    }
  }

  private handleAttack(ws: WebSocket, message: WSMessage): void {
    const data = JSON.parse(message.data);
    const { gameId, x, y, indexPlayer } = data;

    if (!this.gameService.isPlayerTurn(gameId, indexPlayer)) {
      this.sendError(ws, 'Not your turn');
      return;
    }

    this.gameService.processAttack(gameId, x, y, indexPlayer);
  }

  private handleRandomAttack(ws: WebSocket, message: WSMessage): void {
    const data = JSON.parse(message.data);
    const { gameId, indexPlayer } = data;

    if (!this.gameService.isPlayerTurn(gameId, indexPlayer)) {
      this.sendError(ws, 'Not your turn');
      return;
    }

    const { x, y } = this.gameService.generateRandomAttackCoordinates();
    this.gameService.processAttack(gameId, x, y, indexPlayer);
  }

  private sendError(ws: WebSocket, error: string): void {
    MessageFormatter.sendMessage(ws, 'error', { error });
  }
}
