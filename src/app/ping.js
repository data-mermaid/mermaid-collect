window.ping = function() {
  'use strict';
  var start = new Date().getTime();
  return $.ajax(window.appConfig.apiUrl + 'health/', {
    cache: false,
    method: 'HEAD'
  }).then(function(data, status, jqhr) {
    const apiVersion = jqhr.getResponseHeader('http_api_version');
    const mermaidApiVersion = _.get(window, 'mermaid.apiVersion');
    const hasUpdates = _.get(window, 'mermaid.hasUpdates');
    const isDiffVersion =
      mermaidApiVersion != null && mermaidApiVersion !== apiVersion;
    if (mermaidApiVersion == null || isDiffVersion) {
      _.set(window, 'mermaid.apiVersion', apiVersion);
      if (!hasUpdates) {
        window.mermaid.hasUpdates = isDiffVersion;
      }
    }

    return new Date().getTime() - start;
  });
};
