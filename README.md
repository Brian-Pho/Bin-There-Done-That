# Bin There, Done That

Private repo: [https://github.com/Brian-Pho/Bin-There-Done-That](https://github.com/Brian-Pho/Bin-There-Done-That)

Precision Neuroscience full-stack exercise: stream nonnegative integers from a cloud-style data server and visualize them as a real-time NxN heatmap on a local web client.

## Approach

**Chosen: Socket.IO integer stream, client-side binning, Plotly heatmap** (Approach 1).

When a client connects, the server starts a **per-socket continuous stream** of nonnegative integers below `20` (`number` events, 1/sec). Disconnecting that client stops its timer. Independent clients get independent streams.

The client connects over Socket.IO, lets you set **N**, bins incoming integers into an NxN count grid in React state, and renders that grid with **Plotly.js** (`react-plotly.js`):

- Keep the **NxN count grid in React state**
- On each `number`, treat **n as a 1-based cell index**, then unpack with zero-based remainder and quotient (row-major, wrapping every `N²` cells):
  - `index = n - 1`
  - `col = index % N`
  - `row = Math.floor(index / N) % N`
  - increment that cell and store a **new** grid (do not mutate in place)
- Pass the grid to Plotly as heatmap `z` so `react-plotly.js` calls `Plotly.react` when state updates
- Color cells with a conventional **blue-to-red** `colorscale`, normalized to the current maximum count (zero-count cells stay uncolored)
- Update `zmin`/`zmax` (or Plotly autoscale) as the max count changes
- Changing N clears the counts; received values are also listed below the grid

On a 4×4 grid this matches the spec examples: `17 → <0, 0>` (`index = 16`) and `8 → <1, 3>` (`index = 7`).

### Alternatives considered

- **SSE:** HTTP-native one-way stream; extra REST needed to control N or pause. Not used so the project can follow the same Socket.IO split as [Chat-App](https://github.com/Brian-Pho/Chat-App).
- **Server-side binning:** server holds the grid and sends snapshots/deltas. Better fit for a later server-side rendering discussion; weaker if the client should interpret the raw integer stream.
- **ECharts or D3 for the heatmap:** ECharts has a strong `visualMap`; D3 + Canvas is more control and a smoother 3D path. Plotly is the chosen heatmap library for a built-in heatmap trace, colorscale, and colorbar.

### Bonus (discussion only)

- **3D:** use cubes to display counts. Same NxN counts; color still from the normalized count.
- **Server-side rendering:** the server does binning and heatmap generation. That trades reduced client CPU usage for more data sent between server and client. Sending pixels/frames instead of integers or counts also costs bandwidth and latency and weakens interactivity (changing N, inspecting cells).

## Layout

```
client/    Vite + React UI (NxN Plotly heatmap + live number log)
server/    Express + Socket.IO data stream
```

## Run the server

1. `cd server`
2. `npm ci`
3. `npm start`

The server listens on [http://localhost:3001/](http://localhost:3001/) by default (`PORT` env var to override). Use `npm run watch` while editing. With the server running, `npm run verify` connects over Socket.IO, reads 3 numbers, then disconnects (`SERVER_URL` if not on 3001).

## Run the client

1. `cd client`
2. `npm ci`
3. `npm start`

The client is at [http://localhost:3000/](http://localhost:3000/). The data server must already be running.
