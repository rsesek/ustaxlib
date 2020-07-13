// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';
import { UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import ScheduleA from './ScheduleA';
import TaxReturn from './TaxReturn';
import W2 from './W2';

test('medical and dental expenses, limited', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new W2({
    employee: p,
    employer: 'E',
    wages: 3000,
  }));
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));

  const f = new ScheduleA({
    medicalAndDentalExpenses: 250,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '2')).toBe(3000);
  expect(f.getValue(tr, '4')).toBe(25);
  expect(f.getValue(tr, '17')).toBe(25);
});

test('medical and dental expenses, excluded', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));
  tr.addForm(new W2({
    employee: p,
    employer: 'E',
    wages: 300000,
  }));

  const f = new ScheduleA({
    medicalAndDentalExpenses: 250,
  });
  tr.addForm(f);

  expect(tr.getForm(Form1040).getValue(tr, '7b')).toBe(300000);
  expect(f.getValue(tr, '2')).toBe(300000);
  expect(f.getValue(tr, '4')).toBe(0);
});

test('state and local taxes, un-limited', () => {
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  }));

  const f = new ScheduleA({
    stateAndLocalIncomeAndSalesTaxes: 3000,
    stateAndLocalRealEstateTaxes: 475,
    stateAndLocalPropertyTaxes: 225,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '5d')).toBe(3700);
  expect(f.getValue(tr, '5e')).toBe(3700);
  expect(f.getValue(tr, '17')).toBe(3700);
});

test('state and local taxes, limited', () => {
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  }));

  const f = new ScheduleA({
    stateAndLocalIncomeAndSalesTaxes: 21124,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '5d')).toBe(21124);
  expect(f.getValue(tr, '5e')).toBe(10000);
  expect(f.getValue(tr, '17')).toBe(10000);
});

test('charitable gifts', () => {
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  }));

  const f = new ScheduleA({
    charitableGiftsCashOrCheck: 3000,
    charitableGiftsOther: 100,
    charitableCarryOver: 22,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '14')).toBe(3122);
  expect(f.getValue(tr, '17')).toBe(3122);
});

test('all inputs', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new W2({
    employee: p,
    employer: 'E',
    wages: 3000,
  }));
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));

  const f = new ScheduleA({
    medicalAndDentalExpenses: 250,
    stateAndLocalIncomeAndSalesTaxes: 1000,
    stateAndLocalRealEstateTaxes: 1000,
    stateAndLocalPropertyTaxes: 1000,
    otherTaxes: 1000,
    unreportedMortgageInterest: 1000,
    unreportedMortagePoints: 1000,
    mortgageInsurancePremiums: 1000,
    investmentInterest: 1000,
    charitableGiftsCashOrCheck: 1000,
    charitableGiftsOther: 1000,
    charitableCarryOver: 1000,
    casualtyAndTheftLosses: 1000,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '17')).toBe(12025);
});
