// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { TaxReturn as BaseTaxReturn } from '../core';

import Form1040, { FilingStatus } from './Form1040';

export const Constants = {
  taxBrackets: {
    // From https://www.irs.gov/pub/irs-drop/rp-18-57.pdf, Section 3.01 and
    // https://www.irs.gov/pub/irs-pdf/p17.pdf, 2019 Tax Rate Schedules (p254).
    // Format is: [ limit-of-taxable-income, marginal-rate, base-tax ]
    // If Income is over Row[0], pay Row[2] + (Row[1] * (Income - PreviousRow[0]))
    [FilingStatus.MarriedFilingJoint]: [
      [ 19400, 0.10, 0 ],
      [ 78950, 0.12, 1940 ],
      [ 168400, 0.22, 9086 ],
      [ 321450, 0.24, 28765 ],
      [ 408200, 0.32, 65497 ],
      [ 612350, 0.35, 93257 ],
      [ Infinity, 0.37, 164709.50 ]
    ],
    [FilingStatus.Single]: [
      [ 9700, 0.10, 0 ],
      [ 39475, 0.12, 970 ],
      [ 84200, 0.22, 4543 ],
      [ 160725, 0.24, 14382.50 ],
      [ 204100, 0.32, 32748.50 ],
      [ 510300, 0.35, 46628.50 ],
      [ Infinity, 0.37, 153798.50 ]
    ],
    [FilingStatus.MarriedFilingSeparate]: [
      [ 9700, 0.10, 0 ],
      [ 39475, 0.12, 970 ],
      [ 84200, 0.22, 4543 ],
      [ 160725, 0.24, 14382.50 ],
      [ 204100, 0.32, 32748.50 ],
      [ 306175, 0.35, 46628.50 ],
      [ Infinity, 0.37, 82354.75 ]
    ]
  },

  standardDeduction: {
    [FilingStatus.MarriedFilingJoint]: 24400,
    [FilingStatus.Single]: 12200,
    [FilingStatus.MarriedFilingSeparate]: 12200,
  },

  niit: {
    rate: 0.038,
    limit: {
      [FilingStatus.MarriedFilingJoint]: 250000,
      [FilingStatus.MarriedFilingSeparate]: 125000,
      [FilingStatus.Single]: 200000,
    },
  },

  medicare: {
    withholdingRate: 0.0145,
    additionalWithholdingRate: 0.009,
    additionalWithholdingLimit: {
      [FilingStatus.Single]: 200000,
      [FilingStatus.MarriedFilingJoint]: 250000,
      [FilingStatus.MarriedFilingSeparate]: 125000,
    },
  },

  capitalGains: {
    rate0MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 78750,
      [FilingStatus.Single]: 39375,
      [FilingStatus.MarriedFilingSeparate]: 39375,
    },
    rate15MaxIncome: {
      [FilingStatus.MarriedFilingJoint]: 488850,
      [FilingStatus.MarriedFilingSeparate]: 244425,
      [FilingStatus.Single]: 434550,
    },
  },

  capitalLossLimit: {
    [FilingStatus.MarriedFilingJoint]: -3000,
    [FilingStatus.MarriedFilingSeparate]: -1500,
    [FilingStatus.Single]: -3000,
  },

  qualifiedBusinessIncomeDeductionThreshold: {
    [FilingStatus.MarriedFilingJoint]: 321450, // RP-18-57, Section 3.27 indicates this should be 321400, but it does not match the 24% tax bracket nor Sched D Tax Worksheet line 19.
    [FilingStatus.MarriedFilingSeparate]: 160725,
    [FilingStatus.Single]: 160725,
  },

  foreignTaxCreditWithoutForm1116Limit: {
    [FilingStatus.MarriedFilingJoint]: 600,
    [FilingStatus.MarriedFilingSeparate]: 300,
    [FilingStatus.Single]: 300,
  },

  saltLimit: {
    [FilingStatus.MarriedFilingJoint]: 10000,
    [FilingStatus.Single]: 10000,
    [FilingStatus.MarriedFilingSeparate]: 5000,
  },

  medicalDeductionLimitationPercent: 0.075,

  prevYearStandardDeduction: {
    [FilingStatus.MarriedFilingJoint]: 24000,
    [FilingStatus.Single]: 12000,
    [FilingStatus.MarriedFilingSeparate]: 12000,
  },

  amt: {
    exemption: {
      [FilingStatus.MarriedFilingJoint]: 111700,
      [FilingStatus.Single]: 71700,
      [FilingStatus.MarriedFilingSeparate]: 55850,
    },
    phaseout: {
      [FilingStatus.MarriedFilingJoint]: 1020600,
      [FilingStatus.Single]: 510300,
      [FilingStatus.MarriedFilingSeparate]: 510300,
    },
    limitForRate28Percent: {
      [FilingStatus.MarriedFilingJoint]: 194800,
      [FilingStatus.Single]: 194800,
      [FilingStatus.MarriedFilingSeparate]: 97400,
    },
  },
};

export default class TaxReturn extends BaseTaxReturn {
  readonly constants = Constants;

  get year() { return 2019; }

  get includeJointPersonForms() {
    return this.getForm(Form1040).filingStatus == FilingStatus.MarriedFilingJoint;
  }
};
