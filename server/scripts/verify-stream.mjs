import { io } from "socket.io-client";

const URL = process.env.SERVER_URL ?? "http://localhost:3001";
const SAMPLE_COUNT = 10;
const TIMEOUT_MS = 5000;

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
  if (!Number.isInteger(n) || n < 0) {
    fail(`Expected a nonnegative integer, got: ${JSON.stringify(n)}`);
  }
  numbers.push(n);
  if (numbers.length >= SAMPLE_COUNT) {
    clearTimeout(timeout);
    socket.close();
    console.log(`Received ${numbers.length} numbers: ${numbers.join(", ")}`);
    process.exit(0);
  }
});
