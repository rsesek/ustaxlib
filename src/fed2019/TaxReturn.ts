import { TaxReturn as BaseTaxReturn } from '../core';

import Form1040, { FilingStatus } from './Form1040';

export default class TaxReturn extends BaseTaxReturn {
  get year() { return 2019; }

  get includeJointPersonForms() {
    return this.getForm(Form1040).filingStatus == FilingStatus.MarriedFilingJoint;
  }
};
