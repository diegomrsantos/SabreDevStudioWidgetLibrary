define([
          'lodash'
        , 'angular'
        , 'angular_resource'
        , 'ngPromiseExtras'
        , 'ngStorage'
    ],
    function (
          _
        , angular
        , angular_resource
        , ngPromiseExtras
        , ngStorage
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices', ['ngResource', 'configuration', 'NGPromiseUtils', 'ngStorage'])
            .constant('dateTimeFormat', 'YYYY-MM-DDTHH:mm:ss')
            .constant('dateFormat', 'YYYY-MM-DD')
            .constant('errorEvent', 'errorEvent')
            .constant('resetErrorsEvent', 'resetErrorsEvent')
            .factory('businessMessagesErrorHandler', ['ErrorReportingService', function (ErrorReportingService) {
                function identityAsArray(arg) {
                    return [arg];
                }
                return {
                    handle: function(reject, reason, errorParsingFn) {
                        errorParsingFn = errorParsingFn || identityAsArray;
                        if (reason.data !== null) {
                            var businessErrorMessages = errorParsingFn(reason.data.message);
                            ErrorReportingService.reportErrors(businessErrorMessages);
                        }
                        return reject(businessErrorMessages);
                    }
                }
            }])
            .service('ErrorReportingService', ['$rootScope', 'errorEvent', function ($rootScope, errorEvent) {
                return {
                    reportError: function (error, searchCriteria) {
                        $rootScope.$broadcast(errorEvent, [error], searchCriteria);
                    },
                    reportErrors: function (errorsArray, searchCriteria) {
                        $rootScope.$broadcast(errorEvent, errorsArray, searchCriteria);
                    }
                };
            }])
            .factory('ValidationErrorReportingService', [
                '$modal'
                , function ($modal) {
                    return {
                        reportErrors: function (errors, errorsCategory) {
                            $modal.open({
                                animation: true,
                                templateUrl: '../widgets/view-templates/partials/ErrorsModal.tpl.html',
                                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                    $scope.errorsList = errors;
                                    $scope.modalTitle = errorsCategory;

                                    $scope.ok = function () {
                                        $modalInstance.close();
                                    };
                                }]
                            });
                        }
                    };
                }])
    });
