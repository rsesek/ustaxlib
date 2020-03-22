// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';
import { UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Schedule1, { Schedule1Input, SALTWorksheet } from './Schedule1';
import TaxReturn from './TaxReturn';

test('non-taxable state tax refund', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));
  const w = new SALTWorksheet({
    prevYearSalt: 90000,
    limitedPrevYearSalt: 10000,
    prevYearItemizedDeductions: 25000,
    prevYearFilingStatus: FilingStatus.Single
  });
  tr.addForm(w);
  const f = new Schedule1({
    stateAndLocalTaxableRefunds: 17000
  });
  tr.addForm(f);

  expect(w.getValue(tr, '1')).toBe(17000);
  expect(w.getValue(tr, '2')).toStrictEqual([80000, true]);
  expect(w.getValue(tr, '3')).toBe(0);
  expect(w.getValue(tr, '9')).toBe(0);
  expect(tr.getForm(Form1040).getValue(tr, '7a')).toBe(0);
});

test('taxable state tax refund', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));
  const w = new SALTWorksheet({
    prevYearSalt: 7500,
    limitedPrevYearSalt: 7500,
    prevYearItemizedDeductions: 14000,
    prevYearFilingStatus: FilingStatus.Single
  });
  tr.addForm(w);
  const f = new Schedule1({
    stateAndLocalTaxableRefunds: 2000
  });
  tr.addForm(f);

  expect(w.getValue(tr, '1')).toBe(2000);
  expect(w.getValue(tr, '2')).toStrictEqual([2000, false]);
  expect(w.getValue(tr, '3')).toBe(2000);
  expect(w.getValue(tr, '9')).toBe(2000);
  expect(tr.getForm(Form1040).getValue(tr, '7a')).toBe(2000);
});

test('unsupported inputs', () => {
  const keys: (keyof Schedule1Input)[] = [
    'businessIncome',
    'otherGainsOrLosses',
    'rentalRealEstateRoyaltiesPartnershipsSCorps',
    'farmIncome',
    'businessExpensesForm2106',
    'hsaDeduction',
    'armedForcesMovingExpenses',
    'deductibleSelfEmploymentTax',
    'tuitionAndFees',
  ];
  for (const input of keys) {
    const p = Person.self('A');
    const tr = new TaxReturn();
    const f = new Schedule1({
      [input]: 100
    });
    tr.addForm(f);
    expect(() => f.getValue(tr, '9') + f.getValue(tr, '22')).toThrow(UnsupportedFeatureError);
  }
});
