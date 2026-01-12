import { create } from "zustand";
import { DataService } from "./dataService.ts";
import { parseSnapshot, parseUpdate } from "../utils/utils";
import { WebSocketMessageType } from "../utils/CommonConstants";


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
    private messageQueue: string[] = [];
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
        // Prevent redundant connections if already connected or connecting
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            // console.log("WebSocket already connected or connecting.");
            return;
        }

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
                this.flushMessageQueue();
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
                            // Update has 28 bytes of data after symbol (timestamp: 8 + price: 4 + volume: 8 + size: 8)
                            else if (remaining === 28) {
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
                        // Handle JSON messages
                        try {
                            const messageStr = typeof ev.data === 'string' ? ev.data : await (ev.data as Blob).text();
                            const json = JSON.parse(messageStr);

                            if (json.message_type === WebSocketMessageType.SNAPSHOT) {
                                // Map JSON fields to SnapshotWebsocketMessage
                                const snapshot: any = {
                                    type: WebSocketMessageType.SNAPSHOT,
                                    symbol: json.symbol,
                                    timestamp: Date.now(), // JSON might not have timestamp, usage varies
                                    open: json.open || 0,
                                    high: json.high || 0,
                                    low: json.low || 0,
                                    close: json.ltp || json.close || 0,
                                    prevClose: json.prev_close || 0,
                                    volume: json.volume || 0
                                };
                                DataService.saveData(snapshot.symbol, snapshot);
                            } else if (json.message_type === WebSocketMessageType.UPDATE) {
                                // Handle update if needed, though user only mentioned snapshot for now
                                // Similar mapping would be needed
                            }
                        } catch (e) {
                            console.error("Error parsing JSON WebSocket message:", e);
                        }
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
        const messageStr = typeof message === "string" ? message : JSON.stringify(message);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            // console.log("Sending message:", message);
            this.ws.send(messageStr);
        } else {
            // Queue the message if not connected
            // console.log("Queueing message:", message);
            this.messageQueue.push(messageStr);
        }
    }

    sendBinary(data: ArrayBuffer | Uint8Array) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(data);
        } else {
            this.store.setState({ error: "WebSocket is not connected" });
        }
    }

    private flushMessageQueue() {
        while (this.messageQueue.length > 0 && this.ws && this.ws.readyState === WebSocket.OPEN) {
            const msg = this.messageQueue.shift();
            if (msg) {
                // console.log("Flushed queued message:", msg);
                this.ws.send(msg);
            }
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
