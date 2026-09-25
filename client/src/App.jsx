import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Heatmap from "./Heatmap.jsx";
import { binNumber, emptyGrid } from "./binning.js";
import "./App.css";

const SERVER_URL = "http://localhost:3001";
const MAX_LOG_LINES = 200;
const MIN_N = 1;
const MAX_N = 40;

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
      setCounts((prev) => {
        const base = prev.length === size ? prev : emptyGrid(size);
        return binNumber(base, n);
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
    setLog("");
  };

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
          Value n is a 1-based index: column (n - 1) % N, row floor((n -
          1) / N) % N. A 0 is logged and not binned. Changing N clears the
          counts.
        </p>
      )}

      <Heatmap counts={counts} dimension={dimension} />

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
