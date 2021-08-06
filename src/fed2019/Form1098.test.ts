// Copyright 2021 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';

import Form1040, { FilingStatus } from './Form1040';
import { Form1098, MortgageInterestDeductionWorksheet } from './Form1098';
import TaxReturn from './TaxReturn';

test('grandfathered debt', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint,
  }));
  tr.addForm(new Form1098({
    recipient: 'Bank',
    payee: p,
    mortgageInterestReceived: 20_000,
    outstandingMortgagePrincipal: 2_000_000,
    mortgageOriginationDate: new Date('1980-01-02'),
  }));
  const ws = new MortgageInterestDeductionWorksheet();
  tr.addForm(ws);

  expect(ws.getValue(tr, '1')).toBe(2_000_000);
  expect(ws.getValue(tr, '2')).toBe(0);
  expect(ws.getValue(tr, '5')).toBe(2_000_000);
  expect(ws.getValue(tr, '7')).toBe(0);
  expect(ws.getValue(tr, '11')).toBe(2_000_000);
  expect(ws.deductibleMortgateInterest(tr)).toBe(20_000);
});

test('pre-limitation debt', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint,
  }));
  tr.addForm(new Form1098({
    recipient: 'Bank',
    payee: p,
    mortgageInterestReceived: 20_000,
    outstandingMortgagePrincipal: 2_000_000,
    mortgageOriginationDate: new Date('2010-01-02'),
  }));
  const ws = new MortgageInterestDeductionWorksheet();
  tr.addForm(ws);

  expect(ws.getValue(tr, '1')).toBe(0);
  expect(ws.getValue(tr, '2')).toBe(2_000_000);
  expect(ws.getValue(tr, '5')).toBe(2_000_000);
  expect(ws.getValue(tr, '7')).toBe(0);
  expect(ws.getValue(tr, '11')).toBe(1_000_000);
  expect(ws.getValue(tr, '14')).toBe(0.5);
  expect(ws.getValue(tr, '15')).toBe(10_000);
  expect(ws.deductibleMortgateInterest(tr)).toBe(10_000);
});

test('limited debt', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint,
  }));
  tr.addForm(new Form1098({
    recipient: 'Bank',
    payee: p,
    mortgageInterestReceived: 20_000,
    outstandingMortgagePrincipal: 2_000_000,
    mortgageOriginationDate: new Date('2020-01-02'),
  }));
  const ws = new MortgageInterestDeductionWorksheet();
  tr.addForm(ws);

  expect(ws.getValue(tr, '1')).toBe(0);
  expect(ws.getValue(tr, '2')).toBe(0);
  expect(ws.getValue(tr, '5')).toBe(0);
  expect(ws.getValue(tr, '7')).toBe(2_000_000);
  expect(ws.getValue(tr, '11')).toBe(750_000);
  expect(ws.getValue(tr, '14')).toBe(0.375);
  expect(ws.getValue(tr, '15')).toBe(7_500);
  expect(ws.deductibleMortgateInterest(tr)).toBe(7_500);
});
