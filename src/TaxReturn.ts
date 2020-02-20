import Form, { SupportsMultipleCopies, supportsMultipleCopies } from './Form';
import Person, { Relation } from './Person';
import { NotFoundError, InconsistencyError, UnsupportedFeatureError } from './Errors';

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
    if (!supportsMultipleCopies(form)) {
      const other = this.getForms(form.name);
      if (other.length > 0) {
        throw new InconsistencyError(`Cannot have more than one type of form ${form.name}`);
      }
    }
    this._forms.push(form);
  }

  getForm<T extends Form>(name: string): T {
    const forms = this.getForms<T>(name);
    if (forms.length == 0) {
      throw new NotFoundError(`No form named ${name}`);
    }
    if (forms.length > 1) {
      throw new InconsistencyError(`More than 1 form named ${name}`);
    }
    return forms[0];
  }

  getForms<T extends Form>(name: string): T[] {
    return this._forms.filter(f => f.name == name) as T[];
  }
};
