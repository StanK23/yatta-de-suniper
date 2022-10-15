export function hasUpperCase(str: string) {
  return str !== str.toLowerCase();
}

export function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

export function spliceIntoChunks(arr: any[], chunkSize: number) {
  const res = [];
  while (arr.length > 0) {
    const chunk = arr.splice(0, chunkSize);
    res.push(chunk);
  }
  return res;
}
