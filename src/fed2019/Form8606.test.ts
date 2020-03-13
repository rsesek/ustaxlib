import { Person } from '../core';

import Form1040, { FilingStatus } from './Form1040';
import Form8606 from './Form8606';
import TaxReturn from './TaxReturn';

test('skip part 1', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  const f = new Form8606({
    person: p,
    nondeductibleContributions: 6000,
    traditionalIraBasis: 0,
    distributionFromTradSepOrSimpleIraOrMadeRothConversion: false
  });
  tr.addForm(f);

  expect(f.getValue(tr, '14')).toBe(6000);
});

test('Roth conversion no basis', () => {
  const p = Person.self('A');
  const tr = new TaxReturn();
  const f = new Form8606({
    person: p,
    nondeductibleContributions: 6000,
    traditionalIraBasis: 0,
    distributionFromTradSepOrSimpleIraOrMadeRothConversion: true,
    contributionsMadeInCurrentYear: 0,
    valueOfAllTradSepSimpleIras: 0,
    distributionsFromAllTradSepSimpleIras: 0,
    amountConvertedFromTradSepSimpleToRoth: 6000,
  });
  tr.addForm(f);

  expect(f.getValue(tr, '9')).toBe(6000);
  expect(f.getValue(tr, '13')).toBe(6000);
  expect(f.getValue(tr, '14')).toBe(0);
  expect(f.getValue(tr, '15c')).toBe(0);
  expect(f.getValue(tr, '16')).toBe(6000);
  expect(f.getValue(tr, '17')).toBe(6000);
  expect(f.getValue(tr, '18')).toBe(0);
});
