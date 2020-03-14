// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

export const clampToZero = (value: number): number => value < 0 ? 0 : value;

export const undefinedToZero = (value?: number): number => value === undefined ? 0 : value;

export const reduceBySum = (list: number[]) => list.reduce((acc, curr) => acc + curr, 0);
