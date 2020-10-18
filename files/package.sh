#!/bin/bash
if [[ -d release ]]; then rm -rf release; fi;

mkdir release
cp    target/*   release/
cp -r pyodide    release/
cp    index.html release/
cp  webworker.js release/
cp -r editor     release/
cd release
zip -r projection_boxes.zip ./*
mv projection_boxes.zip ../

echo "Done!"