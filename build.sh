#!/bin/bash
cp "./src/Pipeline.js" "./dist/Pipeline.js"
java -jar compiler.jar --js "./src/Pipeline.js" --js_output_file "./dist/Pipeline.min.js"