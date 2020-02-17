import Form from './Form';
import { Person, Relation } from './Person';

export default class TaxReturn {
  private _year: number;
  private _people: Person[] = [];
  private _forms: Form[] = [];

  constructor(year: number) {
    this._year = year;
  }

  get year(): number {
    return this._year;
  }

  addPerson(person: Person) {
    if (person.relation == Relation.Dependent) {
      throw new UnsupportedFeatureError('Dependents are not supported');
    }
    if (person.relation == Relation.Self || person.relation == Relation.Spouse) {
      const others = this._people.filter(p => p.relation == person.relation);
      if (others.length > 0) {
        throw new InconsistencyError('Cannot have more than one Self or Spouse');
      }
    }
    this._people.push(person);
  }

  getPerson(name: RegExp | string): Person {
    const people = this._people.filter(p => p.name.search(name) !== -1);
    if (people.length != 1) {
      throw new Error(`Person ${name} not found or too imprecise`);
    }
    return people[0];
  }

  addForm(form: Form) {
  }
};

export class InconsistencyError extends Error {
};

export class UnsupportedFeatureError extends Error {
};
