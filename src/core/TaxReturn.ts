// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import Form, { FormClass, isFormT } from './Form';
import Person, { Relation } from './Person';
import { NotFoundError, InconsistencyError, UnsupportedFeatureError } from './Errors';

export default abstract class TaxReturn {
  private _people: Person[] = [];
  private _forms: Form[] = [];

  abstract readonly constants;

  abstract get year(): number;

  abstract get includeJointPersonForms(): boolean;

  get forms(): Form[] {
    return [...this._forms];
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
    if (!form.supportsMultipleCopies) {
      const other = this.findForms(form.constructor as FormClass<Form>);
      if (other.length > 0) {
        throw new InconsistencyError(`Cannot have more than one type of form ${form.name}`);
      }
    }
    form.init();
    this._forms.push(form);
  }

  findForm<T extends Form>(cls: FormClass<T>): T | null {
    const forms = this.findForms(cls);
    if (forms.length == 0)
      return null;
    if (forms.length > 1)
      throw new InconsistencyError(`Form ${forms[0].name} has multiple copies`);
    return forms[0];
  }

  findForms<T extends Form>(cls: FormClass<T>): T[] {
    const forms: T[] = this._forms
        .filter((form: Form): form is T => isFormT(form, cls))
        .filter((form: T) => {
          const person = form.person();
          if (person === undefined)
            return true;

          if (person == Person.joint && this.includeJointPersonForms)
            return true;

          return this._people.includes(form.person());
        });
    return forms;
  }

  getForm<T extends Form>(cls: FormClass<T>): T {
    const form = this.findForm(cls);
    if (!form)
      throw new NotFoundError(`No form ${cls.name}`);
    return form;
  }
};
