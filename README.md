# Bin There, Done That

Private repo: [https://github.com/Brian-Pho/Bin-There-Done-That](https://github.com/Brian-Pho/Bin-There-Done-That)

Precision Neuroscience full-stack exercise: stream nonnegative integers from a cloud-style data server and visualize them as a real-time NxN heatmap on a local web client.

## Approach

**Chosen: Socket.IO integer stream, client-side binning** (Approach 1).

When a client connects, the server starts a **per-socket continuous stream** of nonnegative integers (`number` events, ~20/sec). Disconnecting that client stops its timer. Independent clients get independent streams.

The client (not yet implemented) will:

- Render a configurable **NxN** grid
- Bin each number with zero-based remainder and quotient, wrapping into the grid:
  - `col = n % N`
  - `row = Math.floor(n / N) % N`
- Keep a running hit count per cell
- Color cells with a conventional **blue-to-red** scale normalized to the current maximum count (zero-count cells stay uncolored)
- Update the grid and color scale as numbers arrive

The PDF examples (`17 → <0,0>`, `8 → <1,3>` on a 4×4 grid) do not match this remainder/quotient mapping (nor the variant without `% N` on the quotient). This repo uses the wrapping formula above unless the spec is clarified.

### Alternatives considered

- **SSE:** HTTP-native one-way stream; extra REST needed to control N or pause. Not used so the project can follow the same Socket.IO split as [Chat-App](https://github.com/Brian-Pho/Chat-App).
- **Server-side binning:** server holds the grid and sends snapshots/deltas. Better fit for a later server-side rendering discussion; weaker if the client should interpret the raw integer stream.

### Bonus (discussion only)

- **3D:** same NxN counts, extruded as bar height (for example Three.js); color still from the normalized count.
- **Server-side rendering:** sending pixels/frames instead of integers or counts trades client CPU for bandwidth, latency, and weaker interactivity (changing N, inspecting cells). Multiple viewers would share one render pipeline or multiply GPU cost.

## Layout

```
client/    local visualization (placeholder until the server is confirmed)
server/    Express + Socket.IO data stream
```

## Run the server

1. `cd server`
2. `npm ci`
3. `npm start`

The server listens on [http://localhost:3001/](http://localhost:3001/) by default (`PORT` env var to override). Use `npm run watch` while editing. With the server running, `npm run verify` connects over Socket.IO, reads 10 numbers, then disconnects (`SERVER_URL` if not on 3001).
