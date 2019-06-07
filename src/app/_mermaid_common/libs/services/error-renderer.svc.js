angular.module('mermaid.libs').service('ErrorRenderer', [
  'APP_CONFIG',
  function(APP_CONFIG) {
    'use strict';

    var unravelErrorData = function(msg, data) {
      if (_.isArray(data)) {
        _.each(data, function(v) {
          msg += unravelErrorData(msg, v);
        });
      } else if (_.isObject(data)) {
        _.each(data, function(v, k) {
          msg +=
            '<span class="field">' +
            k +
            '</span> <ul>' +
            unravelErrorData(msg, v) +
            '</ul>';
        });
      } else {
        msg += '<li>' + data + '</li>';
      }
      return msg;
    };

    function renderDefault(error) {
      var msgLength = 300;
      var status = error.status || -1;
      var statusText = error.statusText || status + ': Unknown Error';
      var data = error.data || '';
      var msg = '';
      var contact = '';

      if (typeof data === 'string') {
        msg = data;
      } else if (
        typeof data === 'object' &&
        data.detail != null &&
        typeof data.detail === 'string'
      ) {
        msg = data.detail;
      }

      if (status >= 500 || status === -1) {
        contact =
          '\nPlease contact ' +
          APP_CONFIG.systemEmail +
          ' to report the problem';
      }

      msg = msg.length > msgLength ? msg.substr(0, msgLength) + '...' : msg;
      var output = '<strong>' + statusText + '</strong>';
      if (msg.length > 0) {
        output += '<br/><p>' + msg + '</p>';
        output += '<br/><p>' + contact + '</p>';
      }
      return output;
    }

    function render400(data) {
      var msg = _.reduce(
        data,
        function(memo, val, key) {
          memo +=
            '<span class="primary field">' +
            key +
            '</span>' +
            unravelErrorData('', val);
          return memo;
        },
        ''
      );
      return '<div class="validation_errors">' + msg + '</div>';
    }

    function render(error) {
      var status = error.status || -1;
      if (status === 400) {
        return render400(error.data);
      }
      return renderDefault(error);
    }

    return {
      render: render
    };
  }
]);
