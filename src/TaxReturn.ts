import Form from './Form';
import { Person, Relation } from './Person';
import { NotFoundError, InconsistencyError, UnsupportedFeatureError } from './Errors';

export default class TaxReturn {
  private _year: number;
  private _input: object;

  private _people: Person[] = [];
  private _forms: Form[] = [];

  constructor(year: number, input?: object) {
    this._year = year;
    this._input = input;
  }

  get year(): number {
    return this._year;
  }

  getInput<T>(name: string): T {
    if (!(name in this._input)) {
      throw new NotFoundError(`No input with key ${name}`);
    }
    return this._input[name] as T;
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
    if (!form.allowMultipleCopies) {
      const other = this.getForms(form.name);
      if (other.length > 0) {
        throw new InconsistencyError(`Cannot have more than one type of form ${form.name}`);
      }
    }
    this._forms.push(form);
  }

  getForm(name: string): Form {
    const forms = this.getForms(name);
    if (forms.length == 0) {
      throw new NotFoundError(`No form named ${name}`);
    }
    if (forms.length > 1) {
      throw new InconsistencyError(`More than 1 form named ${name}`);
    }
    return forms[0];
  }

  getForms(name: string): Form[] {
    return this._forms.filter(f => f.name == name);
  }
};
