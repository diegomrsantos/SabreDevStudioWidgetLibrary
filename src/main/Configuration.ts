define([
        'angular'
    ],
    function (
        angular
    ) {
        'use strict';

        const configs = {
            US: {
                apiURL: 'insert rest api url',
                apiSpecificHeaders: {
                    'application-key': 'insert value'
                },
                pointOfSaleCountry: 'US',
                bfmRequestPcc: 'insert pcc'
            },
            DE: {
                apiURL: 'insert rest api url',
                apiSpecificHeaders: {},
                pointOfSaleCountry: 'DE',
                bfmRequestPcc: 'insert pcc'
            }
        };

        const selectedConfig = configs.DE;

        var configurationModule = angular.module('configuration', [])
            .value('apiURL', selectedConfig.apiURL)
            .value('apiSpecificHeaders', selectedConfig.apiSpecificHeaders)
            .value('pointOfSaleCountry', selectedConfig.pointOfSaleCountry)
            .value('bfmRequestPcc', selectedConfig.bfmRequestPcc)

            .value('fareNabberApiURL', 'insert Fare Nabber Api URL')
            .value('fareNabberRegistrationPCC', 'insert pcc')

        return configurationModule;
    });
