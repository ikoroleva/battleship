import { Room, Player } from '../types/types';
import { RoomRepository } from '../repositories/RoomRepository';
import { PlayerService } from './PlayerService';

export class RoomService {
  private roomRepo: RoomRepository;
  private playerService: PlayerService;

  constructor() {
    this.roomRepo = RoomRepository.getInstance();
    this.playerService = new PlayerService();
  }

  createRoom(player: Player): Room {
    return this.roomRepo.create(player);
  }

  addPlayerToRoom(roomId: string, player: Player): Room | undefined {
    const room = this.roomRepo.findById(roomId);

    // Check if room exists
    if (!room) {
      return undefined;
    }

    // Check if player is already in the room
    const isPlayerInRoom = room.players.some((p) => p.name === player.name);
    if (isPlayerInRoom) {
      throw new Error('Player is already in this room');
    }

    return this.roomRepo.addPlayerToRoom(roomId, player);
  }

  removeRoom(roomId: string): void {
    this.roomRepo.removeRoom(roomId);
  }

  getRoomById(roomId: string): Room | undefined {
    return this.roomRepo.findById(roomId);
  }

  getAvailableRooms(): Room[] {
    return this.roomRepo.getAvailableRooms();
  }

  getRoomByPlayer(player: Player): Room | undefined {
    return this.roomRepo.findRoomByPlayer(player);
  }

  getRoomData(): Array<{
    roomId: string;
    roomUsers: Array<{
      name: string;
      index: number;
    }>;
  }> {
    return this.roomRepo.getRoomData();
  }

  broadcastRoomUpdate(): void {
    this.playerService.broadcastMessage('update_room', this.getRoomData());
  }
}
