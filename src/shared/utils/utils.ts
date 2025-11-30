import { WebSocketMessageType } from "./CommonConstants";

export interface SnapshotWebsocketMessage {
    type: number;
    symbol: string;
    timestamp: number;  // uint64 BE (Unix ms)
    open: number;       // float32 BE
    high: number;
    low: number;
    close: number;
    prevClose: number;
    volume: number;     // uint64 BE
}

export interface UpdateWebsocketMessage {
    type: number;
    symbol: string;
    timestamp: number;
    price: number;      // float32 BE
    volume: number;
}


export function parseSnapshot(data: Uint8Array): SnapshotWebsocketMessage {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;

    // Find null terminator for symbol
    let nullIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === 0x00) {
            nullIndex = i;
            break;
        }
    }
    if (nullIndex === -1) {
        throw new Error('Invalid snapshot: No null terminator found');
    }
    const symbol = new TextDecoder().decode(data.slice(0, nullIndex));
    offset = nullIndex + 1;

    // Validate remaining length: 8 (timestamp) + 20 (5 floats) + 8 (volume) = 36 bytes
    if (data.length - offset < 36) {
        throw new Error('Invalid snapshot: Insufficient data length');
    }

    const timestamp = Number(view.getBigInt64(offset, false));  // Big-endian
    offset += 8;
    const open = view.getFloat32(offset, false);
    offset += 4;
    const high = view.getFloat32(offset, false);
    offset += 4;
    const low = view.getFloat32(offset, false);
    offset += 4;
    const close = view.getFloat32(offset, false);
    offset += 4;
    const prevClose = view.getFloat32(offset, false);
    offset += 4;
    const volume = Number(view.getBigUint64(offset, false));

    return {
        type: WebSocketMessageType.SNAPSHOT,
        symbol, timestamp, open, high, low, close, prevClose, volume
    };
}

export function parseUpdate(data: Uint8Array): UpdateWebsocketMessage {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 0;

    // Find null terminator for symbol
    let nullIndex = -1;
    for (let i = 0; i < data.length; i++) {
        if (data[i] === 0x00) {
            nullIndex = i;
            break;
        }
    }
    if (nullIndex === -1) {
        throw new Error('Invalid update: No null terminator found');
    }
    const symbol = new TextDecoder().decode(data.slice(0, nullIndex));
    offset = nullIndex + 1;

    // Validate remaining length: 8 (timestamp) + 4 (price) + 8 (volume) = 20 bytes
    if (data.length - offset < 20) {
        throw new Error('Invalid update: Insufficient data length');
    }

    const timestamp = Number(view.getBigInt64(offset, false));
    offset += 8;
    const price = view.getFloat32(offset, false);
    offset += 4;
    const volume = Number(view.getBigUint64(offset, false));

    return {
        type: WebSocketMessageType.UPDATE,
        symbol, timestamp, price, volume
    };
}