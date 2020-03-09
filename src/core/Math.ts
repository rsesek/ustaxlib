export const clampToZero = (value: number): number => value < 0 ? 0 : value;

export const undefinedToZero = (value?: number): number => value === undefined ? 0 : value;

export const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);
