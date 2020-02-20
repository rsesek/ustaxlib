import W2 from './FormW2';
import Person from '../Person';
import TaxReturn from '../TaxReturn';

test('input', () => {
  const p = Person.self('Bob');
  const w2 = new W2({ employer: 'Acme', employee: p, wages: 1000, fedIncomeTax: 100.40 });
  const tr = new TaxReturn(2019);
  expect(w2.getValue(tr, 'c')).toBe('Acme');
  expect(w2.getValue(tr, 'e')).toBe(p);
  expect(w2.getValue(tr, '1')).toBe(1000);
  expect(w2.getValue(tr, '2')).toBe(100.40);
});
