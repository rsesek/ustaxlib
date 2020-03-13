import { Form, Person } from '../core';
import { InputLine } from '../core/Line';

export interface Form1099INTInput {
  payer: string;
  payee: Person;
  interest: number;
  earlyWithdrawalPenalty?: number;
  interestOnUsSavingsBondOrTreas?: number;
  fedIncomeTax?: number;
  investmentExpenses?: number;
  foreignTaxPaid?: number;
  foreignCountryOrPosession?: string;
  taxExemptInterest?: number;
  privateActivityBondInterest?: number;
  marketDiscount?: number;
  bondPremium?: number;
  bondPremiumOnTreas?: number;
  bondPremiumOnTaxExempt?: number;
};

class Input<T extends keyof Form1099INTInput> extends InputLine<Form1099INTInput, T> {};

export default class Form1099INT extends Form<Form1099INT['_lines'], Form1099INTInput> {
  readonly name = '1099-INT';

  readonly supportsMultipleCopies = true;

  person() { return this.getInput('payee'); }

  protected readonly _lines = {
    'payer': new Input('payer'),
    'recipient': new Input('payee'),
    '1': new Input('interest'),
    '2': new Input('earlyWithdrawalPenalty'),
    '3': new Input('interestOnUsSavingsBondOrTreas'),
    '4': new Input('fedIncomeTax'),
    '5': new Input('investmentExpenses'),
    '6': new Input('foreignTaxPaid'),
    '7': new Input('foreignCountryOrPosession'),
    '8': new Input('taxExemptInterest'),
    '9': new Input('privateActivityBondInterest'),
    '10': new Input('marketDiscount'),
    '11': new Input('bondPremium'),
    '12': new Input('bondPremiumOnTreas'),
    '13': new Input('bondPremiumOnTaxExempt')
  };
};
