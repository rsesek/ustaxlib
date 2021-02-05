// Copyright 2021 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { default as TaxReturn_2020, Constants as Constants_2020 } from '../fed2020/TaxReturn';

import { FilingStatus } from '.';

// Rev. Proc 2020-45: https://www.irs.gov/pub/irs-drop/rp-20-45.pdf
export const Constants = {
  ...Constants_2020,

  taxBrackets: {
    [FilingStatus.MarriedFilingJoint]: [
      [ 19_900, 0.10, 0 ],
      [ 81_050, 0.12, 1_990 ],
      [ 172_750, 0.22, 9_328 ],
      [ 329_850, 0.24, 29_502 ],
      [ 418_850, 0.32, 67_206 ],
      [ 628_300, 0.35, 95_686 ],
      [ Infinity, 0.37, 168_993.50 ]
    ],
    [FilingStatus.Single]: [
      [ 9_950, 0.10, 0 ],
      [ 40_525, 0.12, 995 ],
      [ 86_375 , 0.22, 4_664 ],
      [ 164_925, 0.24, 14_751 ],
      [ 209_425, 0.32, 33_603 ],
      [ 523_600, 0.35, 47_843 ],
      [ Infinity, 0.37, 157_804.25 ]
    ],
    [FilingStatus.MarriedFilingSeparate]: [
      [ 9_950, 0.10, 0 ],
      [ 40_525, 0.12, 995 ],
      [ 86_375, 0.22, 4_664 ],
      [ 164_925, 0.24, 14_751 ],
      [ 209_425, 0.32, 33_603 ],
      [ 314_150, 0.35, 47_843 ],
      [ Infinity, 0.37, 84_496.75 ]
    ],
  },

  standardDeduction: {
    [FilingStatus.MarriedFilingJoint]: 25_100,
    [FilingStatus.Single]: 12_550,
    [FilingStatus.MarriedFilingSeparate]: 12_550,
  },

  capitalGains: {
    rate0MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 80_800,
      [FilingStatus.Single]: 40_400,
      [FilingStatus.MarriedFilingSeparate]: 40_400,
    },
    rate15MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 501_600,
      [FilingStatus.MarriedFilingSeparate]: 250_800,
      [FilingStatus.Single]: 445_850,
    },
  },

  qualifiedBusinessIncomeDeductionThreshold: {
    [FilingStatus.MarriedFilingJoint]: 329_800,
    [FilingStatus.MarriedFilingSeparate]: 164_925,
    [FilingStatus.Single]: 164_900,
  },

  amt: {
    exemption: {
      [FilingStatus.MarriedFilingJoint]: 114_600,
      [FilingStatus.Single]: 73_600,
      [FilingStatus.MarriedFilingSeparate]: 57_300,
    },
    phaseout: {
      [FilingStatus.MarriedFilingJoint]: 1_047_200,
      [FilingStatus.Single]: 523_600,
      [FilingStatus.MarriedFilingSeparate]: 523_600,
    },
    limitForRate28Percent: {
      [FilingStatus.MarriedFilingJoint]: 199_900,
      [FilingStatus.Single]: 199_900,
      [FilingStatus.MarriedFilingSeparate]: 99_950,
    },
  },

  prevYearStandardDeduction: Constants_2020.standardDeduction,
};

export default class TaxReturn extends TaxReturn_2020 {
  readonly constants = Constants;

  get year() { return 2021; }
}
