import TaxReturn from '../TaxReturn';
import Person from '../Person';

import Form1040, { FilingStatus } from './Form1040';
import Form1099B, { GainType } from './Form1099B';
import Form8949, { Form8949Box } from './Form8949';

describe('single form', () => {
  for (const box of [Form8949Box.A, Form8949Box.B, Form8949Box.D, Form8949Box.E]) {
    test(`box ${Form8949Box[box]}`, () => {
      const p = Person.self('A');
      const tr = new TaxReturn(2019);
      tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
      tr.addForm(new Form1099B({
        payer: 'Brokerage',
        payee: p,
        description: '10 shares',
        proceeds: 100,
        costBasis: 110,
        gainType: (box == Form8949Box.A || box == Form8949Box.B) ? GainType.ShortTerm : GainType.LongTerm,
        basisReportedToIRS: (box == Form8949Box.A || box == Form8949Box.D),
      }));
      Form8949.addForms(tr, []);

      const f8949s = tr.findForms(Form8949);
      expect(f8949s.length).toBe(6);

      for (let form of f8949s) {
        if (form.getValue(tr, 'Box') == box) {
          expect(form.getValue(tr, '2(d)')).toBe(100);
          expect(form.getValue(tr, '2(e)')).toBe(110);
          expect(form.getValue(tr, '2(g)')).toBe(0);
        } else {
          expect(form.getValue(tr, '2(d)')).toBe(0);
          expect(form.getValue(tr, '2(e)')).toBe(0);
          expect(form.getValue(tr, '2(g)')).toBe(0);
        }
      }
    });
  }
});

test('multiple forms', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHB',
    proceeds: 55,
    costBasis: 50,
    gainType: GainType.ShortTerm,
    basisReportedToIRS: true,
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHB',
    proceeds: 55,
    costBasis: 50,
    gainType: GainType.LongTerm,
    basisReportedToIRS: false,
  }));
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHF',
    proceeds: 22.40,
    costBasis: 10.10,
    gainType: GainType.LongTerm,
    basisReportedToIRS: false,
  }));
  Form8949.addForms(tr, []);

  const f8949s = tr.findForms(Form8949);
  expect(f8949s.length).toBe(6);

  const boxA = f8949s.filter(f => f.getValue(tr, 'Box') == Form8949Box.A).pop();
  expect(boxA.getValue(tr, '2(d)')).toBe(55);
  expect(boxA.getValue(tr, '2(e)')).toBe(50);
  expect(boxA.getValue(tr, '2(g)')).toBe(0);

  const boxE = f8949s.filter(f => f.getValue(tr, 'Box') == Form8949Box.E).pop();
  expect(boxE.getValue(tr, '2(d)')).toBe(77.40);
  expect(boxE.getValue(tr, '2(e)')).toBe(60.10);
  expect(boxE.getValue(tr, '2(g)')).toBe(0);

  const otherBoxes = f8949s.filter(f => ![Form8949Box.A, Form8949Box.E].includes(f.getValue(tr, 'Box')));
  for (const other of otherBoxes) {
    expect(other.getValue(tr, '2(d)')).toBe(0);
    expect(other.getValue(tr, '2(e)')).toBe(0);
    expect(other.getValue(tr, '2(g)')).toBe(0);
  }
});

test('adjustments', () => {
  const p = Person.self('A');
  const tr = new TaxReturn(2019);
  tr.addForm(new Form1040({ filingStatus: FilingStatus.Single }));
  const b1 = new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHB',
    proceeds: 55,
    costBasis: 50,
    gainType: GainType.ShortTerm,
    basisReportedToIRS: false,
  });
  tr.addForm(b1);
  const b2 = new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHB',
    proceeds: 18,
    costBasis: 25,
    gainType: GainType.LongTerm,
    basisReportedToIRS: false,
  });
  tr.addForm(b2);
  tr.addForm(new Form1099B({
    payer: 'Brokerage',
    payee: p,
    description: '10 SCHF',
    proceeds: 22.40,
    costBasis: 10.10,
    gainType: GainType.LongTerm,
    basisReportedToIRS: true,
  }));
  Form8949.addForms(tr, [
    { entry: b1, code: 'W', amount: -10 },
    { entry: b2, code: 'W', amount: 90 },
  ]);

  const f8949s = tr.findForms(Form8949);
  expect(f8949s.length).toBe(6);

  const boxA = f8949s.filter(f => f.getValue(tr, 'Box') == Form8949Box.B).pop();
  expect(boxA.getValue(tr, '2(d)')).toBe(55);
  expect(boxA.getValue(tr, '2(e)')).toBe(50);
  expect(boxA.getValue(tr, '2(g)')).toBe(-10);

  const boxD = f8949s.filter(f => f.getValue(tr, 'Box') == Form8949Box.D).pop();
  expect(boxD.getValue(tr, '2(d)')).toBe(22.40);
  expect(boxD.getValue(tr, '2(e)')).toBe(10.10);
  expect(boxD.getValue(tr, '2(g)')).toBe(0);

  const boxE = f8949s.filter(f => f.getValue(tr, 'Box') == Form8949Box.E).pop();
  expect(boxE.getValue(tr, '2(d)')).toBe(18);
  expect(boxE.getValue(tr, '2(e)')).toBe(25);
  expect(boxE.getValue(tr, '2(g)')).toBe(90);

  const otherBoxes = f8949s.filter(f => ![Form8949Box.B, Form8949Box.D, Form8949Box.E].includes(f.getValue(tr, 'Box')));
  for (const other of otherBoxes) {
    expect(other.getValue(tr, '2(d)')).toBe(0);
    expect(other.getValue(tr, '2(e)')).toBe(0);
    expect(other.getValue(tr, '2(g)')).toBe(0);
  }
});
