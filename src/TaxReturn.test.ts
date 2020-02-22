import TaxReturn from './TaxReturn';
import Person from './Person';
import Form from './Form';
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
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    protected readonly _lines = null;
  };

  const tr = new TaxReturn(2019);
  const f = new TestForm();
  tr.addForm(f);
  expect(() => tr.addForm(new TestForm)).toThrow(InconsistencyError);
  expect(tr.getForm(TestForm)).toBe(f);
  expect(tr.findForm(TestForm)).toBe(f);
});

test('multiple-copy forms', () => {
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    readonly supportsMultipleCopies = true;
    protected readonly _lines = null;
  };

  const tr = new TaxReturn(2019);
  const f1 = new TestForm();
  const f2 = new TestForm();
  const f3 = new TestForm();
  tr.addForm(f1);
  tr.addForm(f2);

  expect(() => tr.getForm(TestForm)).toThrow(InconsistencyError);
  expect(() => tr.findForm(TestForm)).toThrow(InconsistencyError);

  const forms = tr.findForms(TestForm);
  expect(forms.length).toBe(2);
  expect(forms).toContain(f1);
  expect(forms).toContain(f2);
  expect(forms).not.toContain(f3);
});

test('get non-existent form', () => {
  class TestForm extends Form<null> {
    readonly name = 'Test Form';
    protected readonly _lines = null;
  }
  const tr = new TaxReturn(2019);
  expect(() => tr.getForm(TestForm)).toThrow(NotFoundError);
  expect(tr.findForm(TestForm)).toBeNull();
  expect(tr.findForms(TestForm)).toEqual([]);
});

type FormClass<T extends Form<any>> = Function & { prototype: T };

class TR {
  private _forms: Form<any>[] = [];

  add(form: Form<any>) {
    this._forms.push(form);
  }

  find(name: string): Form<any> {
    const forms = this._forms.filter(f => f.name == name);
    if (forms.length > 0)
      return forms[0];
    return null;
  }

  find2<T extends Form<any>>(cls: FormClass<T>): T[] {
    let forms: T[] = [];
    const isT = (form: Form<any>): form is T => form.constructor === cls;
    for (let form of this._forms) {
      if (isT(form))
        forms.push(form);
    }
    return forms;
  }
};

test('type test', () => {
  class FormA extends Form<FormA['_lines']> {
    readonly name = 'Form A';
    protected readonly _lines = {};
  };
  class FormB extends Form<FormB['_lines']> {
    readonly name = 'Form B';
    readonly supportsMultipleCopies = true;
    protected readonly _lines = {};
  };

  const tr = new TR();

  tr.add(new FormA());
  tr.add(new FormB());

  expect(tr.find('Form A')).not.toBeNull();

  expect(tr.find2(FormB).length).toBe(1);

  tr.add(new FormB());
  expect(tr.find2(FormB).length).toBe(2);

});
