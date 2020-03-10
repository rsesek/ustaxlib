import { Person, TaxReturn } from '../core';
import { NotFoundError } from '../core/Errors';

import Form1040, { FilingStatus } from './Form1040';
import Form1099DIV from './Form1099DIV';
import Form1116 from './Form1116';
import Form8949 from './Form8949';
import Schedule3 from './Schedule3';
import ScheduleD from './ScheduleD';

test('foreign tax credit, form 1116 not required', () => {
  const filingStatusToForeignTax = {
    [FilingStatus.Single]: 200,
    [FilingStatus.MarriedFilingJoint]: 500,
    [FilingStatus.MarriedFilingSeparate]: 200
  };

  for (const filingStatus of Object.values(FilingStatus)) {
    const p = Person.self('A');
    const tr = new TaxReturn(2019);
    tr.addForm(new Form1040({ filingStatus }));
    tr.addForm(new Form8949);
    tr.addForm(new ScheduleD);
    tr.addForm(new Form1099DIV({
      payer: 'Brokerage',
      payee: p,
      ordinaryDividends: 200000,
      qualifiedDividends: 70000,
      totalCapitalGain: 300,
      foreignTaxPaid: filingStatusToForeignTax[filingStatus],
    }));
    const f = new Schedule3();
    tr.addForm(f);

    expect(f.getValue(tr, '1')).toBe(filingStatusToForeignTax[filingStatus]);
  }
});

test('foreign tax credit, form 1116 required', () => {
  const filingStatusToForeignTax = {
    [FilingStatus.Single]: 400,
    [FilingStatus.MarriedFilingJoint]: 600,
    [FilingStatus.MarriedFilingSeparate]: 400
  };

  for (const filingStatus of Object.values(FilingStatus)) {
    const p = Person.self('A');
    const tr = new TaxReturn(2019);
    tr.addForm(new Form1040({ filingStatus }));
    tr.addForm(new Form8949);
    tr.addForm(new ScheduleD);
    tr.addForm(new Form1099DIV({
      payer: 'Brokerage',
      payee: p,
      ordinaryDividends: 200000,
      qualifiedDividends: 70000,
      totalCapitalGain: 300,
      foreignTaxPaid: filingStatusToForeignTax[filingStatus],
    }));
    const f = new Schedule3();
    tr.addForm(f);

    expect(() => f.getValue(tr, '1')).toThrow(NotFoundError);
  }
});
