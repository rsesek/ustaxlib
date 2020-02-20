import TaxReturn from './TaxReturn';
import { Person } from './Person';
import Form, { SupportsMultipleCopies } from './Form';
import { NotFoundError, InconsistencyError } from './Errors';

test('constructor', () => {
  const tr = new TaxReturn(2019);
  expect(tr.year).toBe(2019);
});

test('does not support Dependents', () => {
  const tr = new TaxReturn(2019);
  const p = Person.dependent('Baby');
  expect(() => tr.addPerson(p)).toThrow('Dependents are not supported');
});

test('add more than one Self', () => {
  const tr = new TaxReturn(2019);
  const p1 = Person.self('A');
  tr.addPerson(p1);
  const p2 = Person.self('B');
  expect(() => tr.addPerson(p2)).toThrow('Cannot have more than one Self or Spouse');
});

test('add more than one Spouse', () => {
  const tr = new TaxReturn(2019);
  const p1 = Person.spouse('A');
  tr.addPerson(p1);
  const p2 = Person.spouse('B');
  expect(() => tr.addPerson(p2)).toThrow('Cannot have more than one Self or Spouse');
});

test('add Self and Spouse', () => {
  const tr = new TaxReturn(2019);
  const self = Person.self('Billy Bob');
  const spouse = Person.spouse('Jilly Bob');
  tr.addPerson(self);
  tr.addPerson(spouse);

  expect(tr.getPerson('Billy')).toBe(self);
  expect(tr.getPerson('Jilly')).toBe(spouse);

  expect(() => tr.getPerson('Bob')).toThrow('too imprecise');
});

test('get non-existent person', () => {
  const tr = new TaxReturn(2019);
  const self = Person.self('Billy Bob');
  tr.addPerson(self);

  expect(tr.getPerson('Billy Bob')).toBe(self);
  expect(() => tr.getPerson('Jilly')).toThrow('not found');
});

test('single-copy forms', () => {
  class TestForm extends Form {
    get name(): string { return 'Test Form'; }

    protected getLines() { return []; }
  };

  const tr = new TaxReturn(2019);
  const f = new TestForm();
  tr.addForm(f);
  expect(() => tr.addForm(new TestForm)).toThrow(InconsistencyError);
  expect(tr.getForm(f.name)).toBe(f);
});

test('multiple-copy forms', () => {
  class TestForm extends Form implements SupportsMultipleCopies {
    get name(): string { return 'Test Form'; }

    aggregate(forms: Form[]): this { return null; }

    protected getLines() { return []; }
  };

  const tr = new TaxReturn(2019);
  const f1 = new TestForm();
  const f2 = new TestForm();
  const f3 = new TestForm();
  tr.addForm(f1);
  tr.addForm(f2);

  expect(() => tr.getForm(f1.name)).toThrow(InconsistencyError);

  const forms = tr.getForms(f1.name);
  expect(forms.length).toBe(2);
  expect(forms).toContain(f1);
  expect(forms).toContain(f2);
  expect(forms).not.toContain(f3);
});

test('get non-existent form', () => {
  const tr = new TaxReturn(2019);
  expect(() => tr.getForm('form')).toThrow(NotFoundError);
  expect(tr.getForms('form')).toEqual([]);
});
