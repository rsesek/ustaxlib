# ustaxlib Change Log

## 2.0.0
- Upgrade to TypeScript 4 and simplify Form declarations.
- Add support for overlay modules:
    - Overlay modules inherit all the forms of the parent module, but specific forms can be replaced
      if they have changed since the prior year.
    - TaxReturns now have `constants` property, to inject inflation-adjusted constants, which is
      what most year-to-year changes require.
    - Add the **fed2020** module as an overlay to **fed2019**.
    - Add the **fed2021** module as an overlay to **fed2020**.
    - Some common values on `Form1040` are now accessed symbolically in referencing forms, to make
      them immune against year-to-year line number shifts.
- The `Line` class now supports a `LineOptions` to hold less-common options.
    - Currently there is only a `formatType`.
- Add limited support for ISO options exercises to AMT/Form 6251.

## 1.1.0
- Add support for itemized deductions/Schedule A.
- Add limited support for the AMT/Form 6251.

## 1.0.2
- Only publish the dist/ folder.

## 1.0.1
- Include examples in the NPM package.

## 1.0.0
Initial release.
