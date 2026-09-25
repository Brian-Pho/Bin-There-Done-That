# Client

Vite + React UI for “Bin There, Done That.”

Connects to the Socket.IO server and bins each integer into a configurable NxN heatmap. A value `n` lands in column `n % N` and row `floor(n / N) % N`. Cell color runs from blue to red against the current maximum count; cells with no hits stay uncolored. Changing N clears the counts. Received values are listed below the grid.

## Run

1. Start the server (`cd ../server` then `npm start`)
2. `npm ci` (first time)
3. `npm start`

The app is at [http://localhost:3000/](http://localhost:3000/).
