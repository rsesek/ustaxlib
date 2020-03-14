// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';

import W2 from './W2';
import Form1040, { FilingStatus } from './Form1040';
import Form1099B, { GainType } from './Form1099B';
import Form1099DIV from './Form1099DIV';
import Form1099INT from './Form1099INT';
import Form8949 from './Form8949';
import Form8959 from './Form8959';
import Form8960 from './Form8960';
import Schedule2 from './Schedule2';
import ScheduleD from './ScheduleD';
import TaxReturn from './TaxReturn';

describe('net investment income tax', () => {
  const filingStatusToResult = {
    [FilingStatus.Single]: 105555,
    [FilingStatus.MarriedFilingJoint]: 55555,
    [FilingStatus.MarriedFilingSeparate]: 180555,
  };

  for (const filingStatus of Object.values(FilingStatus)) {
    test(`filing status ${filingStatus}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn();
      tr.addPerson(p);
      tr.addForm(new Form1040({ filingStatus }));
      tr.addForm(new Form1099DIV({
        payer: 'Brokerage',
        payee: p,
        ordinaryDividends: 2000,
        qualifiedDividends: 1500,
        totalCapitalGain: 55
      }));
      tr.addForm(new Form1099INT({
        payer: 'Bank',
        payee: p,
        interest: 3000
      }));
      tr.addForm(new Form1099B({
        payer: 'Brokerage',
        payee: p,
        description: '100 VTI',
        proceeds: 4000,
        costBasis: 3500,
        gainType: GainType.LongTerm,
        basisReportedToIRS: true
      }));
      tr.addForm(new Form8949);
      tr.addForm(new ScheduleD);
      tr.addForm(new W2({
        employer: 'Acme',
        employee: p,
        wages: 300000,
        fedIncomeTax: 0,
        medicareWages: 0,
        medicareTax: 0,
      }));
      tr.addForm(new Form8959);
      tr.addForm(new Schedule2);

      const f = new Form8960();
      tr.addForm(f);

      expect(f.getValue(tr, '1')).toBe(3000);
      expect(f.getValue(tr, '2')).toBe(2000);
      expect(f.getValue(tr, '5a')).toBe(555);
      expect(f.getValue(tr, '8')).toBe(5555);
      expect(f.getValue(tr, '11')).toBe(0);
      expect(f.getValue(tr, '12')).toBe(5555);
      expect(f.getValue(tr, '13')).toBe(305555);
      expect(f.getValue(tr, '14')).toBe(Form8960.filingStatusLimit(filingStatus));
      expect(f.getValue(tr, '15')).toBe(filingStatusToResult[filingStatus]);
      expect(f.getValue(tr, '16')).toBe(5555);
      expect(f.getValue(tr, '17')).toBe(5555 * 0.038);

      expect(tr.getForm(Schedule2).getValue(tr, '8')).toBe(5555 * 0.038);
    });
  }
});

describe('no net investment income tax', () => {
  for (const filingStatus of Object.values(FilingStatus)) {
    test(`filing status ${filingStatus}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn();
      tr.addPerson(p);
      tr.addForm(new Form1040({ filingStatus }));
      tr.addForm(new Form1099DIV({
        payer: 'Brokerage',
        payee: p,
        ordinaryDividends: 2000,
        qualifiedDividends: 1500,
        totalCapitalGain: 55
      }));
      tr.addForm(new Form1099INT({
        payer: 'Bank',
        payee: p,
        interest: 3000
      }));
      tr.addForm(new Form1099B({
        payer: 'Brokerage',
        payee: p,
        description: '100 VTI',
        proceeds: 4000,
        costBasis: 3500,
        gainType: GainType.LongTerm,
        basisReportedToIRS: true
      }));
      tr.addForm(new Form8949);
      tr.addForm(new ScheduleD);
      tr.addForm(new W2({
        employer: 'Acme',
        employee: p,
        wages: 70000,
        fedIncomeTax: 0,
        medicareWages: 0,
        medicareTax: 0,
      }));
      tr.addForm(new Form8959);
      tr.addForm(new Schedule2);

      const f = new Form8960();
      tr.addForm(f);

      expect(f.getValue(tr, '17')).toBe(0);
      expect(tr.getForm(Schedule2).getValue(tr, '8')).toBe(0);
    });
  }
});
