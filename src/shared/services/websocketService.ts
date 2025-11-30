import { create } from "zustand";
import { DataService } from "./dataService.ts";
import { parseSnapshot, parseUpdate } from "../utils/utils";


export interface WebSocketState {
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
                this.store.setState({ isConnected: true, error: null });
            };

            this.ws.onmessage = async (ev: MessageEvent) => {
                try {
                    if (ev.data instanceof ArrayBuffer) {
                        const data = new Uint8Array(ev.data);

                        // Find null terminator to determine symbol length and remaining data length
                        let nullIndex = -1;
                        for (let i = 0; i < data.length; i++) {
                            if (data[i] === 0x00) {
                                nullIndex = i;
                                break;
                            }
                        }

                        if (nullIndex !== -1) {
                            const offset = nullIndex + 1;
                            const remaining = data.length - offset;

                            let message;
                            // Snapshot has 36 bytes of data after symbol
                            if (remaining === 36) {
                                message = parseSnapshot(data);
                            }
                            // Update has 20 bytes of data after symbol
                            else if (remaining === 20) {
                                message = parseUpdate(data);
                            } else {
                                console.warn("Received binary message with unexpected length:", remaining);
                            }

                            if (message) {
                                DataService.saveData(message.symbol, message);
                                // console.log('📊 Binary Message:', message);
                            }
                        }
                    } else {
                        // Handle JSON messages - just log them as requested
                        console.log("Received JSON message:", ev.data);
                    }
                } catch (err) {
                    console.error("Error processing WebSocket message:", err);
                }
            };

            this.ws.onclose = () => {
                this.store.setState({ isConnected: false });
            };

            this.ws.onerror = () => {
                this.store.setState({ error: "WebSocket error occurred" });
            };
        } catch {
            this.store.setState({ error: "Failed to connect to WebSocket" });
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.store.setState({ isConnected: false });
    }

    sendMessage(message: unknown) {
        console.log("Sending message:", message);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            const messageStr =
                typeof message === "string" ? message : JSON.stringify(message);
            this.ws.send(messageStr);
        } else {
            this.store.setState({ error: "WebSocket is not connected" });
        }
    }

    sendBinary(data: ArrayBuffer | Uint8Array) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            this.store.setState({ error: "WebSocket is not connected" });
        }
    }
}

const wsManager = new WebSocketManager();

export const useWebSocketStore = create<WebSocketState>((set) => {
    wsManager.setStore({ setState: set });

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
export class WebSocketService {
    static connect(url: string, binary = false) {
        useWebSocketStore.getState().connect(url, binary);
    }

    static disconnect() {
        useWebSocketStore.getState().disconnect();
    }

    static sendMessage(message: unknown) {
        useWebSocketStore.getState().sendMessage(message);
    }

    static clearMessages() {
        useWebSocketStore.getState().clearMessages();
    }

    static get isConnected() {
        return useWebSocketStore.getState().isConnected;
    }

    static get messages() {
        return useWebSocketStore.getState().messages;
    }

    static get error() {
        return useWebSocketStore.getState().error;
    }
}
