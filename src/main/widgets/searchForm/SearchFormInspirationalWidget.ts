define([
        'moment'
        , 'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          moment
        , angular
        , _
        , __
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('searchFormInspirational', [
                      'InspirationalSearchCriteriaBroadcastingService'
                    , 'PointOfSaleCountryLookupDataService'
                , function (
                    InspirationalSearchCriteriaBroadcastingService
                    , PointOfSaleCountryLookupDataService
                ) {

                var noPointOfSaleCountryPreference = {
                      countryCode: undefined
                    , countryName: undefined
                };

                return {
                    replace: true,
                    scope: {
                        selectableAirportsForThisPosOnly: '@'
                    },
                    templateUrl: '../widgets/view-templates/widgets/SearchFormInspirationalWidget.tpl.html',
                    link: function (scope, element) {

                        var fieldsToHide = [];

                        scope.searchContext = {
                            pointOfSaleCountry: undefined
                        };

                        parseFieldsToHide();

                        setUpModel();

                        function parseFieldsToHide() {
                            fieldsToHide = element.attr('hide-fields') && element.attr('hide-fields').split(',') || [];
                        }

                        function setUpModel() {
                            scope.pointOfSaleCountries = [
                                noPointOfSaleCountryPreference
                            ];

                            PointOfSaleCountryLookupDataService.getPointOfSaleCountries().then(function (pointOfSaleCountries) {
                                __.pushAll(scope.pointOfSaleCountries, pointOfSaleCountries);
                            });
                        }

                        scope.createNewSearchCriteria = function () {
                            InspirationalSearchCriteriaBroadcastingService.searchCriteria = {
                                  destination: scope.destination.airportCode
                                , pointOfSaleCountry: scope.searchContext.pointOfSaleCountry
                            };
                            InspirationalSearchCriteriaBroadcastingService.broadcast();
                        };

                        scope.isVisible = function (htmlFieldName) {
                            return !_.contains(fieldsToHide, htmlFieldName);
                        }
                    }
                }
            }]);
    });
