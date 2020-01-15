angular.module('app.project').service('CollectService', [
  '$q',
  'logger',
  'ProjectService',
  'ValidateSubmitService',
  'offlineservice',
  'connectivity',
  function(
    $q,
    logger,
    ProjectService,
    ValidateSubmitService,
    offlineservice,
    connectivity
  ) {
    'use strict';

    /**
     * @param  {OfflineRecord} record
     * @param  {Object} options
     *    - {string} profile_id Only needed if new record
     *    - {OfflineTable} table Only needed if new record
     * @param
     */
    var save = function(record, options) {
      record.stage = ProjectService.SAVING_STAGE;
      if (!record.id) {
        record.profile = options.profileId;
        return offlineservice
          .CollectRecordsTable(options.projectId)
          .then(function(table) {
            return table.create(record).then(function(savedRecord) {
              if (connectivity.isOnline !== true) {
                savedRecord.stage = ProjectService.SAVED_STAGE;
              }
              return savedRecord.update().then(function() {
                return { record: savedRecord, isCreated: true };
              });
            });
          });
      }
      return record
        .update()
        .then(function(updatedRecord) {
          if (connectivity.isOnline !== true) {
            updatedRecord.stage = ProjectService.SAVED_STAGE;
            return updatedRecord.update();
          }
          return $q.resolve(updatedRecord);
        })
        .then(function(savedRecord) {
          return { record: savedRecord, isCreated: false };
        })
        .catch(function(err) {
          logger.error('save', err);
          record.stage = null;
          return err;
        });
    };

    var validate = function(record) {
      var resetPromise = $q.resolve();
      return resetPromise.then(function() {
        return ValidateSubmitService.validate(record.project, record.id)
          .then(function(response) {
            var promise;
            var data = response.data;
            var result = data[record.id];
            var validatedRecord = result.record;
            var table = record.getTable();
            if (validatedRecord) {
              promise = table.addRemoteRecords(validatedRecord);
            } else {
              promise = $q.resolve();
            }
            return promise
              .then(function() {
                return offlineservice.CollectRecordsTable(record.project);
              })
              .then(function(table) {
                return table.get(validatedRecord.id);
              })
              .then(function(offlineRecord) {
                result.record = offlineRecord;
                return result;
              });
          })
          .catch(function(err) {
            logger.error('validate', err);
            record.stage = ProjectService.SAVED_STAGE;
            return err;
          });
      });
    };
    return {
      save: save,
      validate: validate
    };
  }
]);
