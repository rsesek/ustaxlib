import Person from '../Person';
import TaxReturn from '../TaxReturn';

import Form1040, { FilingStatus } from './Form1040';
import Form1099INT from './Form1099INT';
import FormW2 from './FormW2';

test('w2 wages', () => {
  const pa = Person.self('A');
  const pb = Person.spouse('B');
  const tr = new TaxReturn(2019);
  tr.addForm(new FormW2({ employer: 'AA', employee: pa, wages: 1000000.00, fedIncomeTax: 0 }));
  tr.addForm(new FormW2({ employer: 'BB', employee: pb, wages: 36.32, fedIncomeTax: 0 }));
  const f1040 = new Form1040({ filingStatus: FilingStatus.MarriedFilingJoint });
  tr.addForm(f1040);
  expect(f1040.getValue(tr, '1')).toBe(1000036.32);
  f1040.getValue(tr, '23');
});

test('interest income', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1099INT({
    payer: 'Bank',
    payee: p,
    interest: 100,
    taxExemptInterest: 0
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
  expect(f1040.getValue(tr, '2b')).toBe(103.5);
});
