import Form from '../Form';
import { Line, InputLine } from '../Line';
import Person from '../Person';

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
    'c': new Input('c', 'employer', 'Employer name'),
    'e': new Input('e', 'employee', 'Emplyee name'),
    '1': new Input('1', 'wages', 'Wages, tips, other compensation'),
    '2': new Input('2', 'fedIncomeTax', 'Federal income tax withheld'),
    '3': new Input('3', 'socialSecurityWages', 'Social security wages'),
    '4': new Input('4', 'socialSecuirtyTax', 'Social security tax withheld'),
    '5': new Input('5', 'medicareWages', 'Medicare wages and tips'),
    '6': new Input('6', 'medicareTax', 'Medicare tax withheld'),
    '7': new Input('7', 'socialSecurityTips', 'Social security tips'),
    '8': new Input('8', 'allocatedTips', 'Allocated tips'),
    '10': new Input('10', 'dependentCareBenefits', 'Dependent care benefits'),
    '11': new Input('11', 'nonqualifiedPlans','Nonqualified plans'),
    '12': new Input('12', 'box12', 'Box 12'),
    '13': new Input('13', 'box13', 'Box 13'),
    '14': new Input('14', 'box14', 'Other'),
  };
};
