// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';

import Form1040, { FilingStatus } from './Form1040';
import Form1099B, { Form1099BInput } from './Form1099B';
import Form8949, { Form8949Box, Form8949Total } from './Form8949';
import TaxReturn from './TaxReturn';

describe('single form', () => {
  for (const box of [Form8949Box.A, Form8949Box.B, Form8949Box.D, Form8949Box.E]) {
    test(`box ${Form8949Box[box]}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn();
      tr.addPerson(p);
      tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));

      const fieldMap: { [key: string]: keyof Form1099BInput } = {
        [Form8949Box.A]: 'shortTermBasisReported',
        [Form8949Box.B]: 'shortTermBasisUnreported',
        [Form8949Box.C]: 'shortTermUnreported',
        [Form8949Box.D]: 'longTermBasisReported',
        [Form8949Box.E]: 'longTermBasisUnreported',
        [Form8949Box.F]: 'longTermUnreported',
      };
      const field = fieldMap[box];

      tr.addForm(new Form1099B({
        payer: 'Brokerage',
        payee: p,
        [field]: [
          {
            description: '10 shares',
            proceeds: 100,
            costBasis: 110,
          }
        ],
      }));

      const form = new Form8949();
      tr.addForm(form);

      const allBoxes: (keyof Form8949['lines'])[] = ['boxA', 'boxB', 'boxC', 'boxD', 'boxE', 'boxF'];
      const otherBoxes = allBoxes.filter(b => b != `box${box}`);
      const thisBox = `box${box}` as keyof Form8949['lines'];

      let total = form.getValue(tr, thisBox);

      expect(total.proceeds).toBe(100);
      expect(total.costBasis).toBe(110);
      expect(total.adjustments).toBe(0);
      expect(total.gainOrLoss).toBe(-10);

      for (let otherBox of otherBoxes) {
        total = form.getValue(tr, otherBox);
        expect(total.proceeds).toBe(0);
        expect(total.costBasis).toBe(0);
        expect(total.adjustments).toBe(0);
        expect(total.gainOrLoss).toBe(0);
      }
    });
  }
});

test('multiple forms', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    shortTermBasisReported: [
      {
        description: '10 SCHB',
        proceeds: 55,
        costBasis: 50,
      }
    ],
    longTermBasisUnreported: [
      {
        description: '10 SCHB',
        proceeds: 55,
        costBasis: 50,
      },
      {
        description: '10 SCHF',
        proceeds: 22.40,
        costBasis: 10.10,
      }
    ],
  }));

  const form = new Form8949();
  tr.addForm(form);

  const boxA = form.getValue(tr, 'boxA');
  expect(boxA.proceeds).toBe(55);
  expect(boxA.costBasis).toBe(50);
  expect(boxA.adjustments).toBe(0);
  expect(boxA.gainOrLoss).toBe(5);

  const boxE = form.getValue(tr, 'boxE');
  expect(boxE.proceeds).toBe(77.40);
  expect(boxE.costBasis).toBe(60.10);
  expect(boxE.adjustments).toBe(0);
  expect(boxE.gainOrLoss).toBeCloseTo(17.3);

  const otherBoxes: (keyof Form8949['lines'])[] = ['boxB', 'boxC', 'boxD', 'boxF'];
  for (const otherBox of otherBoxes) {
    const other = form.getValue(tr, otherBox);
    expect(other.proceeds).toBe(0);
    expect(other.costBasis).toBe(0);
    expect(other.adjustments).toBe(0);
    expect(other.gainOrLoss).toBe(0);
  }
});

test('adjustments', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  const b1 = new Form1099B({
    payer: 'Brokerage',
    payee: p,
    shortTermBasisUnreported: [
      {
        description: '10 SCHB',
        proceeds: 55,
        costBasis: 50,
        adjustments: -10,
      }
    ],
    longTermBasisUnreported: [
      {
        description: '10 SCHB',
        proceeds: 18,
        costBasis: 25,
        adjustments: 90,
      }
    ],
    longTermBasisReported: [
      {
        description: '10 SCHF',
        proceeds: 22.40,
        costBasis: 10.10,
      }
    ]
  });
  tr.addForm(b1);

  const form = new Form8949();
  tr.addForm(form);

  const boxB = form.getValue(tr, 'boxB');
  expect(boxB.proceeds).toBe(55);
  expect(boxB.costBasis).toBe(50);
  expect(boxB.adjustments).toBe(-10);
  expect(boxB.gainOrLoss).toBe(-5);

  const boxE = form.getValue(tr, 'boxE');
  expect(boxE.proceeds).toBe(18);
  expect(boxE.costBasis).toBe(25);
  expect(boxE.adjustments).toBe(90);
  expect(boxE.gainOrLoss).toBe(83);

  const boxD = form.getValue(tr, 'boxD');
  expect(boxD.proceeds).toBe(22.40);
  expect(boxD.costBasis).toBe(10.10);
  expect(boxD.adjustments).toBe(0);
  expect(boxD.gainOrLoss).toBeCloseTo(12.30);

  const otherBoxes: (keyof Form8949['lines'])[] = ['boxA', 'boxC', 'boxF'];
  for (const otherBox of otherBoxes) {
    const other = form.getValue(tr, otherBox);
    expect(other.proceeds).toBe(0);
    expect(other.costBasis).toBe(0);
    expect(other.adjustments).toBe(0);
    expect(other.gainOrLoss).toBe(0);
  }
});
