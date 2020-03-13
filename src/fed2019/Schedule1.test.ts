import { Person } from '../core';
import { UnsupportedFeatureError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Schedule1, { Schedule1Input } from './Schedule1';
import TaxReturn from './TaxReturn';

test('state tax refund', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  tr.addForm(new Form1040({
    filingStatus: FilingStatus.Single
  }));
  const f = new Schedule1({
    stateAndLocalTaxableRefunds: 500
  });
  tr.addForm(f);

  expect(f.getValue(tr, '9')).toBe(500);
  expect(tr.getForm(Form1040).getValue(tr, '7a')).toBe(500);
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
