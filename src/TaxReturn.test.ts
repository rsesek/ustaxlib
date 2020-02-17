import TaxReturn from './TaxReturn';
import { Person } from './Person';

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
