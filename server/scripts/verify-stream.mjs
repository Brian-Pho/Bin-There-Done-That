import { io } from "socket.io-client";

const URL = process.env.SERVER_URL ?? "http://localhost:3001";
const MAX_VALUE = 1_000_000_000;
const SAMPLE_COUNT = 3;
const TIMEOUT_MS = 8000;

const socket = io(URL, { transports: ["websocket"] });
const numbers = [];

const fail = (message) => {
  console.error(message);
  socket.close();
  process.exit(1);
};

const timeout = setTimeout(() => {
  fail(`Timed out after ${TIMEOUT_MS}ms with ${numbers.length} number(s).`);
}, TIMEOUT_MS);

socket.on("connect_error", (err) => {
  fail(`Could not connect: ${err.message}`);
});

socket.on("number", (n) => {
  if (!Number.isInteger(n) || n < 0 || n >= MAX_VALUE) {
    fail(`Expected an integer in [0, ${MAX_VALUE}), got: ${JSON.stringify(n)}`);
  }
  numbers.push(n);
  if (numbers.length >= SAMPLE_COUNT) {
    clearTimeout(timeout);
    socket.close();
    console.log(`Received ${numbers.length} numbers: ${numbers.join(", ")}`);
    process.exit(0);
  }
});
