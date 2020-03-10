import { Person, TaxReturn } from '../core';
import { UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1116, { ForeignIncomeCategory } from './Form1116';
import Form1099B, { GainType } from './Form1099B';
import Form1099DIV from './Form1099DIV';
import Form8949 from './Form8949';
import W2 from './W2';
import ScheduleD from './ScheduleD';

test('supported income category', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  const f = new Form1116({
    person: p,
    incomeCategory: ForeignIncomeCategory.C,
    posessionName: "RIC",
    grossForeignIncome: 100,
    totalForeignTaxesPaidOrAccrued: 0
  });
  tr.addForm(f);
  expect(f.getValue(tr, 'category')).toBe(ForeignIncomeCategory.C);
});

test('unsupported income categories', () => {
  for (const category of Object.values(ForeignIncomeCategory)) {
    if (category == ForeignIncomeCategory.C)
      continue;

    const p = Person.self('B');
    const tr = new TaxReturn(2019);
    const f = new Form1116({
      person: p,
      incomeCategory: category,
      posessionName: "RIC",
      grossForeignIncome: 100,
      totalForeignTaxesPaidOrAccrued: 0
    });
    tr.addForm(f);
    expect(() => f.getValue(tr, 'category')).toThrow(UnsupportedFeatureError);
  }
});

test('foreign tax credit', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  }));
  tr.addForm(new W2({
    employer: 'ACME',
    employee: p,
    wages: 697000,
  }));

  const f = new Form1116({
    person: p,
    incomeCategory: ForeignIncomeCategory.C,
    posessionName: "RIC",
    grossForeignIncome: 99,
    totalForeignTaxesPaidOrAccrued: 14
  });
  tr.addForm(f);

  expect(f.getValue(tr, '1a')).toBe(99);
  expect(f.getValue(tr, '3a')).toBe(24400);
  expect(f.getValue(tr, '3c')).toBe(24400);
  expect(f.getValue(tr, '3d')).toBe(99);
  expect(f.getValue(tr, '3e')).toBe(697000);
  expect(f.getValue(tr, '3f')).toBe(0.0001);
  expect(f.getValue(tr, '3g')).toBeCloseTo(2.44);
  expect(f.getValue(tr, '6')).toBeCloseTo(2.44);
  expect(f.getValue(tr, '7')).toBeCloseTo(96.56);
  expect(f.getValue(tr, '8')).toBe(14);
  expect(f.getValue(tr, '9')).toBe(14);
  expect(f.getValue(tr, '14')).toBe(14);
  expect(f.getValue(tr, '20')).toBe(((697000-24400) * 0.37) - 61860);
  expect(f.getValue(tr, '21')).toBeCloseTo(26.846);
  expect(f.getValue(tr, '22')).toBe(14);
  expect(f.getValue(tr, '31')).toBe(14);
  expect(f.getValue(tr, '33')).toBe(14);
});

test('no net capital losses in total income', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.MarriedFilingJoint
  }));
  tr.addForm(new W2({
    employer: 'Megacorp',
    employee: p,
    wages: 200000
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: 'SCHF',
    proceeds: 100,
    costBasis: 50,
    gainType: GainType.LongTerm,
    basisReportedToIRS: true
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: 'SCHE',
    proceeds: 60,
    costBasis: 100,
    gainType: GainType.ShortTerm,
    basisReportedToIRS: true
  }));
  tr.addForm(new Form8949);
  tr.addForm(new ScheduleD);

  const f = new Form1116({
    person: p,
    incomeCategory: ForeignIncomeCategory.C,
    posessionName: 'RIC',
    grossForeignIncome: 200,
    totalForeignTaxesPaidOrAccrued: 65
  });

  expect(tr.getForm(Form8949).getValue(tr, 'boxA').gainOrLoss).toBe(-40);
  expect(tr.getForm(Form8949).getValue(tr, 'boxD').gainOrLoss).toBe(50);
  expect(f.getValue(tr, '3e')).toBe(200050);
});
