import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: true })
export class WebsocketService
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  // Store latest data for each event dynamically
  private latestEvents: Record<string, any> = {};
  private connectedClients = new Set<string>();

  /**
   * Emits an event to all connected clients and stores the latest state of that event.
   * @param event The event name
   * @param data The event data
   */
  emit(event: string, data: any) {
    this.server.emit(event, data);
    this.latestEvents[event] = data; // Store event state dynamically
  }

  /**
   * Handles new client connections and sends them the latest state of all stored events.
   * @param client The connected socket client
   */
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.add(client.id);

    // Send latest state of all events when a client reconnects
    for (const event in this.latestEvents) {
      client.emit(event, this.latestEvents[event]);
    }
  }

  /**
   * Handles client disconnections.
   * @param client The disconnected socket client
   */
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Ensures the WebSocket server closes gracefully on app shutdown.
   */
  onModuleDestroy() {
    this.server.close();
  }
}
