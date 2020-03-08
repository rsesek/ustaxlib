export function clampToZero(value: number): number {
  return value < 0 ? 0 : value;
}

export const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);
