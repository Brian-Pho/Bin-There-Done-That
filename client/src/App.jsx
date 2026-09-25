import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

const SERVER_URL = "http://localhost:3001";
const MAX_LOG_LINES = 200;

export default function App() {
  const [dimensionText, setDimensionText] = useState("4");
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Connecting…");
  const logRef = useRef(null);

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
    setDimensionText(event.target.value);
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
        />
      </label>

      <label className="field">
        Received values
        <textarea
          ref={logRef}
          readOnly
          value={log}
          aria-label="Received values"
          rows={16}
        />
      </label>
    </div>
  );
}
