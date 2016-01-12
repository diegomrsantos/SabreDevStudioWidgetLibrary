define([
        'lodash'
        , 'angular'
        , 'angular_resource'
        , 'Configuration'
        , 'webservices/SabreDevStudioWebServicesModule'
    ],
    function (
        _
        , angular
        , angular_resource
        , Configuration
        , SabreDevStudioWebServicesModule

    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('FareNabberSubscriptionResource', [
                      '$resource'
                    , 'fareNabberApiURL'
                , function (
                      $resource
                    , fareNabberApiURL
                ) {
                    return $resource(fareNabberApiURL, null, {
                        save: {
                              method: 'POST'
                            , headers: {
                                'Content-Type' : 'application/json'
                            }
                            , timeout: 12000
                        }
                    });
                }])
    });
