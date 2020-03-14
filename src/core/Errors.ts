// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

export class InconsistencyError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, InconsistencyError.prototype);
  }
};

export class UnsupportedFeatureError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, UnsupportedFeatureError.prototype);
  }
};

export class NotFoundError extends Error {
  constructor(m: string) {
    super(m);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
};
