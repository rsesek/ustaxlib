#!/bin/sh
# Copyright 2020 Blue Static <https://www.bluestatic.org>
# This program is free software licensed under the GNU General Public License,
# version 3.0. The full text of the license can be found in LICENSE.txt.
# SPDX-License-Identifier: GPL-3.0-only

OUTDIR=./dist

set -ex

# Clean.
rm -rf $OUTDIR

# Compile.
tsc

# Drop tests from the compiled output.
find $OUTDIR -type f -name '*.test.*' -exec rm {} +

cp -r examples $OUTDIR
cp README.md $OUTDIR
cp LICENSE.txt $OUTDIR

# "Preprocess" the dist package.json.
cp ./package.json $OUTDIR
sed -i.bak -e s@\"dist/@\"@ $OUTDIR/package.json
rm $OUTDIR/package.json.bak
