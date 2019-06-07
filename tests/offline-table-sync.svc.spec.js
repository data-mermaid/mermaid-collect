describe('OfflineTableSync factory sync', function() {
  var originalTimeout;
  var $rootScope;
  var $q;
  var OfflineTableSync;
  var OfflineTableMock;

  // Mock storage so we can bypass authentication.
  function storageMock() {
    var storage = { expires_at: new Date().getTime() + 100000 };

    return {
      setItem: function(key, value) {
        storage[key] = value || '';
      },
      getItem: function(key) {
        return key in storage ? storage[key] : null;
      },
      removeItem: function(key) {
        delete storage[key];
      },
      get length() {
        return Object.keys(storage).length;
      },
      key: function(i) {
        var keys = Object.keys(storage);
        return keys[i] || null;
      }
    };
  }

  window.__defineGetter__('localStorage', function() {
    return storageMock();
  });

  var runSync = function(offlineTable, updatesData) {
    return OfflineTableSync.sync(offlineTable, {
      updatesData: updatesData,
      dryRun: true,
      fetchUpdates: function() {
        return $q.resolve(updatesData);
      }
    });
  };

  beforeEach(module('mermaid.libs', 'mermaid.libs.mocks'));

  beforeEach(inject(function(
    $injector,
    _OfflineTableSync_,
    _OfflineTableMock_
  ) {
    originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

    $q = $injector.get('$q');
    $rootScope = $injector.get('$rootScope').$new();
    OfflineTableSync = _OfflineTableSync_;
    OfflineTableMock = _OfflineTableMock_;
  }));

  afterEach(function() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it('should exist', function() {
    expect(OfflineTableSync).toBeDefined();
  });

  it('[ADD - LOCAL] if local_record does NOT exist', function(done) {
    var updatesData = {
      removed: [],
      modified: [],
      added: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ]
    };
    var mockTable = new OfflineTableMock('').setMockData([]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.LOCAL_CREATE);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[UPDATE - LOCAL] if local_record `$$synced: true` AND `local_record.updated_on` is older than `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-18T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.LOCAL_PUT);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[IGNORE] if local_record `$$synced: true` AND `local_record.updated_on` is equal to `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-19T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2']).toBeUndefined();
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[UPDATE - REMOTE] if local_record `$$synced: false` AND `local_record.updated_on` is newer than `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: false,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.REMOTE_PUT);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[UPDATE - REMOTE] if local_record `$$synced: false` AND `local_record.updated_on` is older than `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: false,
        $$deleted: false,
        updated_on: '2019-02-18T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.REMOTE_PUT);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[UPDATE - REMOTE] if local_record `$$synced: false` AND `local_record.updated_on` is equal to `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: false,
        $$deleted: false,
        updated_on: '2019-02-19T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.REMOTE_PUT);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[UPDATE - REMOTE] if local_record `$$synced: true` AND `local_record.updated_on` is newer than `updated_record.updated_on`', function(done) {
    var updatesData = {
      removed: [],
      modified: [
        {
          updated_on: '2019-02-19T00:00:00.00Z',
          id: '2'
        }
      ],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.REMOTE_PUT);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[DELETE - LOCAL] if local_record `$$synced: true` AND `local_record.updated_on` is older than  OR equal to `deleted_record.created_on`', function(done) {
    var updatesData = {
      removed: [
        {
          timestamp: '2019-02-20T00:00:00.00Z',
          id: '2'
        },
        {
          timestamp: '2019-02-21T00:00:00.00Z',
          id: '3'
        }
      ],
      modified: [],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      },
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '3'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.LOCAL_DELETE);
        expect(result['3'].action).toEqual(OfflineTableSync.LOCAL_DELETE);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[DELETE - LOCAL] if local_record `$$synced: false` AND `$$deleted: true` and deleted_record exists.', function(done) {
    var updatesData = {
      removed: [
        {
          timestamp: '2019-02-18T00:00:00.00Z',
          id: '2'
        }
      ],
      modified: [],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: false,
        $$deleted: true,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.LOCAL_DELETE);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[IGNORE] if local_record `$$synced: true` AND `local_record.updated_on` is newer than `deleted_record.created_on`', function(done) {
    var updatesData = {
      removed: [
        {
          timestamp: '2019-02-18T00:00:00.00Z',
          id: '2'
        }
      ],
      modified: [],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: true,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2']).toBeUndefined();
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });

  it('[CREATE - REMOTE] if local_record `$$synced: false` AND `$$deleted: false` and deleted_record exists.', function(done) {
    var updatesData = {
      removed: [
        {
          timestamp: '2019-02-20T00:00:00.00Z',
          id: '2'
        }
      ],
      modified: [],
      added: []
    };
    var mockTable = new OfflineTableMock('').setMockData([
      {
        $$synced: false,
        $$deleted: false,
        updated_on: '2019-02-20T00:00:00.00Z',
        id: '2'
      }
    ]);
    runSync(mockTable, updatesData)
      .then(function(result) {
        expect(result['2'].action).toEqual(OfflineTableSync.REMOTE_CREATE);
      })
      .catch(function(err) {
        console.log('err', err);
      })
      .finally(done);
    $rootScope.$apply();
  });
});
