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

describe('arbcore', function() {

  describe('arb.dbg.getType', function() {
    var resource = {
      '#title': 'Randall Boggs Demo',
      '@#title': {
          'context': 'arb_ref_app'
      },
      '#logo@src': 'images/001.jpg',
      '@#logo@src': {
          'context': 'arb_ref_app',
          'type': 'image',
          'description': 'logo image, 128x128'
      },

      '#localstyle': '#res_tree {background-color: #F5F7F7} ' +
          '#res_entry {background-color: #F5F7F7}',
      '@#localstyle': {
          'context': 'arb_ref_app',
          'type': 'css',
          'description': 'locale specific css'
      }
    };

    it('should return resource type', function() {
      var attr = arb.dbg.getType(resource, '#title');
      expect(attr).toEqual('');

      attr = arb.dbg.getType(resource, '#logo@src');
      expect(attr).toEqual('image');

      attr = arb.dbg.getType(resource, '#localstyle');
      expect(attr).toEqual('css');

      attr = arb.dbg.getType(resource, '@#localstyle');
      expect(attr).toEqual('attr');
    });
  });

  describe('arb.iterateRegistry', function() {
    var items = [];

    beforeAll( function() {
      arb.register(['namespace1:en', 'en', ''], {'k':'namespace1:en'});
      arb.register('namespace1:ja', {'k':'v'});
      arb.register('namespace2:ja', {'k':'v'});
      arb.register('namespace3:en', {'k':'v'});

      arb.iterateRegistry(function(namespace) {
        items.push(namespace);
      });
    });

    it('should return all namespaces', function() {
      expect(items).toContain('en');
      expect(items).toContain('');
      expect(items).toContain('namespace1:en');
      expect(items).toContain('namespace1:ja');
      expect(items).toContain('namespace2:ja');
      expect(items).toContain('namespace3:en');
    });

    afterAll(function() {arb.resourceMap_ = {};});
  });

  describe('arb.getResource', function() {
    beforeAll( function() {
      arb.setResourceSelector('');
      arb.register(['namespace1:en', 'en', ''], {'k':'namespace1:en'});
    });

    it('should return the only resource with no selectors', function() {
      expect(arb.getResource().k).toEqual('namespace1:en');
    });
    it('should return the only resource with empty selectors', function() {
      expect(arb.getResource('').k).toEqual('namespace1:en');
    });
    it('should return the only resource with full selectors', function() {
      expect(arb.getResource('namespace1:en').k).toEqual('namespace1:en');
    });
    it('should return the only resource with any selectors', function() {
      expect(arb.getResource('namespace1:ja').k).toEqual('namespace1:en');
      expect(arb.getResource('namespace2:ja').k).toEqual('namespace1:en');
    });

    afterAll(function() {arb.resourceMap_ = {};});
  });

  describe('arb.getResource(2)', function() {
    beforeAll( function() {
      arb.setResourceSelector('');
      arb.register(['namespace1:en', 'namespace1'], {'k':'namespace1:en'});
      arb.register(['namespace2:ja'], {'k':'namespace2:ja'});
    });

    it('should return default resource with no selectors', function() {
      expect(arb.getResource().k).toEqual('namespace1:en');
    });
    it('should return default resource with empty selectors', function() {
      expect(arb.getResource('').k).toEqual('namespace1:en');
    });
    it('should return resource with partial matched selectors', function() {
      expect(arb.getResource('namespace1').k).toEqual('namespace1:en');
    });
    it('should return resource with partial matched selectors(2)', function() {
      expect(arb.getResource('namespace2').k).toEqual('namespace2:ja');
    });
    it('should return resource with priority match', function() {
      expect(arb.getResource('namespace1:ja').k).toEqual('namespace1:en');
    });
    it('should return resource with best match of selectors', function() {
      expect(arb.getResource('ja').k).toEqual('namespace2:ja');
    });

    afterAll(function() {arb.resourceMap_ = {};});
  });

  describe('arb.getResource with global resource selectors', function() {
    beforeAll( function() {
      arb.setResourceSelector('ja');
      arb.register(['namespace1:en', 'namespace1'], {'k':'namespace1:en'});
      arb.register(['namespace2:en', 'namespace2'], {'k':'namespace2:en'});
      arb.register(['namespace2:ja'], {'k':'namespace2:ja'});
    });

    it('should return resource suitable for global selectors', function() {
      expect(arb.getResource().k).toEqual('namespace2:ja');
      expect(arb.getResource('namespace2').k).toEqual('namespace2:ja');
    });

    it('should return resource first satisfy getResource parameters', function() {
      expect(arb.getResource('namespace1').k).toEqual('namespace1:en');
    });

    afterAll(function() {arb.resourceMap_ = {};});
  });

  describe('arb.dbg.isInContext', function() {
    var resource = {
      '#res1': 'Resource 1',
      '@#res1': {
          'context': 'main:level1'
      },
      'res2': 'global resource'
    };

    it('match exact context', function() {
      expect(arb.dbg.isInContext(resource, '#res1', 'main:level1')).toBeTruthy();
    });
    it('should not match different context', function() {
      expect(arb.dbg.isInContext(resource, '#res1', 'main:level2')).toBeFalsy();
    });
    it('should not match partial prefix context', function() {
      expect(arb.dbg.isInContext(resource, '#res1', 'main:lev')).toBeFalsy();
    });
    it('match prefix context', function() {
      expect(arb.dbg.isInContext(resource, '#res1', 'main')).toBeTruthy();
    });
    it('match default globalo context', function() {
      expect(arb.dbg.isInContext(resource, 'res2', 'main:level2')).toBeTruthy();
    });
  });

  describe('arb.msg in dealing with placeholder', function() {
    it('should handle named parameter replacement', function() {
      var str = '{arg1} chased {arg2}.';
      expect(arb.msg(str)).toEqual('{arg1} chased {arg2}.');
      expect(arb.msg(str), 'tom').toEqual('{arg1} chased {arg2}.');
      expect(arb.msg(str, {'arg1': 'tom'})).toEqual('tom chased {arg2}.');
      expect(arb.msg(str, {'arg1': 'tom', 'arg2': 'jerry'}))
      .toEqual('tom chased jerry.');
    });
  });

});
