/*
 * Copyright 2012 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Application Resource Bundle (ARB) plural support library.
 * This file contains data and methods to provide plural support in ARB
 * message substitution. Plural rules are based on the latest CLDR(1.9)
 * release. It should cover all the languages available in CLDR.
 *
 * @author shanjian@google.com (Shanjian Li)
 */


/**
 * Regular expression to identify plural message.
 * @type {RegExp}
 * @private
 */
arb.PLURAL_RULE_REGEX_ = /^\{\s*(\w+)\s*,\s*plural\s*,(\s*offset:(\d+))?\s*/;


/**
 * The locale used for selecting plural rules.
 * @type {string}
 * @private
 */
arb.pluralLanguage_ = 'en';


/**
 * Sets plural rules locale.
 */
arb.setPluralLanguage = function(language) {
  if (language in arb.pluralRuleMap_) {
    arb.pluralLanguage_ = language;
  } else {
    arb.pluralLanguage_ = '$$';
  }
}


/**
 * Processes plural message.
 * If it is a plural message, a branch selected based on plural rule will be
 * returned for further processing. Otherwise, original message will be
 * returned. In either case, non-plural related placeholder won't be touched.
 *
 * @param {string} str original message string.
 * @param {string} opt_values if it is a map, its key/value will be
 *     interpreted as named argument. Otherwise, it should be interpreted as
 *     positional argument.
 * @return {string} string after plural processing is done.
 * @private
 */
arb.processPluralRules_ = function(str, opt_values) {
  var m = arb.PLURAL_RULE_REGEX_.exec(str);
  if (!m) {
    return str;
  }

  var type = typeof opt_values;
  var arg;
  if (type == 'object' || type == 'function') {
    if (!(m[1] in opt_values)) {
      return str;
    }
    arg = opt_values[m[1]];
  } else {
    var order = parseInt(m[1]);
    if (m[1] != '' + order || order >= arguments.length) {
      return str;
    }
    arg = arguments[order];
  }

  var branches = arb.parseBranches_(str.substring(m[0].length));
  if (!branches) {
    return str;
  }

  if (arg in branches) {
    return branches['' + arg];
  }

  if (typeof arg != 'number') {
    return str;
  }

  var offset = m[3] ? parseInt(m[3]) : 0;

  var rule = arb.getRuleName(arg - offset);

  if (rule in branches) {
    return branches[rule].replace('#', arg - offset);
  }

  if ('other' in branches) {
    return branches['other'].replace('#', arg - offset);
  }

  return str;
};


/**
 * Parses the branches parts of a plural message into a map of selective
 * branches.
 *
 * @param {string} str plural message string to be parsed.
 * @return {?Object.<string, string>} a map of plural key name to plural
 *     select branch or null if parsing failed.
 * @private
 */
arb.parseBranches_ = function(str) {
  var branches = {};
  var regex = /(?:=(\d+)|(\w+))\s+\{/;
  while (true) {
    if (str.charAt(0) == '}') {
      return branches;
    }

    var m = regex.exec(str);
    if (!m) {
      return null;
    }
    var key = m[1] ? m[1] : m[2];
    str = str.substring(m[0].length);
    var openBrackets = 1;
    var i;
    for (i = 0; i < str.length && openBrackets > 0; i++) {
      var ch = str.charAt(i);
      if (ch == '}') {
        openBrackets--;
      } else if (ch == '{') {
        openBrackets++;
      }
    }
    if (openBrackets != 0) {
      return null;
    }

    // grab branch content without ending "}"
    branches[key] = str.substring(0, i - 1);
    str = str.substring(i).replace(/^\s*/, '');
    if (str == '') {
      return null;
    }
  }
};


/**
 * Returns plural rule name based on given number.
 *
 * @param {number} n number for plural selection.
 * @return {string} plural rule name.
 */
arb.getRuleName = function(n) {
  return arb.pluralRules_[arb.pluralRuleMap_[arb.pluralLanguage_]](n);
};


/**
 * Collection of all possible plural rules.
 * This tables is manually created from CLDR 1.9. Size is the biggest concern.
 * @type {Object.<number, function(number):string>}
 * @private
 */
arb.pluralRules_ = {
    // "one": "n is 1"
    0: function(n) {
        return (n == 1) ? 'one' : 'other';
    },

    // "one": "n in 0..1"
    1: function(n) {
        return (n == 0 || n == 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..10",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n mod 100 in 11..99"
    2: function(n) {
        return ((n % 100) >= 3 && (n % 100) <= 10 && n == Math.floor(n)) ?
            'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' : (n == 2) ?
            'two' : ((n % 100) >= 11 && (n % 100) <= 99 && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n mod 10 is 1 and n mod 100 is not 11",
    // "many": "n mod 10 is 0 or n mod 10 in 5..9 or n mod 100 in 11..14"
    3: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : ((n % 10) == 1 && (n % 100) != 11) ? 'one' :
            ((n % 10) == 0 || ((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 11 && (n % 100) <= 14) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n is 3",
    // "zero": "n is 0",
    // "one": "n is 1",
    // "two": "n is 2",
    // "many": "n is 6"
    4: function(n) {
        return (n == 3) ? 'few' : (n == 0) ? 'zero' : (n == 1) ? 'one' :
            (n == 2) ? 'two' : (n == 6) ? 'many' : 'other';
    },

    // "one": "n within 0..2 and n is not 2"
    5: function(n) {
        return (n >= 0 && n < 2) ? 'one' : 'other';
    },

    // "two": "n is 2",
    // "one": "n is 1"
    6: function(n) {
        return (n == 2) ? 'two' : (n == 1) ? 'one' : 'other';
    },

    // "few": "n in 2..4",
    // "one": "n is 1"
    7: function(n) {
        return (n == 2 || n == 3 || n == 4) ? 'few' :
            (n == 1) ? 'one' : 'other';
    },

    // "zero": "n is 0",
    // "one": "n within 0..2 and n is not 0 and n is not 2"
    8: function(n) {
        return (n == 0) ? 'zero' : (n > 0 && n < 2) ? 'one' : 'other';
    },

    // "few": "n mod 10 in 2..9 and n mod 100 not in 11..19",
    // "one": "n mod 10 is 1 and n mod 100 not in 11..19"
    9: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 9 &&
               ((n % 100) < 11 || (n % 100) > 19) && n == Math.floor(n)) ?
               'few' :
               ((n % 10) == 1 && ((n % 100) < 11 || (n % 100) > 19)) ? 'one' :
               'other';
    },

    // "zero": "n is 0",
    // "one": "n mod 10 is 1 and n mod 100 is not 11"
    10: function(n) {
        return (n == 0) ? 'zero' : ((n % 10) == 1 && (n % 100) != 11) ?
            'one' : 'other';
    },

    // "one": "n mod 10 is 1 and n is not 11"
    11: function(n) {
        return ((n % 10) == 1 && n != 11) ? 'one' : 'other';
    },

    // "few": "n is 0 OR n is not 1 AND n mod 100 in 1..19",
    // "one": "n is 1"
    12: function(n) {
        return (n == 1) ? 'one' :
            (n == 0 ||
             (n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'few' : 'other';
    },

    // "few": "n is 0 or n mod 100 in 2..10",
    // "one": "n is 1",
    // "many": "n mod 100 in 11..19"
    13: function(n) {
        return (n == 0 || (n % 100) >= 2 && (n % 100) <= 10 &&
                n == Math.floor(n)) ? 'few' : (n == 1) ? 'one' :
            ((n % 100) >= 11 && (n % 100) <= 19 && n == Math.floor(n)) ?
            'many' : 'other';

    },

    // "few": "n mod 10 in 2..4 and n mod 100 not in 12..14",
    // "one": "n is 1",
    // "many": "n is not 1 and n mod 10 in 0..1 or
    //          n mod 10 in 5..9 or n mod 100 in 12..14"
    14: function(n) {
        return ((n % 10) >= 2 && (n % 10) <= 4 &&
            ((n % 100) < 12 || (n % 100) > 14) && n == Math.floor(n)) ?
            'few' : (n == 1) ? 'one' :
            ((n % 10) == 0 || (n % 10) == 1 ||
             (((n % 10) >= 5 && (n % 10) <= 9) ||
            ((n % 100) >= 12 && (n % 100) <= 14)) && n == Math.floor(n)) ?
            'many' : 'other';
    },

    // "few": "n in 2..10",
    // "one": "n within 0..1"
    15: function(n) {
        return (n >= 2 && n <= 10 && n == Math.floor(n)) ? 'few' :
            (n >= 0 && n <= 1) ? 'one' : 'other';
    },

    // "few": "n mod 100 in 3..4",
    // "two": "n mod 100 is 2",
    // "one": "n mod 100 is 1"
    16: function(n) {
        var m = n % 100;
        return (m == 3 || m == 4) ? 'few' : (m == 2) ? 'two' :
               (m == 1) ? 'one' : 'other';
    },

    // No plural form
    17: function(n) {
        return 'other';
    }
};


/**
 * Mapping of locale to plural rule type.
 * @type {Object}
 * @private
 */
arb.pluralRuleMap_ = {
    'af': 0, 'ak': 1, 'am': 1, 'ar': 2,
    'be': 3, 'bem': 0, 'bg': 0, 'bh': 1, 'bn': 0, 'br': 4, 'brx': 0, 'bs': 3,
    'ca': 0, 'chr': 0, 'ckb': 0, 'cs': 7, 'cy': 4, 'da': 0, 'dz': 0,
    'el': 0, 'en': 0, 'eo': 0, 'es': 0, 'et': 0, 'eu': 0,
    'ff': 5, 'fi': 0, 'fil': 1, 'fo': 0, 'fr': 5, 'fur': 0, 'fy': 0,
    'ga': 6, 'gl': 0, 'gsw': 0, 'gu': 0, 'guw': 1,
    'ha': 0, 'he': 0, 'hi': 1, 'hr': 3,
    'is': 0, 'it': 0, 'iw': 0, 'kab': 5, 'ku': 0,
    'lag': 8, 'lb': 0, 'ln': 1, 'lt': 9, 'lv': 10,
    'mg': 1, 'mk': 11, 'ml': 0, 'mn': 0, 'mo': 12, 'mr': 0, 'mt': 13,
    'nah': 0, 'nb': 0, 'ne': 0, 'nl': 0, 'nn': 0, 'no': 0, 'nso': 1,
    'om': 0, 'or': 0,
    'pa': 0, 'pap': 0, 'pl': 14, 'ps': 0, 'pt': 0,
    'rm': 0, 'ro': 12, 'ru': 3,
    'se': 6, 'sh': 3, 'shi': 15, 'sk': 7, 'sl': 16, 'sma': 6, 'smi': 6,
    'smj': 6, 'smn': 6, 'sms': 6, 'so': 0, 'sg': 0, 'sr': 3, 'sv': 0, 'sw': 0,
    'ta': 0, 'te': 0, 'ti': 1, 'tk': 0, 'tl': 1,
    'uk': 3, 'ur': 0, 'wa': 1, 'zu': 0,
    '$$': 17   // Special item for language without plural rules.
};

