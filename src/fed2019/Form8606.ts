import { Form, Person, TaxReturn } from '../core';
import { Line, AccumulatorLine, ComputedLine, InputLine, ReferenceLine } from '../core/Line';
import { clampToZero, undefinedToZero } from '../core/Math';

export interface Form8606Input {
  person: Person;
  nondeductibleContributions: number;
  traditionalIraBasis: number;
  distributionFromTradSepOrSimpleIraOrMadeRothConversion: boolean;
  contributionsMadeInCurrentYear?: number;
  valueOfAllTradSepSimpleIras?: number;
  distributionsFromAllTradSepSimpleIras?: number;
  amountConvertedFromTradSepSimpleToRoth?: number;
};

class Input<T extends keyof Form8606Input> extends InputLine<Form8606Input, T> {};

export default class Form8606 extends Form<Form8606['_lines'], Form8606Input> {
  readonly name = '8606';

  readonly supportsMultipleCopies = true;

  person() { return this.getInput('person'); }

  protected readonly _lines = {
    'person': new Input('person'),

    // Part 1
    '1': new Input('nondeductibleContributions'),
    '2': new Input('traditionalIraBasis'),
    '3': new ComputedLine((tr): number => this.getValue(tr, '1') + this.getValue(tr, '2')),
    '4': new Input('contributionsMadeInCurrentYear'),
    '5': new ComputedLine((tr): number => this.getValue(tr, '3') - this.getValue(tr, '4')),
    '6': new Input('valueOfAllTradSepSimpleIras'),
    '7': new Input('distributionsFromAllTradSepSimpleIras'),
    '8': new Input('amountConvertedFromTradSepSimpleToRoth'),
    '9': new ComputedLine((tr): number => {
      return undefinedToZero(this.getValue(tr, '6')) +
             undefinedToZero(this.getValue(tr, '7')) +
             undefinedToZero(this.getValue(tr, '8'));
    }),
    '10': new ComputedLine((tr): number => this.getValue(tr, '5') / this.getValue(tr, '9')),
    '11': new ComputedLine((tr): number => this.getValue(tr, '8') * this.getValue(tr, '10'), 'Nontaxable portion converted to Roth'),
    '12': new ComputedLine((tr): number => this.getValue(tr, '7') * this.getValue(tr, '10'), 'Nontaxable portion of distributions not converted to Roth'),
    '13': new ComputedLine((tr): number => this.getValue(tr, '11') + this.getValue(tr, '12'), 'Nontaxable portion of all distributions'),
    '14': new ComputedLine((tr): number => {
      const l3 = this.getValue(tr, '3');
      if (!this.getInput('distributionFromTradSepOrSimpleIraOrMadeRothConversion'))
        return l3;
      return l3 - this.getValue(tr, '13');
    }, 'Total basis in Traditional IRAs'),
    '15a': new ComputedLine((tr): number => this.getValue(tr, '7') - this.getValue(tr, '12')),
    '15b': new ComputedLine((): number => 0, 'Amount attributable to qualified disaster distributions'),
    // 15b not supported - amount on line 15a attributable
    '15c': new ComputedLine((tr): number => this.getValue(tr, '15a') - this.getValue(tr, '15b'), 'Taxable amount'),

    // Part 2
    '16': new ReferenceLine(Form8606 as any, '8'),
    '17': new ReferenceLine(Form8606 as any, '11'),
    '18': new ComputedLine((tr): number => this.getValue(tr, '16') - this.getValue(tr, '17')),
  };
};
