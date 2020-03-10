import { Form, Person, TaxReturn } from '../core';
import { InputLine } from '../core/Line';

export enum Box7Code {
  _1  = '1',  // Early distribution, no known exception
  _2  = '2',  // Early distribution, exception applies
  _3  = '3',  // Disability
  _4  = '4',  // Death
  _5  = '5',  // Prohibited transaction
  _6  = '6',  // Section 1035 exchange
  _7  = '7',  // Normal distribution
  _8  = '8',  // Excess contributions plus earnings/excess deferrals taxable
  _9  = '9',  // Cost of current life insurance protection
  A   = 'A',  // May be eligible for 10-year tax option
  B   = 'B',  // Designated Roth account distribution
  C   = 'C',  // Reportable death benefits under section 6050Y
  D   = 'D',  // Annuity payments from nonqualified annuities that may be subject to tax under section 1411.
  E   = 'E',  // Distributions under Employee Plans Compliance Resolution System (EPCRS).
  F   = 'F',  // Charitable gift annuity.
  G   = 'G',  // Direct rollover of a distribution to a qualified plan, a section 403(b) plan, a governmental section 457(b) plan, or an IRA.
  H   = 'H',  // Direct rollover of a designated Roth account distribution to a Roth IRA.
  J   = 'J',  // Early distribution from a Roth IRA, no known exception (in most cases, under age 59½).
  K   = 'K',  // Distribution of traditional IRA assets not having a readily available FMV.
  L   = 'L',  // Loans treated as distributions.
  M   = 'M',  // Qualified plan loan offset.
  N   = 'N',  // Recharacterized IRA contribution made for 2019 and recharacterized in 2019.
  P   = 'P',  // Excess contributions plus earnings/excess deferrals (and/or earnings) taxable in 2018.
  Q   = 'Q',  // Qualified distribution from a Roth IRA. R—Recharacterized IRA contribution made for 2018 and recharacterized in 2019.
  S   = 'S',  // Early distribution from a SIMPLE IRA in first 2 years, no known exception (under age 59½).
  T   = 'T',  // Roth IRA distribution, exception applies.
  U   = 'U',  // Dividend distribution from ESOP under section 404(k).
  W   = 'W',  // Charges or payments for purchasing qualified long-term care insurance contracts under combined arrangements.  If the IRA/SEP/SIMPLE box is checked,you've received a traditional IRA, SEP, or SIMPLE distribution.
};

export interface Form1099RInput {
  payer: string;
  payee: Person;
  grossDistribution: number;
  taxableAmount: number;
  taxableAmountNotDetermined: boolean;
  totalDistribution: boolean;
  capitalGain?: number;
  fedIncomeTax?: number;
  employeeContributionsOrDesignatedRothContributions?: number;
  distributionCodes?: Box7Code[];
  iraSepSimple?: boolean;
  firstYearOfDesignatedRothContributions?: number;
};

class Input<T extends keyof Form1099RInput> extends InputLine<Form1099RInput, T> {};

export default class Form1099R extends Form<Form1099R['_lines'], Form1099RInput> {
  readonly name = '1099-R';

  readonly supportsMultipleCopies = true;

  protected readonly _lines = {
    'payer': new Input('payer'),
    'recipeint': new Input('payee'),
    '1': new Input('grossDistribution'),
    '2a': new Input('taxableAmount'),
    '2b.1': new Input('taxableAmountNotDetermined'),
    '2b.2': new Input('totalDistribution'),
    '3': new Input('capitalGain'),
    '4': new Input('fedIncomeTax'),
    '5': new Input('employeeContributionsOrDesignatedRothContributions'),
    '7': new Input('distributionCodes'),
    '7.1': new Input('iraSepSimple'),
    '11': new Input('firstYearOfDesignatedRothContributions'),
  };
};
