export enum Relation {
  Self,
  Spouse,
  Dependent,
};

export class Person {
  private _name: string;
  private _relation: Relation;

  constructor(name: string, relation: Relation) {
    this._name = name;
    this._relation = relation;
  }

  get name(): string {
    return this._name;
  }

  get relation(): Relation {
    return this._relation;
  }

  static self(name: string): Person {
    return new Person(name, Relation.Self);
  }

  static spouse(name: string): Person {
    return new Person(name, Relation.Spouse);
  }

  static dependent(name: string): Person {
    return new Person(name, Relation.Dependent);
  }
};
