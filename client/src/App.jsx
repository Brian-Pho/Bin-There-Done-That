import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const SERVER_URL = "http://localhost:3001";
const MAX_LOG_LINES = 200;
const MIN_N = 1;
const MAX_N = 40;

function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(0));
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

function cellColor(count, maxCount) {
  if (count === 0 || maxCount === 0) {
    return null;
  }
  const t = count / maxCount;
  const red = Math.round(255 * t);
  const blue = Math.round(255 * (1 - t));
  return `rgb(${red}, 0, ${blue})`;
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
      const col = n % size;
      const row = Math.floor(n / size) % size;

      setCounts((prev) => {
        const base = prev.length === size ? prev : emptyGrid(size);
        const next = base.map((line) => line.slice());
        next[row][col] += 1;
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

  let maxCount = 0;
  for (const line of counts) {
    for (const count of line) {
      if (count > maxCount) {
        maxCount = count;
      }
    }
  }

  const dimensionError =
    dimensionText !== "" && parseDimension(dimensionText) === null;

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
          Value n lands in column n % N, row floor(n / N) % N. Changing N
          clears the counts.
        </p>
      )}

      <div className="heatmap">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${dimension}, 1fr)` }}
          role="grid"
          aria-label={`${dimension} by ${dimension} heatmap`}
        >
          {counts.map((line, row) =>
            line.map((count, col) => {
              const background = cellColor(count, maxCount);
              return (
                <div
                  key={`${row}-${col}`}
                  className={background ? "cell cell-hot" : "cell"}
                  style={background ? { background } : undefined}
                  role="gridcell"
                  aria-label={`row ${row}, column ${col}, count ${count}`}
                >
                  {count}
                </div>
              );
            }),
          )}
        </div>
        <div className="scale" aria-hidden="true">
          <span>0</span>
          <div className="scale-bar" />
          <span>{maxCount}</span>
        </div>
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
