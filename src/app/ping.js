window.ping = function() {
  'use strict';
  var start = new Date().getTime();
  return $.ajax(window.appConfig.apiUrl + 'health/', {
    cache: false,
    method: 'HEAD'
  }).then(function() {
    return new Date().getTime() - start;
  });
};
