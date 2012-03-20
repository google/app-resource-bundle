#!/usr/bin/python

import httplib, urllib, sys


# enumerate all Javascript files that you want to compile.
js_file_list = [
  'arb_editor.js'
]

# export those functions that will be called from HTML.
export_symbols = """
  goog.exportSymbol('arb_editor', arb_editor);
  goog.exportProperty(arb_editor.prototype, 'decorate',
                      arb_editor.prototype.decorate);

  goog.exportSymbol('arb', arb);
  goog.exportProperty(arb, 'getResource', arb.getResource);
  goog.exportProperty(arb, 'register', arb.register);
  goog.exportProperty(arb, 'setResourceSelector', arb.setResourceSelector);
  goog.exportProperty(arb, 'getParamFromUrl', arb.getParamFromUrl);
  goog.exportProperty(arb, 'localizeHtml', arb.localizeHtml);
"""

# arb core library is not compiled here, extern its symbols that will be used
# by arb_editor code.
extern_symbols = """
  var arb;
  arb.getResource = function(opt_a) {};
  arb.getParamFromUrl = function(a) {};
  arb.setResourceSelector = function(a) {};
  arb.iterateRegistry = function(a) {};
  arb.localizeHtml = function() {};
  arb.msg = function(a, opt_b) {};
  arb.isEmpty = function(a) {};
"""


def main():
  debug = False
  if (len(sys.argv) > 1):
    if sys.argv[1] == '--debug':
      debug = True

  # all js code will be grouped together as one big string.
  js_code = ''
  for file in js_file_list:
    js_code += open(file, 'rb').read()

  js_code += export_symbols

  # Define the parameters for the POST request.
  # Encode parameters to URL-safe format.
  params = [
      ('js_code', js_code),
      ('js_externs', extern_symbols),
      ('use_closure_library', 'true'),
      ('output_format', 'text'),
      ('output_info', 'compiled_code'),
   ]

  if debug:
    params.append(('compilation_level', 'WHITESPACE_ONLY'))
    params.append(('formatting', 'pretty_print'))
    params.append(('formatting', 'print_input_delimiter'))
  else:
    params.append(('compilation_level', 'ADVANCED_OPTIMIZATIONS'))

  encoded_params = urllib.urlencode(params);

  # Always use the following value for the Content-type header.
  headers = { "Content-type": "application/x-www-form-urlencoded" }
  conn = httplib.HTTPConnection('closure-compiler.appspot.com')
  conn.request('POST', '/compile', encoded_params, headers)
  response = conn.getresponse()
  data = response.read()

  # save the compiled js code to file.
  f = open('arb_editor_min.js', 'w')
  f.write(data)
  f.close()

  conn.close

if __name__ == "__main__":
  main()
