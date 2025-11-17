export interface UnpackedData {
    timestamp: number;
    price: number; // LTP (Last Traded Price)
    channel: string;
}

export function unpackStockData(data: ArrayBuffer): UnpackedData | null {
    try {
        const packedBytes: Uint8Array = new Uint8Array(data);
        if (packedBytes.length < 48) {
            console.error('Bytes too short for numeric fields');
            return null;
        }

        const view = new DataView(packedBytes.buffer, packedBytes.byteOffset, packedBytes.byteLength);
        let offset = 0;

        // Unpack 6 little-endian doubles (8 bytes each, total 48 bytes)
        const timestamp = view.getFloat64(offset, true); // true = little-endian
        offset += 8;
        // Skip open, high, low (we only need close for LTP)
        offset += 8; // skip open
        offset += 8; // skip high
        offset += 8; // skip low
        const close = view.getFloat64(offset, true); // Use close as LTP
        offset += 8;
        // Skip volume
        offset += 8;

        // Now extract channel: from offset to first \x00 (or end if none)
        const rest = packedBytes.slice(offset);
        // const nullIndex = rest.indexOf(0); // Find first null byte (0)
        // const channelBytes = nullIndex !== -1 ? rest.slice(0, nullIndex) : rest;

        // Decode UTF-8 (TextDecoder is modern browser/Node)
        // const decoder = new TextDecoder('utf-8');
        // const channel = decoder.decode(channelBytes);

        const channel = decodeLastNullTerminated(rest);

        // Use close price as the LTP (Last Traded Price)
        return {
            timestamp,
            price: close, // Use close price as LTP
            channel,
        };
    } catch (error) {
        console.error('Unpack error:', error);
        return null;
    }
}

function decodeLastNullTerminated(rest: Uint8Array): string {
    // Find the null that terminates the final string (or use full length if none)
    let end = rest.lastIndexOf(0);
    if (end === -1) end = rest.length;

    // Walk backward to the start of that string (previous null or start-of-buffer)
    let start = end;
    while (start > 0 && rest[start - 1] !== 0) start--;

    const decoder = new TextDecoder('utf-8');
    return decoder.decode(rest.slice(start, end));
}