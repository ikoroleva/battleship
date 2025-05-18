import { Room, Player } from '../types/types';

export class RoomRepository {
  private static instance: RoomRepository;
  private rooms: Map<string, Room>;

  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance(): RoomRepository {
    if (!RoomRepository.instance) {
      RoomRepository.instance = new RoomRepository();
    }
    return RoomRepository.instance;
  }

  public create(player: Player): Room {
    const roomId = `room_${Date.now()}`;
    const room: Room = {
      roomId,
      players: [player],
    };
    this.rooms.set(roomId, room);
    return room;
  }

  public findById(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public addPlayerToRoom(roomId: string, player: Player): Room | undefined {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.push(player);
    }
    return room;
  }

  public getAvailableRooms(): Room[] {
    return Array.from(this.rooms.values()).filter(
      (room) => room.players.length === 1,
    );
  }

  public removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  public findRoomByPlayer(player: Player): Room | undefined {
    return Array.from(this.rooms.values()).find((room) =>
      room.players.some((p) => p.name === player.name),
    );
  }

  public getRoomData(): Array<{
    roomId: string;
    roomUsers: Array<{
      name: string;
      index: number;
    }>;
  }> {
    return this.getAvailableRooms().map((room) => ({
      roomId: room.roomId,
      roomUsers: room.players.map((player) => ({
        name: player.name,
        index: room.players.indexOf(player),
      })),
    }));
  }
}
