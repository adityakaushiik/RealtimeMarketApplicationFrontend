import {create} from "zustand";
import {DataService} from "./dataService.ts";

interface WebSocketState {
    isConnected: boolean;
    messages: unknown[];
    lastMessage: unknown | null;
    error: string | null;
    connect: (url: string, binary?: boolean) => void;
    disconnect: () => void;
    sendMessage: (message: unknown) => void;
    sendBinary: (data: ArrayBuffer | Uint8Array) => void;
    clearMessages: () => void;
}

class WebSocketManager {
    private ws: WebSocket | null = null;
    private store!: {
        setState: (
            partial:
                | Partial<WebSocketState>
                | ((state: WebSocketState) => Partial<WebSocketState>)
        ) => void;
    };

    setStore(store: {
        setState: (
            partial:
                | Partial<WebSocketState>
                | ((state: WebSocketState) => Partial<WebSocketState>)
        ) => void;
    }) {
        this.store = store;
    }

    connect(url: string, binary = false) {
        if (this.ws) {
            this.ws.close();
        }

        try {
            this.ws = new WebSocket(url);

            if (binary) {
                this.ws.binaryType = "arraybuffer";
            }

            this.ws.onopen = () => {
                this.store.setState({isConnected: true, error: null});
            };

            this.ws.onmessage = async (ev: MessageEvent) => {

                const parsedMessage = JSON.parse(ev.data);
                console.log(ev.data)

                // Convert OHLCV format to LTP format if needed
                let convertedMessage = parsedMessage;

                // Check if message has ohlcv array but no price field
                if (parsedMessage?.ohlcv && Array.isArray(parsedMessage.ohlcv) && !parsedMessage.price) {
                    // Extract close price (index 3) from OHLCV array as LTP
                    convertedMessage = {
                        channel: parsedMessage.channel,
                        timestamp: parsedMessage.timestamp,
                        price: parsedMessage.ohlcv[3] // Use close price as LTP
                    };
                    console.log('📊 Converted OHLCV to LTP:', {
                        ohlcv: parsedMessage.ohlcv,
                        price: convertedMessage.price
                    });
                }

                DataService.saveData(convertedMessage?.channel, convertedMessage);
                console.log(convertedMessage);
            };

            this.ws.onclose = () => {
                this.store.setState({isConnected: false});
            };

            this.ws.onerror = () => {
                this.store.setState({error: "WebSocket error occurred"});
            };
        } catch {
            this.store.setState({error: "Failed to connect to WebSocket"});
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.store.setState({isConnected: false});
    }

    sendMessage(message: unknown) {
        console.log("Sending message:", message);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageStr =
                typeof message === "string" ? message : JSON.stringify(message);
            this.ws.send(messageStr);
        } else {
            this.store.setState({error: "WebSocket is not connected"});
        }
    }

    sendBinary(data: ArrayBuffer | Uint8Array) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            this.store.setState({error: "WebSocket is not connected"});
        }
    }
}

const wsManager = new WebSocketManager();

export const useWebSocketStore = create<WebSocketState>((set) => {
    wsManager.setStore({setState: set});

    return {
        isConnected: false,
        messages: [],
        lastMessage: null,
        error: null,
        connect: (url: string, binary?: boolean) => wsManager.connect(url, binary),
        disconnect: () => wsManager.disconnect(),
        sendMessage: (message: unknown) => wsManager.sendMessage(message),
        sendBinary: (data: ArrayBuffer | Uint8Array) => wsManager.sendBinary(data),
        clearMessages: () =>
            set({
                messages: [],
                lastMessage: null,
            }),
    };
});

// Service class wrapper
/**
 * WebSocketService provides a static interface for managing WebSocket connections,
 * sending and receiving messages, and handling both text and binary data.
 * It uses Zustand for state management and supports reactive updates in React components.
 *
 * @example
 * ```typescript
 * // Connect to a WebSocket server
 * WebSocketService.connect('ws://localhost:8080');
 *
 * // Send a text message
 * WebSocketService.sendMessage({ type: 'hello', data: 'world' });
 *
 * // Send binary data
 * const data = new ArrayBuffer(8);
 * WebSocketService.sendBinary(data);
 *
 * // Check connection status
 * if (WebSocketService.isConnected) {
 *   console.log('Connected!');
 * }
 *
 * // Get received messages
 * const messages = WebSocketService.messages;
 * const lastMessage = WebSocketService.lastMessage;
 *
 * // Disconnect
 * WebSocketService.disconnect();
 * ```
 */
export class WebSocketService {
    /**
     * Connects to a WebSocket server.
     * @param url - The WebSocket URL to connect to (e.g., 'ws://localhost:8080').
     * @param binary - If true, sets the WebSocket to handle binary data as ArrayBuffer. Defaults to false.
     */
    static connect(url: string, binary = false) {
        useWebSocketStore.getState().connect(url, binary);
    }

    /**
     * Disconnects from the current WebSocket connection.
     */
    static disconnect() {
        useWebSocketStore.getState().disconnect();
    }

    /**
     * Sends a text message to the connected WebSocket server.
     * The message is automatically JSON.stringify'd if it's not a string.
     * @param message - The message to send. Can be a string or any serializable object.
     */
    static sendMessage(message: unknown) {
        useWebSocketStore.getState().sendMessage(message);
    }

    /**
     * Clears all stored messages.
     */
    static clearMessages() {
        useWebSocketStore.getState().clearMessages();
    }

    /**
     * Gets the current connection status.
     * @returns true if connected, false otherwise.
     */
    static get isConnected() {
        return useWebSocketStore.getState().isConnected;
    }

    /**
     * Gets the array of received text messages.
     * @returns Array of parsed messages (JSON objects or strings).
     */
    static get messages() {
        return useWebSocketStore.getState().messages;
    }

    /**
     * Gets the current error message, if any.
     * @returns Error string or null if no error.
     */
    static get error() {
        return useWebSocketStore.getState().error;
    }
}
