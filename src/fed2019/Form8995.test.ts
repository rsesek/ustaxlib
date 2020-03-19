// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';

import Form1040, { FilingStatus } from './Form1040';
import Form1099B, { GainType } from './Form1099B';
import Form1099DIV from './Form1099DIV';
import Form8949 from './Form8949';
import Form8995REIT from './Form8995';
import ScheduleD from './ScheduleD';
import TaxReturn from './TaxReturn';

test('REIT QBI no Schedule D', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new Form1099DIV({
    payer: 'Brokerage',
    payee: p,
    ordinaryDividends: 50000,
    qualifiedDividends: 35000,
    totalCapitalGain: 7500,
    section199ADividends: 2220,
  }));

  const f = new Form8995REIT();
  tr.addForm(f);

  expect(f.getValue(tr, '28')).toBe(2220);
  expect(f.getValue(tr, '31')).toBe(444);
  expect(f.getValue(tr, '32')).toBe(444);
  expect(f.getValue(tr, '33')).toBe(50000 - 12200);
  expect(f.getValue(tr, '34')).toBe(35000);
  expect(f.getValue(tr, '39')).toBe(444);
  expect(f.getValue(tr, '40')).toBe(0);
  expect(tr.getForm(Form1040).getValue(tr, '10')).toBe(444);
});

test('REIT QBI with Schedule D', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new Form1099DIV({
    payer: 'Brokerage',
    payee: p,
    ordinaryDividends: 50000,
    qualifiedDividends: 35000,
    totalCapitalGain: 7500,
    section199ADividends: 2220,
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage2 ',
    payee: p,
    description: '100 VTI',
    proceeds: 230000,
    costBasis: 221000,
    gainType: GainType.LongTerm,
    basisReportedToIRS: true
  }));
  tr.addForm(new Form8949);
  tr.addForm(new ScheduleD);

  const f = new Form8995REIT();
  tr.addForm(f);

  expect(f.getValue(tr, '28')).toBe(2220);
  expect(f.getValue(tr, '31')).toBe(444);
  expect(f.getValue(tr, '32')).toBe(444);
  expect(f.getValue(tr, '33')).toBe(50000 + 7500 + 9000 - 12200);
  expect(f.getValue(tr, '34')).toBe(35000 + 7500 + 9000);
  expect(f.getValue(tr, '39')).toBe(444);
  expect(f.getValue(tr, '40')).toBe(0);
  expect(tr.getForm(Form1040).getValue(tr, '10')).toBe(444);
});
