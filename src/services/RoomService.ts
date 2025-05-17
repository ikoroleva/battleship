import { Room, Player } from '../types/types';
import { RoomRepository } from '../repositories/rooms';
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
    const room = this.roomRepo.addPlayerToRoom(roomId, player);
    return room;
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
    const roomData = this.getRoomData();
    this.playerService.broadcastMessage(
      JSON.stringify({
        type: 'update_room',
        data: JSON.stringify(roomData),
        id: 0,
      }),
    );
  }
}
