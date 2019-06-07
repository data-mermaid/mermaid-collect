#!/bin/bash

MERMAID_ROOT="/path/to/mermaid_root/mermaid-collect"
SRC="/path/to/smartadmin_root/DEVELOPER/AngularJS_1.x_legacy/full-version/"

# styles
rm $SRC/styles/img/favicon/favicon.png
cp -R $SRC/styles $MERMAID_ROOT/src/
rm $MERMAID_ROOT/src/styles/css/your_style.css

# sound
cp -R $SRC/sound $MERMAID_ROOT/src/

# smartadmin-plugin
cp -R $SRC/smartadmin-plugin $MERMAID_ROOT/

# 404.html
cp $SRC/404.html $MERMAID_ROOT/src/404.html

# build
cp -R $SRC/build $MERMAID_ROOT/src/

# langs
cp -R $SRC/api/langs $MERMAID_ROOT/src/

# languages.json
cp $SRC/api/languages.json $MERMAID_ROOT/src/languages.json

# _common
cp -R $SRC/app/_common $MERMAID_ROOT/src/app/
