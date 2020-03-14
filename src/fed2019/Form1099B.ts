// Copyright 2020 Blue Static <https://www.bluestatic.org>
// This program is free software licensed under the GNU General Public License,
// version 3.0. The full text of the license can be found in LICENSE.txt.
// SPDX-License-Identifier: GPL-3.0-only

import { Form, Person, TaxReturn } from '../core';
import { InputLine } from '../core/Line';

export enum GainType {
  ShortTerm = 'ST',
  LongTerm  = 'LT',
  Ordinary  = 'O',
};

export interface SpecialProceeds {
  collectibles?: boolean;
  qof?: boolean;
};

export interface IRSReporting {
  grossProceeds?: boolean;
  netProceeds?: boolean;
};

export interface Form1099BInput {
  payer: string;
  payee: Person;
  description: string;
  dateAcquired?: string;
  dateSold?: string;
  proceeds: number;
  costBasis: number;
  accruedMarketDiscount?: number;
  washSaleLossDisallowed?: number;
  gainType: GainType;
  specialProceeds?: SpecialProceeds;
  fedIncomeTax?: number;
  nonCoveredSecurity?: boolean;
  irsReporting?: IRSReporting;
  disallowedLoss?: boolean;
  profitOnClosedContracts?: number;
  unrealizedProfitOnOpenContractsCurrentTY?: number;
  unrealizedProfitOnOpenContractsNextTY?: number;
  aggregateProfitOnContracts?: number;
  basisReportedToIRS?: boolean;
  bartering?: number;
};

class Input<T extends keyof Form1099BInput> extends InputLine<Form1099BInput, T> {};

export default class Form1099B extends Form<Form1099B['_lines'], Form1099BInput> {
  readonly name = '1099-B';

  readonly supportsMultipleCopies = true;

  person() { return this.getInput('payee'); }

  protected readonly _lines = {
    'payer': new Input('payer'),
    'recipient': new Input('payee'),
    '1a': new Input('description'),
    '1b': new Input('dateAcquired'),
    '1c': new Input('dateSold'),
    '1d': new Input('proceeds'),
    '1e': new Input('costBasis'),
    '1f': new Input('accruedMarketDiscount'),
    '1g': new Input('washSaleLossDisallowed'),
    '2': new Input('gainType'),
    '3': new Input('specialProceeds'),
    '4': new Input('fedIncomeTax'),
    '5': new Input('nonCoveredSecurity'),
    '6': new Input('irsReporting'),
    '7': new Input('disallowedLoss'),
    '8': new Input('profitOnClosedContracts'),
    '9': new Input('unrealizedProfitOnOpenContractsCurrentTY'),
    '10': new Input('unrealizedProfitOnOpenContractsNextTY'),
    '11': new Input('aggregateProfitOnContracts'),
    '12': new Input('basisReportedToIRS'),
    '13': new Input('bartering')
  };
};
