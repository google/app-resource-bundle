#!/bin/bash
#
# Copyright 2012 Google Inc. All Rights Reserved.
# Author: shanjian@google.com (Shanjian Li)

echo "This script needs to be run in its current directory, the one where you can find arb_editor.html file."
echo "Ater server starts, please point your browser to http://localhost:8000/arb_editor.html"

# This is a simple one line http server.
python -m SimpleHTTPServer
