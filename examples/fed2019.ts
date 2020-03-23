import { Person } from 'ustaxlib/core';
import {
  Form1040,
    FilingStatus,
    QDCGTaxWorksheet,
  Form1099B,
  Form1099DIV,
  Form1099INT,
  Form1116,
    ForeignIncomeCategory,
  Form8949,
  Form8959,
  Form8960,
  Schedule1,
    SALTWorksheet,
  Schedule2,
  ScheduleD,
  TaxReturn,
  W2,
    Box13
} from 'ustaxlib/fed2019';

const tr = new TaxReturn();

const adam = Person.self('Adam');
const steve = Person.spouse('Steve');

tr.addPerson(adam);
tr.addPerson(steve);

tr.addForm(new Form1040({ filingStatus: FilingStatus.MarriedFilingJoint }));

// W-2
tr.addForm(new W2({
  employer: 'Widgets Ltd.',
  employee: adam,
  wages: 106122.07,
  fedIncomeTax: 16919.86,
  socialSecurityWages: 26580,
  socialSecuirtyTax: 1647.96,
  medicareWages: 109922.07,
  medicareTax: 2223.168,
  box12: [
    { code: 'D', amount: 19000.00 },
    { code: 'W', amount: 4500.00 }
  ],
  box13: Box13.RetirementPlan
}));
tr.addForm(new W2({
  employer: 'ACME Co.',
  employee: steve,
  wages: 17922.22,
  fedIncomeTax: 1644.19,
  socialSecurityWages: 18606,
  socialSecuirtyTax: 8239.80,
  medicareWages: 1153.57,
  medicareTax: 298.4422,
  box12: [
    { code: 'D', amount: 19000.00 },
  ],
  box13: Box13.RetirementPlan
}));

// Investments
tr.addForm(new Form1099INT({
  payer: 'Banco Savings',
  payee: steve,
  interest: 92.17,
}));
tr.addForm(new Form1099INT({
  payer: 'Banco Checking',
  payee: steve,
  interest: 6.15,
}));
tr.addForm(new Form1099DIV({
  payer: 'Banco Brokerage',
  payee: adam,
  ordinaryDividends: 110.04,
  qualifiedDividends: 81.11,
  totalCapitalGain: 8.88,
  foreignTaxPaid: 42.44,
}));
tr.addForm(new Form1099B({
  payer: 'Banco Brokerage',
  payee: steve,
  shortTermBasisReported: [
    {
      description: 'VARIOUS',
      proceeds: 18527.27,
      costBasis: 19291.09,
    }
  ],
  longTermBasisReported: [
    {
      description: 'VARIOUS',
      proceeds: 13897.39,
      costBasis: 15112.26,
    }
  ],
  longTermBasisUnreported: [
    {
      description: 'VARIOUS',
      proceeds: 4552.76,
      costBasis: 4523.39,
    }
  ]
}));

// Joint investments
tr.addForm(new Form1099DIV({
  payer: 'Banco Brokerage',
  payee: Person.joint,
  exemptInterestDividends: 315.98,
  privateActivityBondDividends: 14.92
}));


// Joint forms
tr.addForm(new Form1116({
  person: Person.joint,
  incomeCategory: ForeignIncomeCategory.C,
  posessionName: 'RIC',
  grossForeignIncome: 918.12,
  totalForeignTaxesPaidOrAccrued: 42.44
}));
tr.addForm(new Schedule1({
  stateAndLocalTaxableRefunds: 3201,
}));
tr.addForm(new SALTWorksheet({
  prevYearSalt: 19381.13,
  limitedPrevYearSalt: 10000,
  prevYearItemizedDeductions: 0,
  prevYearFilingStatus: FilingStatus.MarriedFilingJoint
}));

tr.addForm(new Form8949);
tr.addForm(new Form8959);
tr.addForm(new Form8960);
tr.addForm(new Schedule2);
tr.addForm(new ScheduleD);
tr.addForm(new QDCGTaxWorksheet);

export default tr;
