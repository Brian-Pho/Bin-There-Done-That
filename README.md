# Bin There, Done That

Precision Neuroscience full-stack project: real-time visualization of a streaming integer source.

The **data server** lives in `server/` (run locally now; intended as the cloud stream). The **web client** will live in `client/` and bin that stream into a heatmap. This repository currently implements the server.

## Spec

- The client renders an NxN grid (N is configurable).
- The client reads a stream of nonnegative integers from the server.
- Each number is binned by zero-based remainder and quotient:

  - `col = n % N`
  - `row = Math.floor(n / N) % N`

- Each cell keeps a running hit count.
- Cell color is a conventional blue-to-red heatmap, normalized to the current maximum count. Zero-count cells are uncolored.
- The grid and color scale update as numbers arrive.

The assignment PDF examples (`17 → <0,0>`, `8 → <1,3>` on a 4x4 grid) do not match this remainder/quotient mapping (or the non-wrapping variant). The formulas above are what the client will use unless the spec is clarified.

## Approach 1 (implemented)

**Socket.IO integer stream, client-side binning.**

When a client connects, the server starts a **per-socket continuous stream** of nonnegative integers and emits each value as a `number` event. Disconnecting clears that socket’s timer. Streams are independent; there is no global generator.

- Interval: 50ms (~20 numbers/sec), constant `STREAM_INTERVAL_MS` in `server/src/index.mjs`
- Values: random integers in `[0, 1e9)`
- Port: 3001

The **client** (not built yet) will own the count grid, max, color map, and heatmap.

### Run the server

```bash
cd server
npm ci
npm start
```

Use `npm run watch` while editing the server. Open `http://localhost:3001/` for the unused HTTP page. A Socket.IO client should connect to that origin and listen for `number`.

## Alternatives considered

**2. Server-Sent Events, client-side binning.** Unidirectional HTTP stream (`GET /stream`). Simpler through some proxies, but weaker for later client→server control (pause, change N) and a worse match to the existing Chat-App Socket.IO split.

**3. Server-side binning, stream grid updates.** Server holds the NxN counts and sends snapshots or dirty-cell deltas. Better for the server-side rendering bonus and high rates, but the assignment’s client is supposed to interpret the raw integer stream.

## Bonus discussion (not built)

**3D.** Keep the same NxN bins and colors; extrude each cell’s count as height (for example Three.js boxes). Streaming and binning stay 2D; only the renderer changes.

**Server-side rendering.** Sending pixels or frames moves CPU/GPU work and color mapping to the server. That can help thin clients and keep many viewers in sync, but it costs bandwidth, adds latency, and makes interaction (changing N, hover) heavier. Streaming counts or cell deltas is usually a better middle ground than video-like frames unless the visualization itself is expensive.
