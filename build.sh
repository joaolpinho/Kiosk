#!/bin/bash
mkdir -p ./dist/
cp "./src/Kiosk.js" "./dist/Kiosk.js"
java -jar compiler.jar --js "./src/Kiosk.js" --js_output_file "./dist/Kiosk.min.js"