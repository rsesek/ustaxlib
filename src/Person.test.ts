import { Person, Relation } from './Person';

test('static constructors', () => {
  let p = Person.self('Billy Bob');
  expect(p.name).toBe('Billy Bob');
  expect(p.relation).toBe(Relation.Self);

  p = Person.spouse('Sponge Bob');
  expect(p.name).toBe('Sponge Bob');
  expect(p.relation).toBe(Relation.Spouse);

  p = Person.dependent('Ted Bob');
  expect(p.name).toBe('Ted Bob');
  expect(p.relation).toBe(Relation.Dependent);
});
