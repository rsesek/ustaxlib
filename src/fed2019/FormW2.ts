import Form, { SupportsMultipleCopies } from '../Form';
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

class Input<T> extends InputLine<T, W2Input> {};

export default class W2 extends Form<W2Input> implements SupportsMultipleCopies {
  get name(): string { return 'W-2'; }

  aggregate(f: Form[]): this { return null; }

  protected getLines(): Line<any>[] {
    return [
      new Input<string>('c', 'employer', 'Employer name'),
      new Input<Person>('e', 'employee', 'Emplyee name'),
      new Input<number>('1', 'wages', 'Wages, tips, other compensation'),
      new Input<number>('2', 'fedIncomeTax', 'Federal income tax withheld'),
      new Input<number>('3', 'socialSecurityWages', 'Social security wages'),
      new Input<number>('4', 'socialSecuirtyTax', 'Social security tax withheld'),
      new Input<number>('5', 'medicareWages', 'Medicare wages and tips'),
      new Input<number>('6', 'medicareTax', 'Medicare tax withheld'),
      new Input<number>('7', 'socialSecurityTips', 'Social security tips'),
      new Input<number>('8', 'allocatedTips', 'Allocated tips'),
      new Input<number>('10', 'dependentCareBenefits', 'Dependent care benefits'),
      new Input<number>('11', 'nonqualifiedPlans','Nonqualified plans'),
      new Input<CodeAndAmount[]>('12', 'box12', 'Box 12'),
      new Input<Box13>('13', 'box13', 'Box 13'),
      new Input<CodeAndAmount[]>('14', 'box14', 'Other'),
    ];
  }
};
