// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { default as TaxReturn2019, Constants as Constants2019 } from '../fed2019/TaxReturn';

import { FilingStatus } from '.';

// The values are from RP-19-44: https://www.irs.gov/pub/irs-drop/rp-19-44.pdf.
//
// The double Object.assign is to work around
// https://github.com/microsoft/TypeScript/issues/38516. Using the spread
// operator directly into an object literal results in "error TS4029: Public
// property 'constants' of exported class has or is using name 'FilingStatus'
// from external module "ustaxlib/src/fed2019/TaxReturn" but cannot be named".
export const Constants = Object.assign(Object.assign({}, Constants2019, {
  taxBrackets: {
    [FilingStatus.MarriedFilingJoint]: [
      [ 19750, 0.10, 0 ],
      [ 80250, 0.12, 1975 ],
      [ 171050, 0.22, 9235 ],
      [ 326600, 0.24, 29211 ],
      [ 414700, 0.32, 66543 ],
      [ 622050, 0.35, 94735 ],
      [ Infinity, 0.37, 167307.50 ]
    ],
    [FilingStatus.Single]: [
      [ 9875, 0.10, 0 ],
      [ 40125, 0.12, 987.50 ],
      [ 85525, 0.22, 4617.50 ],
      [ 163300, 0.24, 14605.50 ],
      [ 207350, 0.32, 33271.50 ],
      [ 518400, 0.35, 47367.50 ],
      [ Infinity, 0.37, 156235 ]
    ],
    [FilingStatus.MarriedFilingSeparate]: [
      [ 9875, 0.10, 0 ],
      [ 40125, 0.12, 987.50 ],
      [ 85525, 0.22, 4617.50 ],
      [ 163300, 0.24, 14605.50 ],
      [ 207350, 0.32, 33271.50 ],
      [ 311025, 0.35, 47367.50 ],
      [ Infinity, 0.37, 83653.75 ]
    ],
  },

  standardDeduction: {
    [FilingStatus.MarriedFilingJoint]: 24800,
    [FilingStatus.Single]: 12400,
    [FilingStatus.MarriedFilingSeparate]: 12400,
  },

  capitalGains: {
    rate0MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 80000,
      [FilingStatus.Single]: 40000,
      [FilingStatus.MarriedFilingSeparate]: 40000,
    },
    rate15MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 496600,
      [FilingStatus.MarriedFilingSeparate]: 441450,
      [FilingStatus.Single]: 441450,
    },
  },

  qualifiedBusinessIncomeDeductionThreshold: {
    [FilingStatus.MarriedFilingJoint]: 326600,
    [FilingStatus.MarriedFilingSeparate]: 163300,
    [FilingStatus.Single]: 163300,
  },

  amt: {
    exemption: {
      [FilingStatus.MarriedFilingJoint]: 113400,
      [FilingStatus.Single]: 72900,
      [FilingStatus.MarriedFilingSeparate]: 56700,
    },
    phaseout: {
      [FilingStatus.MarriedFilingJoint]: 1036800,
      [FilingStatus.Single]: 518400,
      [FilingStatus.MarriedFilingSeparate]: 518400,
    },
    limitForRate28Percent: {
      [FilingStatus.MarriedFilingJoint]: 197900,
      [FilingStatus.Single]: 197900,
      [FilingStatus.MarriedFilingSeparate]: 98950,
    },
  },

  prevYearStandardDeduction: Constants2019.standardDeduction,
}));

export default class TaxReturn extends TaxReturn2019 {
  readonly constants = Constants;

  get year() { return 2020; }
}
