define([
          'lodash'
        , 'angular'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
          _
        , angular
        , SabreDevStudioWebServicesModule
    ) {
        'use strict';

        function isAPIrequest(currentURL, apiURL) {
            return _.startsWith(currentURL, apiURL);
        }

        return angular.module('sabreDevStudioWebServices')
            .factory('NetworkConnectivityErrorInterceptor', ['$q', 'NetworkErrorReportingService', 'apiURL', function ($q, ErrorReportingService, apiURL) {
                var COMMUNICATION_GENERIC_ERROR_MSG = _.template('Unable to communicate with <%= endpoint %>');
                var COMMUNICATION_TIMEOUT_ERROR_MSG = _.template('Timeout calling <%= endpoint %>'); //

                function translateKnownEndpoints(endpoint) {
                    return (endpoint.indexOf(apiURL) > -1)? 'Sabre Dev Studio': endpoint;
                }

                var minimalCommunicationTimeMillisToDetectTimeout = 300;
                return {
                    responseError: function (reason) {
                        if (!isAPIrequest(reason.config.url, apiURL)) {
                            return $q.reject(reason);
                        }
                        if (reason.status !== 0) {
                            return $q.reject(reason);
                        }
                        var errorMessageElements = {
                            endpoint: translateKnownEndpoints(reason.config.url)
                        };
                        if (reason.config.timeout && reason.config.timeoutClockStart) {
                            var httpCallDuration = Math.round(performance.now() - reason.config.timeoutClockStart);
                            if ((httpCallDuration > minimalCommunicationTimeMillisToDetectTimeout) && (httpCallDuration >= reason.config.timeout)) {
                                ErrorReportingService.reportError(COMMUNICATION_TIMEOUT_ERROR_MSG(errorMessageElements));
                                return $q.reject(reason);
                            }
                        }
                        ErrorReportingService.reportError(COMMUNICATION_GENERIC_ERROR_MSG(errorMessageElements));
                        return $q.reject(reason);
                    }
                }
            }])
            .factory('ResponseTimeLoggerHttpInterceptor', ['$q', '$log', 'apiURL', function ($q, $log, apiURL) {
                function logHttpCallTime(config) {
                    if (isAPIrequest(config.url, apiURL) && config.timeStart) {
                        var timeEnd = performance.now();
                        var duration = Math.round(timeEnd - config.timeStart);
                        $log.debug("http call time: " + duration + " millis");
                    }
                }

                return {
                    request: function (config) {
                        if (isAPIrequest(config.url, apiURL)) {
                            config.timeStart = performance.now();
                        }
                        return config;
                    },
                    response: function (response) {
                        logHttpCallTime(response.config);
                        return response;
                    },
                    responseError: function (reason) {
                        logHttpCallTime(reason.config);
                        return $q.reject(reason);
                    }
                };
                }])
            .constant('defaultTimeoutMillis', 5000)
            .factory('AddTimeoutOnHttpCommunicationInterceptor', ['defaultTimeoutMillis', 'apiURL', function (defaultTimeoutMillis, apiURL) {
                return {
                    request: function(config) {
                        if (isAPIrequest(config.url, apiURL)) {
                            config.timeout = config.timeout || defaultTimeoutMillis;
                            config.timeoutClockStart = performance.now();
                        }
                        return config;
                    }
                }
            }])
            .config(['$httpProvider', function ($httpProvider) {
                $httpProvider.interceptors.push(
                      'ResponseTimeLoggerHttpInterceptor'
                    , 'NetworkConnectivityErrorInterceptor'
                    , 'AddTimeoutOnHttpCommunicationInterceptor'
                );
            }]);
    });
