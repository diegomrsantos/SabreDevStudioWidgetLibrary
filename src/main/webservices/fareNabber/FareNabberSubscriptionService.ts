define([
        'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/fareNabber/FareNabberResourceDefinitions'
        , 'webservices/fareNabber/FareNabberSubscriptionRequestBuilder'
    ],
    function (
        angular
        , SabreDevStudioWebServicesModule
        , FareNabberResourceDefinitions
        , FareNabberSubscriptionRequestBuilderSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('FareNabberSubscriptionService', [
                  '$q'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , 'FareNabberSubscriptionRequestBuilder'
                , 'FareNabberSubscriptionResource'
                , function (
                      $q
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                    , FareNabberSubscriptionRequestBuilder
                    , FareNabberSubscriptionResource
                ) {
                return   {
                    subscribe: function (fareNabberFormData) {
                        var request = FareNabberSubscriptionRequestBuilder.build(fareNabberFormData);
                        return $q(function(resolve, reject) {
                            FareNabberSubscriptionResource.save(request).$promise.then(function (response) {
                                resolve(response);
                            }, function (error) {
                                ErrorReportingService.reportError('Unable to create subscription: ' + error.status + ': ' + error.statusText); // we do not use standard error handler as this service reports errors differently
                                reject(error);
                            });
                        })
                    }
                };
            }])
    });