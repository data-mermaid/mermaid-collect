angular
  .module('app.project')

  .service('SubmissionService', [
    '$http',
    'utils',
    'APP_CONFIG',
    function($http, utils, APP_CONFIG) {
      'use strict';
      var SubmissionService = {
        submitCollectRecords: function(project_id, records, resolved) {
          var record_ids;
          var url =
            APP_CONFIG.apiUrl +
            'projects/' +
            project_id +
            '/collectrecords/submit/';
          if (_.isArray(records) === false) {
            records = [records];
          }

          record_ids = _.map(records, 'id');

          var payload = { id: record_ids };
          if (resolved === true) {
            payload.resolved = 1;
          }
          return $http.post(url, payload).then(function(resp) {
            if (resp.status !== 200) {
              utils.showAlert(
                'Error',
                resp.status + ': Problem during record submission.',
                utils.statuses.error
              );
              return;
            }

            return resp.data;
          });
        },

        submissionAlert: function(total, successes, warnings, errors, missing) {
          var msg = [];
          var status = utils.statuses.info;
          var review_message =
            '<strong>Please review the rows highlighted below.</strong>';
          var ignored_count = total - (successes + warnings + errors + missing);

          function wrap(text, val) {
            return '<div>' + text + val + '</div>';
          }
          msg.push(wrap('Successes: ', successes));
          msg.push(wrap('Warnings: ', warnings));
          msg.push(wrap('Errors: ', errors));
          msg.push(wrap('Missing (already submitted?): ', missing));

          if (ignored_count > 0) {
            msg.push(wrap('Ignored: ', ignored_count));
          }

          if (errors > 0) {
            status = utils.statuses.error;
            msg.push(wrap(review_message, ''));
          } else if (warnings > 0) {
            status = utils.statuses.warning;
            msg.push(wrap(review_message, ''));
          } else if (missing > 0) {
            status = utils.statuses.warning;
          } else if (successes > 0) {
            status = utils.statuses.success;
          }
          utils.showAlert('Submission Results', msg.join(''), status, 5000);
        }
      };
      return SubmissionService;
    }
  ]);
