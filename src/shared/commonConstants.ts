export const ChannelNames = [
  "stocks:BTC-USD",
  "stocks:ETH-USDSOL-USD",
  "stocks:ADA-USD",
  "stocks:XRP-USD",
  "stocks:XAUT-USD",
];

export function decodBinary(input: ArrayBuffer | Uint8Array) {
  const view =
    input instanceof ArrayBuffer
      ? new DataView(input)
      : input instanceof Uint8Array
      ? new DataView(input.buffer, input.byteOffset, input.byteLength)
      : (() => {
          throw new TypeError(
            "Unsupported input type. Use ArrayBuffer or Uint8Array."
          );
        })();

  if (view.byteLength !== 48) {
    throw new Error("Binary data must be exactly 48 bytes.");
  }

  let offset = 0;
  const timestamp = view.getFloat64(offset, true);
  offset += 8;
  const open = view.getFloat64(offset, true);
  offset += 8;
  const high = view.getFloat64(offset, true);
  offset += 8;
  const low = view.getFloat64(offset, true);
  offset += 8;
  const close = view.getFloat64(offset, true);
  offset += 8;
  const volume = view.getFloat64(offset, true);

  return {
    timestamp,
    ohlcv: [open, high, low, close, volume] as [
      number,
      number,
      number,
      number,
      number
    ],
  };
}
