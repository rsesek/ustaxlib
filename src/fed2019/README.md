# ustaxlib/fed2019

Forms for US tax year 2019.

# Supported Scenarios

This supports the following filing statues:

- Single
- Married Filing Joint
- Married Filing Separate

# Supported Forms

The following forms are at least partially supported:

- **Form 1040:** Individual income tax return
- **Schedule 1:** Additional income and adjustments
- **Schedule 2:** Additional taxes
- **Schedule 3:** Additional credits and payments
- **Schedule B:** _This form is not directly modeled, and instead the computations are done on
    1040._
- **Schedule A:** Itemized deductions
- **Schedule D:** Capital gains and losses
- **Form 1099-B:** Proceeds from broker transactions
- **Form 1099-DIV:** Dividend income
- **Form 1099-INT:** Interest income
- **Form 1099-R:** Retirement account distributions
- **Form 1116:** Foreign tax credit
- **Form 6251:** Alternative Minimum Tax _without Form 1116 and Schedule D recalculation_
- **Form 8606:** Nondeductible IRAs
- **Form 8949:** Sales and dispositions of capital assets
- **Form 8959:** Additional medicare tax
- **Form 8960:** Net investment income tax
- **Form 8995:** Qualified business income deduction _for REIT dividends only_
- **W2:** Wages

However several credits and situations are not supported. Check the code file for each form for details.

# Warning

The U.S. tax code is incredibly complicated. This software is meant to help understand how the tax
system works, to verify output from other software (assuming that __this__ software is correct), and
to model/project various tax situations.
