# ustaxlib

This project provides modules for modeling the US tax system for individuals. The `ustaxlib/core`
module provides a generic framework for defining tax return forms. And peer modules like
`ustaxlib/fed2019` provide forms for specific revisions/years of tax returns.

There is a peer project [ustaxviewer](https://github.com/rsesek/ustaxviewer) that can render a tax
return as HTML.

## Core

The `ustaxlib/core` module provides a very simple data model for tax returns:

- `TaxReturn`: An abstract class that is the root of the object graph. It holds at least one
    `Person` and several `Form`s.
- `Person`: A person for whom the `TaxReturn` is being computed.
- `Form`: An abstract class that represents a single form in the tax system. Holds one or more
    `Line`s. `Form`s optionally take an input object, the values of which are typically exposed
    by an `InputLine`.
- `Line`: An abstract class, with several concrete subclasses provided by core, that corresponds to
    a single line on a tax system form. A `Line`'s parametrized type corresponds to the type of
    value that is computed by it. Examples are:
   - `ComputedLine`: Uses a function to produce a value.
   - `ReferenceLine`: Returns the value of a specific line of a `Form`.
   - `InputLine`: Returns the value of a `Form`'s input.
   - `AccumulatorLine`: Some `Form`s can have multiple instances in a `TaxReturn`, and this line
       sums a specific line for all instances of that form type.

The core module provides what is effectively a specialized spreadsheet. Rather than sheets and rows,
there are forms and lines. A `TaxReturn` provides a way to find forms by their type, and a `Form`
provides access to the values computed by `Line`s.

## Models

Currently ustaxlib supports the following models:

- [**fed2019**](src/fed2019/README.md)

## Getting Started

To start using the software, create a new, private NPM project, and install the necessary
dependencies. This will also install the HTML viewer. Then copy an example file and run the viewer
with it.

    mkdir taxes && cd taxes
    echo '{"private":true}' > package.json
    npm i ts-node typescript ustaxlib ustaxviewer
    cp node_modules/ustaxlib/examples/fed2019.ts .
    npx ustaxviewer fed2019.ts

## Contributing

Contributions to address bugs and not-supported forms or situations are welcome. Only forms for
individuals are accepted (no estates, trusts, businesses, etc.). Please include tests with your
contribution and keep your commit history clean.

Issues should be filed on [GitHub](https://github.com/rsesek/ustaxlib).

## Anticipated Answers

### Why?

This project can be used to check the values produced by other tax software, to model expected tax
liability throughout the year, or to learn about the US tax system.

### Should I use this to file my own tax returns?

Please, heck no. There are guaranteed to be bugs in this software. The models do not support every
situation, and many more complex parts of forms are not implemented. This software is provided with
no warranty. There is no wizard/interview system; it is expected that you use the instructions on
[the IRS website](https://www.irs.gov) to set up and input data into the forms.

### How well does it work?

I have run my personal income tax information through the fed2019 model and received identical
results to the commercial tax prep software I'm using to actually file my tax returns. My situation
is moderately complex, and it exercises most of the forms in the fed2019 module. Your results may
vary.
