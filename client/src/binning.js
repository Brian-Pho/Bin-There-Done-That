export function emptyGrid(size) {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

/** A 0 is not a cell index and is left out of the grid. */
export function binNumber(grid, n) {
  if (n === 0) {
    return grid;
  }

  const size = grid.length;
  const index = n - 1;
  const col = ((index % size) + size) % size;
  const row = ((Math.floor(index / size) % size) + size) % size;
  const next = grid.map((line) => line.slice());
  next[row][col] = (next[row][col] ?? 0) + 1;
  return next;
}
