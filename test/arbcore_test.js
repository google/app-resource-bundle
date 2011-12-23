describe('arbcore', function() {

  beforeEach(function() {
    arb.setLocale('en_US');
  });

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
    arb.register('namespace1', 'en', {'k':'v'});
    arb.register('namespace1', 'ja', {'k':'v'});
    arb.register('namespace2', 'ja', {'k':'v'});
    arb.register('namespace3', 'en', {'k':'v'});

    var items = [];
    arb.iterateRegistry(function(namespace) {
      items.push(namespace);
    });
    it('should return all namespaces', function() {
      expect(items).toContain('namespace1:en');
      expect(items).toContain('namespace1:ja');
      expect(items).toContain('namespace2:ja');
      expect(items).toContain('namespace3:en');
    });

    it('should not return shortcut to default namespace and locale',
       function() {
         expect(items.length == 4).toBeTruthy();
    });
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
