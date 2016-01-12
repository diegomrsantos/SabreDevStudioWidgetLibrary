define([
          'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          angular
        , _
        , SabreDevStudioWebServicesModule
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('PromiseUtils', ['$q', function ($q) {
                return {
                    addResolvedObjectCloning: function (promiseReturningFunction) {
                        return function () {
                            var fnArguments = arguments;
                            return $q(function (resolve, reject) {
                                promiseReturningFunction.apply(null, fnArguments).then(function (result) {
                                    resolve(_.clone(result));
                                }, reject);
                            });
                        };
                    },
                    rejectIfAnyRejected: function (results, reject) { // works with nng-promise-extras
                        var rejectedPromises = results.filter(function (promiseItem) {
                            return promiseItem.state !== 'fulfilled';
                        });
                        if (rejectedPromises.length > 0) {
                            var rejectionReasons = rejectedPromises.map(function (promiseItem) {
                                return promiseItem.reason;
                            }).join();
                            return reject(rejectionReasons);
                        }
                    }
                };
            }]);

    });
