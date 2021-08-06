// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

export { default as Form1040 } from './Form1040';
export { default as Schedule3 } from './Schedule3';

export * from './Form1040';

export { default as Form1099B } from '../fed2019/Form1099B';
export { default as Form1099DIV } from '../fed2019/Form1099DIV';
export { default as Form1099INT } from '../fed2019/Form1099INT';
export { default as Form1099R } from '../fed2019/Form1099R';
// Form1116 is revised in 2020, but the two new lines would be unsupported.
// Incorrectly re-use the 2019 form here.
export { default as Form1116 } from '../fed2019/Form1116';
export { default as Form6251 } from '../fed2019/Form6251';
export { default as Form8606 } from '../fed2019/Form8606';
export { default as Form8949 } from '../fed2019/Form8949';
export { default as Form8959 } from '../fed2019/Form8959';
export { default as Form8960 } from '../fed2019/Form8960';
export { default as Form8995REIT } from '../fed2019/Form8995';
export { default as Schedule1 } from '../fed2019/Schedule1';
export { default as Schedule2 } from '../fed2019/Schedule2';
export { default as ScheduleA } from '../fed2019/ScheduleA';
export { default as ScheduleD } from '../fed2019/ScheduleD';
export { default as W2 } from '../fed2019/W2';

export { FilingStatus, Form1040Input, computeTax } from '../fed2019/Form1040';
export * from '../fed2019/Form1098';
export * from '../fed2019/Form1099B';
export * from '../fed2019/Form1099R';
export * from '../fed2019/Form1116';
export * from '../fed2019/Form8949';
export * from '../fed2019/Schedule1';
export * from '../fed2019/ScheduleD';
export * from '../fed2019/W2';

export { default as TaxReturn } from './TaxReturn';
