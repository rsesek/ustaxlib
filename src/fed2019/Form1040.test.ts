import Person from '../Person';
import TaxReturn from '../TaxReturn';

import Form1040 from './Form1040';
import FormW2 from './FormW2';

test('w2 wages', () => {
  const pa = Person.self('A');
  const pb = Person.spouse('B');
  const tr = new TaxReturn(2019);
  tr.addForm(new FormW2({ employer: 'AA', employee: pa, wages: 100.00 }));
  tr.addForm(new FormW2({ employer: 'BB', employee: pb, wages: 36.32 }));
  const f1040 = new Form1040();
  expect(f1040.getValue(tr, '1')).toBe(136.32);
});
