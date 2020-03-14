// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { TaxReturn as BaseTaxReturn } from '../core';

import Form1040, { FilingStatus } from './Form1040';

export default class TaxReturn extends BaseTaxReturn {
  get year() { return 2019; }

  get includeJointPersonForms() {
    return this.getForm(Form1040).filingStatus == FilingStatus.MarriedFilingJoint;
  }
};
