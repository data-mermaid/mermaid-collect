angular.module('mermaid.libs').service('utils', [
  '$interpolate',
  '$q',
  function($interpolate, $q) {
    'use strict';
    const alerts = {};
    var utils = {
      messages: {
        deleteRecordWarning:
          'Deleting {{count}} record{{plural}}. Are you sure?'
      },
      project_statuses: { open: 90, test: 80, locked: 10 },
      statuses: {
        primary: { color: '#2196F3', icon: 'fa-exclamation-circle' },
        info: { color: '#B3E5FC', icon: 'fa-info-circle' },
        success: { color: '#739e73', icon: 'fa-check-circle' },
        warning: { color: '#c79121', icon: 'fa-warning' },
        error: { color: '#a90329', icon: 'fa-times-circle' }
      },
      roles: { admin: 90, collector: 50, readonly: 10 },
      management_rules: {
        no_take: { label: 'No Take', name: 'no_take' },
        periodic_closure: {
          label: 'Periodic Closure',
          name: 'periodic_closure'
        },
        open_access: { label: 'Open Access', name: 'open_access' },
        size_limits: { label: 'Size Limits', name: 'size_limits' },
        gear_restriction: {
          label: 'Gear Restriction',
          name: 'gear_restriction'
        },
        species_restriction: {
          label: 'Species Restriction',
          name: 'species_restriction'
        }
      },
      showAlert: function(title, message, status, timeout, options) {
        options = options || {};
        status = status || utils.statuses.info;

        const isFooterAlert = options.isFooterAlert || false;
        const canClose = options.canClose == null || options.canClose === true;
        const alertId = options.id;
        const deferred = $q.defer();
        const popupOpts = {
          title: title,
          html: true,
          content: message,
          color: status.color,
          icon: 'fa ' + status.icon + ' swing animated'
        };
        let call;
        let boxSelector;
        let alertCounter;

        if (timeout == null) {
          popupOpts.timeout = 3000;
        } else if (timeout !== 0) {
          popupOpts.timeout = timeout;
        }

        function close() {
          if (alerts[alertId]) {
            delete alerts[alertId];
          }
          deferred.resolve();
        }

        if (alerts[alertId]) {
          // Already showing don't display again
          return deferred.promise;
        }

        if (isFooterAlert) {
          call = $.bigBox;
          alertCounter = window.BigBoxes;
          boxSelector = `#bigBox${alertCounter}`;
        } else {
          call = $.smallBox;
          alertCounter = window.SmallBoxes;
          boxSelector = `#smallBox${alertCounter}`;
        }
        call(popupOpts, close);

        const $box = $(boxSelector);

        if (alertId != null) {
          alerts[alertId] = boxSelector;
        }

        // Applying post display options
        if (canClose === false) {
          $box.find('.botClose').remove();
        }

        return deferred.promise;
      },
      errorAlert: function(error) {
        if (error.status === 400) {
          var errors = [];
          _.each(error.data, function(v, k) {
            errors.push('<li>' + k + ': ' + v[0] + '</li>');
          });
          error = '<ul>' + errors.join('') + '</ul>';
        }
        return utils.showAlert('Error', error, utils.statuses.error, 5000);
      },
      generateUuid: function() {
        var d = new Date().getTime();
        if (
          window.performance &&
          typeof window.performance.now === 'function'
        ) {
          d += performance.now(); //use high-precision timer if available
        }
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
          /[xy]/g,
          function(c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
          }
        );
        return uuid;
      },
      isUuid: function(str) {
        if (str[0] === '{') {
          str = str.substring(1, str.length - 1);
        }
        var regexGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return regexGuid.test(str);
      },
      assignUniqueId: function(records, attribute) {
        var uid;

        if (!records) {
          return records;
        }

        attribute = attribute || '$$uid';
        if (_.isArray(records)) {
          for (let i = 0; i < records.length; i++) {
            if (records[i][attribute] != null) {
              continue;
            }

            records[i][attribute] = utils.generateUuid();
          }
        } else {
          uid = records[attribute] || utils.generateUuid();
          records[attribute] = uid;
        }
        return records;
      },
      showConfirmation: function(
        confirmedCallback,
        title,
        message,
        buttons,
        cancelCallback
      ) {
        if (
          !angular.isDefined(window.SmartMSGboxCount) ||
          window.SmartMSGboxCount === 0
        ) {
          title = title || '';
          message = message || 'Are you sure?';
          confirmedCallback = confirmedCallback || function() {};
          cancelCallback = cancelCallback || function() {};
          buttons = buttons || '[No][Yes]';
          var getButtons = _.words(buttons, /\[.*?\]/g);
          $.SmartMessageBox(
            {
              title: title,
              content: message,
              buttons: buttons
            },
            function(ButtonPressed) {
              if (ButtonPressed === _.trim(getButtons[1], '[]')) {
                confirmedCallback();
              } else if (ButtonPressed === _.trim(getButtons[0], '[]')) {
                cancelCallback();
              }
            }
          );
        }
      },
      template: function(template, args) {
        var expression = $interpolate(template);
        return expression(args);
      },
      templateArgs: function(rows) {
        var row_count = rows.length;
        var args = { count: row_count };
        if (row_count !== 1) {
          args.plural = 's';
        }
        return args;
      },
      truthy: function(v) {
        var truths = ['t', 'true', 1, 'T', 'True', true];
        return truths.indexOf(v) > -1;
      },
      safe_division: function(numerator, denominator) {
        if (
          Number.isFinite(numerator) &&
          Number.isFinite(denominator) &&
          denominator !== 0
        ) {
          return numerator / denominator;
        } else {
          return null;
        }
      },
      safe_multiply: function(v1, v2) {
        if (Number.isFinite(v1) && Number.isFinite(v2)) {
          return v1 * v2;
        } else {
          return null;
        }
      },
      safe_subtract: function(v1, v2) {
        if (Number.isFinite(v1) && Number.isFinite(v2)) {
          return v1 - v2;
        } else {
          return null;
        }
      },
      safe_sum: function() {
        return _.reduce(
          arguments,
          function(sum, num) {
            if (Number.isFinite(num)) {
              return sum + num;
            }
            return sum;
          },
          0.0
        );
      },
      pluralize: function(val, singluar, plural) {
        if (val === 1) {
          return singluar;
        }
        return plural;
      },
      timestamp: function() {
        return new Date().getTime();
      },
      slugify: function(str) {
        str = str.replace(/^\s+|\s+$/g, ''); // trim
        str = str.toLowerCase();

        // remove accents, swap ñ for n, etc
        var from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
        var to = 'aaaaeeeeiiiioooouuuunc------';
        for (var i = 0, l = from.length; i < l; i++) {
          str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
        }

        str = str
          .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
          .replace(/\s+/g, '-') // collapse whitespace and replace by -
          .replace(/-+/g, '-'); // collapse dashes

        return str;
      },
      getDisplayValue: function(id, displayField, table) {
        return $q.resolve(table).then(function(tbl) {
          return tbl.get(id).then(function(record) {
            if (record != null) {
              return record[displayField];
            }
            return null;
          });
        });
      },
      funcify: function(fx, value) {
        if (_.isFunction(fx)) {
          return fx;
        }
        return function() {
          if (value === undefined) {
            return fx;
          }
          return value;
        };
      },
      toMomentTime: function(datetime_string) {
        return moment.utc(datetime_string, 'YYYY-MM-DDTHH:mm:ss.SSSZ');
      },
      attachQueryParams: function(url, queryParams) {
        queryParams = queryParams || {};
        var _url = new URL(url);
        _.each(queryParams, function(v, k) {
          _url.searchParams.set(k, v);
        });
        return _url.toString();
      },
      createLookup: function(records, idAttribute, nameAttribute) {
        idAttribute = idAttribute || 'id';
        nameAttribute = nameAttribute || 'name';
        return _.reduce(
          records,
          function(obj, rec) {
            obj[rec.id] = rec;
            return obj;
          },
          {}
        );
      },
      combinations: function combination(arr) {
        let i, j, temp;
        const result = [];
        const arrLen = arr.length;
        const power = Math.pow;
        const combinations = power(2, arrLen);

        for (i = 0; i < combinations; i++) {
          temp = [];

          for (j = 0; j < arrLen; j++) {
            if (i & power(2, j)) {
              temp.push(arr[j]);
            }
          }
          if (temp.length > 0) {
            result.push(temp);
          }
        }
        return result;
      },
      relationalOperatorFunctions: {
        '==': function(a, b) {
          return a === b;
        },
        '!=': function(a, b) {
          return a !== b;
        },
        '>': function(a, b) {
          return a > b;
        },
        '>=': function(a, b) {
          return a >= b;
        },
        '<': function(a, b) {
          return a < b;
        },
        '<=': function(a, b) {
          return a <= b;
        }
      },
      parseSearchString: function(s) {
        const regex = /"(.*?)"|(\w+)/;
        const parts = s.split(regex);
        const searchItems = [];
        for (let n = 0; n < parts.length; n++) {
          let item = parts[n];

          if (item == null || item.trim().length === 0) continue;

          if (item.startsWith('"')) {
            item = item.substr(1, item.length - 2);
          }
          item = item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          searchItems.push('.*' + item + '.*');
        }
        if (searchItems.length === 1) {
          return searchItems[0];
        }
        return `(${searchItems.join('|')})`;
      }
    };
    return utils;
  }
]);
