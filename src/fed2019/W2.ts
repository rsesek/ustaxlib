// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person } from '../core';
import { Line, InputLine } from '../core/Line';

export enum Box13 {
  StatutoryEmployee,
  RetirementPlan,
  ThirdPartySickPay
};

export interface CodeAndAmount {
  code: string;
  amount: number;
};

export interface W2Input {
  employer: string;
  employee: Person;
  wages?: number;
  fedIncomeTax?: number;
  socialSecurityWages?: number;
  socialSecuirtyTax?: number;
  medicareWages?: number;
  medicareTax?: number;
  socialSecurityTips?: number;
  allocatedTips?: number;
  dependentCareBenefits?: number;
  nonqualifiedPlans?: number;
  box12?: CodeAndAmount[];
  box13?: Box13;
  box14?: CodeAndAmount[];
};

class Input<T extends keyof W2Input> extends InputLine<W2Input, T> {};

export default class W2 extends Form<W2['_lines'], W2Input> {
  readonly name = 'W-2';

  readonly supportsMultipleCopies = true;

  protected readonly _lines = {
    'c': new Input('employer', 'Employer name'),
    'e': new Input('employee', 'Emplyee name'),
    '1': new Input('wages', 'Wages, tips, other compensation'),
    '2': new Input('fedIncomeTax', 'Federal income tax withheld'),
    '3': new Input('socialSecurityWages', 'Social security wages'),
    '4': new Input('socialSecuirtyTax', 'Social security tax withheld'),
    '5': new Input('medicareWages', 'Medicare wages and tips'),
    '6': new Input('medicareTax', 'Medicare tax withheld'),
    '7': new Input('socialSecurityTips', 'Social security tips'),
    '8': new Input('allocatedTips', 'Allocated tips'),
    '10': new Input('dependentCareBenefits', 'Dependent care benefits'),
    '11': new Input('nonqualifiedPlans','Nonqualified plans'),
    '12': new Input('box12', 'Box 12'),
    '13': new Input('box13', 'Box 13'),
    '14': new Input('box14', 'Other'),
  };
};
