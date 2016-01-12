define([
        'angular'
    ],
    function (
        angular
    ) {
        'use strict';

        var configurationModule = angular.module('configuration', [])
            //.value('apiURL', 'http://localhost:8088/sabreapibridge/api')
            .value('apiURL', 'http://10.14.54.160:8088/sabreapibridge/api')
            //.value('apiURL', 'http://bridge.dev.sabre.cometari.com/api')
            .value('pointOfSaleCountry', 'DE')
            //.value('pointOfSaleCountry', 'US')
            .value('fareNabberApiURL', 'http://pifhli101:51000/Subscriptions') // address of resource to create Fare Nabber subscriptions DAILY
            //.value('fareNabberApiURL', 'http://ttfhli502:51000/Subscriptions') // address of resource to create Fare Nabber subscriptions INT
            .value('fareNabberRegistrationPCC', 'E8KE');

        return configurationModule;
    });
