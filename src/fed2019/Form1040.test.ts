// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';
import { NotFoundError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form1099B from './Form1099B';
import Form1099R, { Box7Code } from './Form1099R';
import Schedule2 from './Schedule2';
import ScheduleA from './ScheduleA';
import ScheduleD, { ScheduleDTaxWorksheet } from './ScheduleD';
import Form8606 from './Form8606';
import Form8959 from './Form8959';
import Form8949 from './Form8949';
import TaxReturn from './TaxReturn';
import W2 from './W2';

test('w2 wages', () => {
  const pa = Person.self('A');
  const pb = Person.spouse('B');
  const tr = new TaxReturn();
  tr.addPerson(pa);
  tr.addPerson(pb);
  tr.addForm(new W2({
    employer: 'AA',
    employee: pa,
    wages: 130000.00,
    fedIncomeTax: 0,
    medicareWages: 0,
  }));
  tr.addForm(new W2({
    employer: 'BB',
    employee: pb,
    wages: 36.32,
    fedIncomeTax: 0,
    medicareWages: 0,
  }));
  const f1040 = new Form1040({ filingStatus: FilingStatus.MarriedFilingJoint });
  tr.addForm(f1040);
  tr.addForm(new Schedule2);
  expect(f1040.getValue(tr, '1')).toBe(130036.32);
  f1040.getValue(tr, '23');
});

test('interest income', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1099INT({
    payer: 'Bank',
    payee: p,
    interest: 100,
    taxExemptInterest: 0,
    interestOnUsSavingsBondOrTreas: 30
  }));
  tr.addForm(new Form1099INT({
    payer: 'Bank 2',
    payee: p,
    interest: 3.50,
    taxExemptInterest: 95
  }));

  const f1040 = new Form1040();
  tr.addForm(f1040);

  expect(f1040.getValue(tr, '2a')).toBe(95);
  expect(f1040.getValue(tr, '2b')).toBe(133.5);
});

test('dividend income', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  const f1099div = new Form1099DIV({
    payer: 'Brokerage',
    payee: p,
    ordinaryDividends: 100,
    qualifiedDividends: 75,
    totalCapitalGain: 100
  });
  tr.addForm(f1099div);
  tr.addForm(f1099div);

  const f1040 = new Form1040();
  tr.addForm(f1040);

  expect(f1040.getValue(tr, '3a')).toBe(75 * 2);
  expect(f1040.getValue(tr, '3b')).toBe(200);
});

test('tax-exempt interest', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1099DIV({
    payer: 'Brokerage',
    payee: p,
    exemptInterestDividends: 100,
  }));
  tr.addForm(new Form1099INT({
    payer: 'Bank',
    payee: p,
    interest: 0,
    taxExemptInterest: 50
  }));

  const f1040 = new Form1040();
  tr.addForm(f1040);

  expect(f1040.getValue(tr, '2a')).toBe(150);
});

test('capital gain/loss', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new W2({
    employer: 'Money',
    employee: p,
    wages: 150000
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    longTermBasisReported: [
      {
        description: '10 FNDC',
        proceeds: 1000,
        costBasis: 800,
      }
    ]
  }));
  tr.addForm(new Form8949);
  tr.addForm(new ScheduleD());
  tr.addForm(new ScheduleDTaxWorksheet());
  tr.getForm(ScheduleD).getValue(tr, '21');
  tr.getForm(Form1040).getValue(tr, '12a');
});

test('require Form8959', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new W2({
    employer: 'Company',
    employee: p,
    wages: 400000,
  }));
  const f1040 = new Form1040({
    filingStatus: FilingStatus.MarriedFilingSeparate,
  });
  tr.addForm(f1040);
  tr.addForm(new Schedule2);

  expect(() => f1040.getValue(tr, '15')).toThrow(NotFoundError);
  expect(() => f1040.getValue(tr, '15')).toThrow('Form8959');
  expect(f1040.getValue(tr, '1')).toBe(400000);
  expect(f1040.getValue(tr, '8b')).toBe(400000);
});

test('backdoor and megabackdoor roth', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addPerson(p);
  tr.addForm(new Form1099R({
    payer: 'Roth',
    payee: p,
    grossDistribution: 6000,
    taxableAmount: 6000,
    taxableAmountNotDetermined: true,
    totalDistribution: true,
    fedIncomeTax: 0,
    distributionCodes: [Box7Code._2],
    iraSepSimple: true
  }));
  tr.addForm(new Form1099R({
    payer: '401k',
    payee: p,
    grossDistribution: 27500,
    taxableAmount: 0,
    taxableAmountNotDetermined: false,
    totalDistribution: false,
    fedIncomeTax: 0,
    employeeContributionsOrDesignatedRothContributions: 27500,
    distributionCodes: [Box7Code.G],
    iraSepSimple: false
  }));
  tr.addForm(new Form8606({
    person: p,
    nondeductibleContributions: 6000,
    traditionalIraBasis: 0,
    distributionFromTradSepOrSimpleIraOrMadeRothConversion: true,
    contributionsMadeInCurrentYear: 0,
    distributionsFromAllTradSepSimpleIras: 0,
    valueOfAllTradSepSimpleIras: 0,
    amountConvertedFromTradSepSimpleToRoth: 6000
  }));
  const f = new Form1040();
  tr.addForm(f);

  expect(f.getValue(tr, '4a')).toBe(6000);
  expect(f.getValue(tr, '4b')).toBe(0);
});

test('itemized deductions', () => {
  const tr = new TaxReturn();
  const f = new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  });
  tr.addForm(f);
  tr.addForm(new ScheduleA({
    charitableGiftsCashOrCheck: 26000
  }));

  expect(f.getValue(tr, '9')).toBe(26000);
});

test('itemized deductions, forced', () => {
  const tr = new TaxReturn();
  const f = new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  });
  tr.addForm(f);
  tr.addForm(new ScheduleA({
    stateAndLocalIncomeAndSalesTaxes: 10000,
    forceItemize: true
  }));

  expect(f.getValue(tr, '9')).toBe(10000);
});
