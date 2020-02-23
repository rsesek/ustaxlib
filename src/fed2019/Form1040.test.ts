import Person from '../Person';
import TaxReturn from '../TaxReturn';

import Form1040, { FilingStatus, Schedule2 } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form1099B, { GainType } from './Form1099B';
import ScheduleD from './ScheduleD';
import Form8959 from './Form8959';
import Form8949 from './Form8949';
import FormW2 from './FormW2';

test('w2 wages', () => {
  const pa = Person.self('A');
  const pb = Person.spouse('B');
  const tr = new TaxReturn(2019);
  tr.addForm(new FormW2({
    employer: 'AA',
    employee: pa,
    wages: 1000000.00,
    fedIncomeTax: 0,
    medicareWages: 0,
  }));
  tr.addForm(new FormW2({
    employer: 'BB',
    employee: pb,
    wages: 36.32,
    fedIncomeTax: 0,
    medicareWages: 0,
  }));
  const f1040 = new Form1040({ filingStatus: FilingStatus.MarriedFilingJoint });
  tr.addForm(f1040);
  tr.addForm(new Schedule2);
  tr.addForm(new Form8959);
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

test('dividend income', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
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

test('capital gain/loss', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 FNDC',
    proceeds: 1000,
    costBasis: 800,
    gainType: GainType.LongTerm,
    basisReportedToIRS: true
  }));
  Form8949.addForms(tr, []);
  tr.addForm(new ScheduleD());
  tr.getForm(ScheduleD).getValue(tr, '21');
});
