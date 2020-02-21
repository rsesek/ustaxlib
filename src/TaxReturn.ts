import Form from './Form';
import Person, { Relation } from './Person';
import { NotFoundError, InconsistencyError, UnsupportedFeatureError } from './Errors';

export default class TaxReturn {
  private _year: number;

  private _people: Person[] = [];
  private _forms: Form<any, unknown>[] = [];

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

  addForm(form: Form<any>) {
    if (!form.supportsMultipleCopies) {
      const other = this.getForms(form.name);
      if (other.length > 0) {
        throw new InconsistencyError(`Cannot have more than one type of form ${form.name}`);
      }
    }
    this._forms.push(form);
  }

  maybeGetForm<T extends Form<any>>(name: string): T | null {
    const forms = this.getForms<T>(name);
    if (forms.length == 0) {
      return null;
    }
    if (forms.length > 1) {
      throw new InconsistencyError(`More than 1 form named ${name}`);
    }
    return forms[0];
  }

  getForm<T extends Form<any>>(name: string): T {
    const form = this.maybeGetForm<T>(name);
    if (!form)
      throw new NotFoundError(`No form named ${name}`);
    return form;
  }

  getForms<T extends Form<any>>(name: string): T[] {
    return this._forms.filter(f => f.name == name) as T[];
  }
};
