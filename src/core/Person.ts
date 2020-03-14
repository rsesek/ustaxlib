// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

export enum Relation {
  Self,
  Spouse,
  Dependent,
};

export default class Person {
  private _name: string;
  private _relation: Relation;

  static joint = Symbol('Joint') as unknown as Person;

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
