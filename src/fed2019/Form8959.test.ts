import { Person } from '../core';
import { TaxReturn } from '../core';

import FormW2 from './FormW2';
import Form8959 from './Form8959';
import Form1040, { FilingStatus } from './Form1040';
import Schedule2 from './Schedule2';

describe('additional medicare tax', () => {
  const filingStatusToResults = {
    [FilingStatus.Single]: {
      '6': 100000,
    },
    [FilingStatus.MarriedFilingJoint]: {
      '6': 50000,
    },
    [FilingStatus.MarriedFilingSeparate]: {
      '6': 175000,
    }
  };

  for (const filingStatus of Object.values(FilingStatus)) {
    test(`filing status ${filingStatus}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn(2019);
      tr.addForm(new Form1040({ filingStatus }));
      tr.addForm(new FormW2({
        employer: 'Acme',
        employee: p,
        wages: 300000,
        fedIncomeTax: 0,
        medicareWages: 300000,
        medicareTax: 5000,
      }));

      const form = new Form8959();
      tr.addForm(new Form8959());
      tr.addForm(new Schedule2());

      expect(form.getValue(tr, '4')).toBe(300000);
      expect(form.getValue(tr, '5')).toBe(Form8959.filingStatusLimit(filingStatus));
      expect(form.getValue(tr, '6')).toBe(filingStatusToResults[filingStatus]['6']);
      expect(form.getValue(tr, '18')).toBeCloseTo(form.getValue(tr, '6') * 0.009);

      expect(form.getValue(tr, '19')).toBe(5000);
      expect(form.getValue(tr, '20')).toBe(form.getValue(tr, '1'));
      expect(form.getValue(tr, '21')).toBeCloseTo(300000 * 0.0145);
      expect(form.getValue(tr, '22')).toBeCloseTo(650);

      expect(tr.getForm(Schedule2).getValue(tr, '8')).toBe(form.getValue(tr, '18'));
      expect(tr.getForm(Form1040).getValue(tr, '17')).toBe(650);
    });
  }
});

describe('no additional medicare tax', () => {
  for (const filingStatus of Object.values(FilingStatus)) {
    test(`filing status ${filingStatus}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn(2019);
      tr.addForm(new Form1040({ filingStatus }));
      tr.addForm(new FormW2({
        employer: 'Acme',
        employee: p,
        wages: 110000,
        fedIncomeTax: 0,
        medicareWages: 110000,
        medicareTax: 5000,
      }));

      const form = new Form8959();
      tr.addForm(new Form8959());
      tr.addForm(new Schedule2());

      expect(form.getValue(tr, '4')).toBe(110000);
      expect(form.getValue(tr, '5')).toBe(Form8959.filingStatusLimit(filingStatus));
      expect(form.getValue(tr, '6')).toBe(0);
      expect(form.getValue(tr, '18')).toBe(0);

      expect(form.getValue(tr, '19')).toBe(5000);
      expect(form.getValue(tr, '20')).toBe(form.getValue(tr, '1'));
      expect(form.getValue(tr, '21')).toBeCloseTo(110000 * 0.0145);
      expect(form.getValue(tr, '22')).toBeCloseTo(3405);

      expect(tr.getForm(Schedule2).getValue(tr, '8')).toBe(form.getValue(tr, '18'));
      expect(tr.getForm(Form1040).getValue(tr, '17')).toBe(3405);
    });
  }
});
