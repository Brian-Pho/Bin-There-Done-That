import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import createPlotlyComponent from "react-plotly.js/factory";
import Plotly from "plotly.js-dist-min";
import "./App.css";

const Plot = createPlotlyComponent(Plotly);

const SERVER_URL = "http://localhost:3001";
const MAX_LOG_LINES = 200;
const MIN_N = 1;
const MAX_N = 40;

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/** Stops from Plotly.js's built-in Jet colorscale, used for label contrast. */
const JET = [
  [0, [0, 0, 131]],
  [0.125, [0, 60, 170]],
  [0.375, [5, 255, 255]],
  [0.625, [255, 255, 0]],
  [0.875, [250, 0, 0]],
  [1, [128, 0, 0]],
];

function jetRgb(t) {
  let index = 1;
  while (index < JET.length - 1 && JET[index][0] < t) {
    index += 1;
  }
  const [start, startColor] = JET[index - 1];
  const [end, endColor] = JET[index];
  const span = end - start;
  const mix = span === 0 ? 0 : (t - start) / span;
  return startColor.map(
    (channel, channelIndex) => channel + (endColor[channelIndex] - channel) * mix,
  );
}

function annotationColor(count, minCount, maxCount) {
  const t = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
  const [red, green, blue] = jetRgb(t);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
  return luminance > 0.6 ? "#111" : "#fff";
}

function countAnnotations(counts) {
  let minCount = Infinity;
  let maxCount = -Infinity;
  for (const row of counts) {
    for (const count of row) {
      if (count == null) {
        continue;
      }
      if (count < minCount) {
        minCount = count;
      }
      if (count > maxCount) {
        maxCount = count;
      }
    }
  }
  if (minCount === Infinity) {
    return [];
  }

  const annotations = [];
  counts.forEach((row, y) => {
    row.forEach((count, x) => {
      if (count == null) {
        return;
      }
      annotations.push({
        x,
        y,
        text: String(count),
        showarrow: false,
        font: {
          color: annotationColor(count, minCount, maxCount),
          size: 14,
        },
      });
    });
  });
  return annotations;
}

function parseDimension(text) {
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const value = Number(text);
  if (value < MIN_N || value > MAX_N) {
    return null;
  }
  return value;
}

export default function App() {
  const [dimensionText, setDimensionText] = useState("4");
  const [dimension, setDimension] = useState(4);
  const [counts, setCounts] = useState(() => emptyGrid(4));
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const logRef = useRef(null);
  const dimensionRef = useRef(4);

  useEffect(() => {
    const socket = io(SERVER_URL, { transports: ["websocket"] });

    socket.on("connect", () => {
      setStatus("Connected");
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("connect_error", () => {
      setStatus("Disconnected");
    });

    socket.on("number", (n) => {
      const size = dimensionRef.current;
      const index = n - 1;
      const col = ((index % size) + size) % size;
      const row = ((Math.floor(index / size) % size) + size) % size;

      setCounts((prev) => {
        const base = prev.length === size ? prev : emptyGrid(size);
        const next = base.map((line) => line.slice());
        next[row][col] = (next[row][col] ?? 0) + 1;
        return next;
      });

      setLog((prev) => {
        const next = prev === "" ? String(n) : `${prev}\n${n}`;
        const lines = next.split("\n");
        if (lines.length <= MAX_LOG_LINES) {
          return next;
        }
        return lines.slice(-MAX_LOG_LINES).join("\n");
      });
    });

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [log]);

  const onDimensionChange = (event) => {
    const text = event.target.value;
    setDimensionText(text);
    const next = parseDimension(text);
    if (next === null || next === dimensionRef.current) {
      return;
    }
    dimensionRef.current = next;
    setDimension(next);
    setCounts(emptyGrid(next));
  };

  const dimensionError =
    dimensionText !== "" && parseDimension(dimensionText) === null;

  const axis = {
    dtick: 1,
    tickmode: "linear",
    showgrid: false,
    zeroline: false,
  };

  return (
    <div className="app">
      <h1>Bin There, Done That</h1>
      <p
        className={
          status === "Disconnected"
            ? "status status-disconnected"
            : status === "Connected"
              ? "status status-connected"
              : "status"
        }
      >
        {status}
      </p>

      <label className="field">
        Grid dimension (N)
        <input
          type="text"
          inputMode="numeric"
          value={dimensionText}
          onChange={onDimensionChange}
          aria-label="Grid dimension"
          aria-invalid={dimensionError}
        />
      </label>
      {dimensionError ? (
        <p className="hint hint-error">Enter a whole number from 1 to 40.</p>
      ) : (
        <p className="hint">
          Value n is a 1-based index: column (n - 1) % N, row floor((n -
          1) / N) % N. Changing N clears the counts.
        </p>
      )}

      <div className="heatmap">
        <Plot
          key={dimension}
          data={[
            {
              z: counts,
              type: "heatmap",
              colorscale: "Jet",
              showscale: true,
              hoverongaps: false,
              xgap: 1,
              ygap: 1,
              hovertemplate:
                "row %{y}<br>column %{x}<br>count %{z}<extra></extra>",
              colorbar: { title: { text: "count" } },
            },
          ]}
          layout={{
            autosize: true,
            margin: { t: 16, r: 16, b: 40, l: 48 },
            xaxis: { ...axis, title: { text: "column" } },
            yaxis: { ...axis, title: { text: "row" } },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            annotations: countAnnotations(counts),
          }}
          config={{ displayModeBar: false, responsive: true }}
          useResizeHandler
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <label className="field">
        Received values
        <textarea
          ref={logRef}
          readOnly
          value={log}
          aria-label="Received values"
          rows={8}
        />
      </label>
    </div>
  );
}
