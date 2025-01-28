import { useContext } from 'react';
import { WebSocketContext } from '../contexts/WebsocketProvider';

export const useWebSocket = () => useContext(WebSocketContext);