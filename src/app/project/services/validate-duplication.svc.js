angular.module('app.project').service('ValidateDuplicationService', [
  'APP_CONFIG',
  'offlineservice',
  '$rootScope',
  function(APP_CONFIG, offlineservice, $rootScope) {
    'use strict';

    var OK_VALIDATION_STATUS = 'ok';
    var WARN_VALIDATION_STATUS = 'warning';
    var SITE_PAGE = 'sites';
    var MR_PAGE = 'managements';

    var watch = function(table, page, project, checkFx) {
      table.$watch(
        function() {
          checkFx(project);
        },
        null,
        'validate-svc-' + page
      );
    };

    var watchMRs = function(project) {
      offlineservice.ProjectManagementsTable(project).then(function(table) {
        watch(table, MR_PAGE, project, checkInvalidMRs);
      });
    };

    var watchSites = function(project) {
      offlineservice.ProjectSitesTable(project).then(function(table) {
        watch(table, SITE_PAGE, project, checkInvalidSites);
      });
    };

    var checkInvalid = function(table, page) {
      return table
        .filter({
          validations: function(validations) {
            return (
              _.get(validations, 'results._root_.validate_similar.status') ===
              WARN_VALIDATION_STATUS
            );
          }
        })
        .then(function(records) {
          $rootScope.$broadcast(page, { duplicate: records.length > 0 });
        });
    };

    var checkInvalidSites = function(project) {
      return offlineservice.ProjectSitesTable(project).then(function(table) {
        return checkInvalid(table, SITE_PAGE);
      });
    };

    var checkInvalidMRs = function(project) {
      return offlineservice
        .ProjectManagementsTable(project)
        .then(function(table) {
          return checkInvalid(table, MR_PAGE);
        });
    };

    var groupSimilarObjs = function(projectTable) {
      var similarRecordFilter = {
        _fx_: function(val, record) {
          return (
            _.get(
              record,
              'validations.results._root_.validate_similar.status'
            ) === WARN_VALIDATION_STATUS
          );
        }
      };
      return projectTable.filter(similarRecordFilter)
        .then(function(invalidRecords) {
          return _.map(invalidRecords, function(invalidRecord) {
            var matches =
              _.get(
                invalidRecord,
                'validations.results._root_.validate_similar.data.matches'
              ) || [];
            matches.push(invalidRecord.id);
            matches.sort();

            return matches;
          });
        })
        .then(function(groups) {
          return _.values(
            _.reduce(
              groups,
              function(o, group) {
                o[group.join('--')] = group;
                return o;
              },
              {}
            )
          );
        });
    };

    return {
      OK_VALIDATION_STATUS: OK_VALIDATION_STATUS,
      WARN_VALIDATION_STATUS: WARN_VALIDATION_STATUS,
      SITE_PAGE: SITE_PAGE,
      MR_PAGE: MR_PAGE,
      checkInvalidMRs: checkInvalidMRs,
      checkInvalidSites: checkInvalidSites,
      groupSimilarObjs: groupSimilarObjs,
      watchSites: watchSites,
      watchMRs: watchMRs
    };
  }
]);
