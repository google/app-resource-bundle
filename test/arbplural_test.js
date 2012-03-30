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

var beforeAll = function(fn) {
  it('[beforeAll]', fn)
}

var afterAll = function(fn) {
  it('[afterAll]', fn)
}

describe('arbplural', function() {
  beforeAll(function() {
    arb.setPluralLanguage('en');
  });

  describe('plural regex', function() {
    it('should match plural pattern', function() {
      var str = '{NUM, plural, ' +
          '=0 {{PERSON} added nobody to her circle.} ' +
          '=1 {{PERSON} added somebody to her circle.} ' +
          'other {{PERSON} added # people to her circle.}}';

      var m = arb.PLURAL_RULE_REGEX_.exec(str);
      expect(m).not.toEqual(null);
      expect(m.length).toEqual(4);
      expect(m[0]).toEqual('{NUM, plural, ');
      expect(m[1]).toEqual('NUM');
      expect(m[2]).toEqual(undefined);
      expect(m[3]).toEqual(undefined);
    });

    it('should match plural pattern with offset', function() {
      var str = '{NUM, plural,offset:1  ' +
          '=0 {{PERSON} added nobody to her circle.} ' +
          '=1 {{PERSON} added {PERSON2} to her circle.} ' +
          'other {{PERSON} added {PERSON2} and # other people to her circle.}}';

      var m = arb.PLURAL_RULE_REGEX_.exec(str);
      expect(m).not.toEqual(null);
      expect(m.length).toEqual(4);
      expect(m[0]).toEqual('{NUM, plural,offset:1  ');
      expect(m[1]).toEqual('NUM');
      expect(m[2]).toEqual('offset:1');
      expect(m[3]).toEqual('1');
    });
  });

  describe('arb.parseBranches_', function() {
    it('parse branches correctly', function() {
      var str = '=0 {{PERSON} added nobody to her circle.} ' +
          '=1 {{PERSON} added somebody to her circle.} ' +
          'other {{PERSON} added # people to her circle.}}';
      var branches = arb.parseBranches_(str);
      var result = {
        '0': '{PERSON} added nobody to her circle.',
        '1': '{PERSON} added somebody to her circle.',
        'other': '{PERSON} added # people to her circle.'
      };
      expect(branches).toEqual(result);
    });
  });

  describe('arb.processPluralRules_', function() {
    var str = '{NUM, plural, ' +
        '=0 {{PERSON} added nobody to her circle.} ' +
        'one {{PERSON} added somebody to her circle.} ' +
        'other {{PERSON} added # people to her circle.}}';

    it('pick up number rule', function() {
      expect(arb.processPluralRules_(str, {'NUM': 0}))
          .toEqual('{PERSON} added nobody to her circle.');
      expect(arb.processPluralRules_(str, {'NUM': 1}))
          .toEqual('{PERSON} added somebody to her circle.');
    });

    it('pick up other rule', function() {
      expect(arb.processPluralRules_(str, {'NUM': 3}))
          .toEqual('{PERSON} added 3 people to her circle.');
    });
  });

  it('should process plural rule with offset', function() {
    var str = '{NUM, plural,offset:1  ' +
        '=0 {{PERSON} added nobody to her circle.} ' +
        '=1 {{PERSON} added {PERSON2} to her circle.} ' +
        'one {{PERSON} added {PERSON2} and # other person to her circle.} ' +
        'other {{PERSON} added {PERSON2} and # other people to her circle.}}';

    expect(arb.processPluralRules_(str, {'NUM': 0}))
        .toEqual('{PERSON} added nobody to her circle.');
    expect(arb.processPluralRules_(str, {'NUM': 1}))
        .toEqual('{PERSON} added {PERSON2} to her circle.');
    expect(arb.processPluralRules_(str, {'NUM': 2}))
        .toEqual('{PERSON} added {PERSON2} and 1 other person to her circle.');
    expect(arb.processPluralRules_(str, {'NUM': 3}))
        .toEqual('{PERSON} added {PERSON2} and 2 other people to her circle.');
  });

  describe('arb.msg in dealing with plural', function() {
    var str = '{NUM, plural, ' +
        '=0 {{PERSON} added nobody to her circle.} ' +
        'one {{PERSON} added somebody to her circle.} ' +
        'many {{PERSON} added many people to her circle.} ' +
        'other {{PERSON} added # people to her circle.}}';

    it('pick up number rule from en_US locale', function() {
      expect(arb.msg(str, {'NUM': 0}))
          .toEqual('{PERSON} added nobody to her circle.');
      expect(arb.msg(str, {'NUM': 1}))
          .toEqual('{PERSON} added somebody to her circle.');
    });

    it('pick up other rule from en_US locale', function() {
      expect(arb.msg(str, {'NUM': 3}))
          .toEqual('{PERSON} added 3 people to her circle.');
    });

    it('should not work with invalid locale like enUS', function() {
      arb.setPluralLanguage('enUS');
      expect(arb.msg(str, {'NUM': 1}))
          .toEqual('{PERSON} added 1 people to her circle.');
    });

    it('should work with locale like ro', function() {
      arb.setPluralLanguage('br');
      expect(arb.msg(str, {'NUM': 1}))
          .toEqual('{PERSON} added somebody to her circle.');
      expect(arb.msg(str, {'NUM': 3}))
          .toEqual('{PERSON} added 3 people to her circle.');
      expect(arb.msg(str, {'NUM': 6}))
          .toEqual('{PERSON} added many people to her circle.');
    });
  });

  it('should process plural rule with offset', function() {
    var str = '{NUM, plural,offset:1  ' +
        '=0 {{PERSON} added nobody to her circle.} ' +
        '=1 {{PERSON} added {PERSON2} to her circle.} ' +
        'one {{PERSON} added {PERSON2} and # other person to her circle.} ' +
        'other {{PERSON} added {PERSON2} and # other people to her circle.}}';

    expect(arb.msg(str, {'NUM': 0}))
        .toEqual('{PERSON} added nobody to her circle.');
    expect(arb.msg(str, {'NUM': 1}))
        .toEqual('{PERSON} added {PERSON2} to her circle.');
    expect(arb.msg(str, {'NUM': 2}))
        .toEqual('{PERSON} added {PERSON2} and 1 other person to her circle.');
    expect(arb.msg(str, {'NUM': 3}))
        .toEqual('{PERSON} added {PERSON2} and 2 other people to her circle.');
  });

});
