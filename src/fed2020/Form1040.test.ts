// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Person } from '../core';
import { NotFoundError } from '../core/Errors';

import { Form1040, FilingStatus } from '.';
import TaxReturn from './TaxReturn';

test('standard deduction', () => {
  const filingStatusToResult = {
    [FilingStatus.MarriedFilingJoint]: 24800,
    [FilingStatus.Single]: 12400,
    [FilingStatus.MarriedFilingSeparate]: 12400,
  };

  for (const filingStatus of Object.values(FilingStatus)) {
    const tr = new TaxReturn();
    const f = new Form1040({ filingStatus });
    tr.addForm(f);
    expect(f.getValue(tr, '9')).toBe(filingStatusToResult[filingStatus]);
  }
});
