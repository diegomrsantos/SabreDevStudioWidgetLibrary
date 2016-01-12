define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'webservices/inspirational/DestinationPricerDataService'
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , BaseController
        , DestinationPricerDataServiceSrc
    ) {
        'use strict';

        function DestinationPricesController(
            $scope
            , DestinationPricerDataService
            , newInspirationalSearchCriteriaEvent
            , searchCriteriaBroadcastingService
        ) {

            var that = this;

            var searchService = {
                executeSearch: DestinationPricerDataService.getPricesToDestination
            };

            BaseController.call(this, {
                scope: $scope
                , searchService: searchService
                , newSearchCriteriaEvent: newInspirationalSearchCriteriaEvent
                , searchCriteriaBroadcastingService: searchCriteriaBroadcastingService
            });

            this.saveLastSearchCriteria = function (searchCriteria) {
                that.lastRequestPosCountryOverride = searchCriteria.pointOfSaleCountry;
            };

            this.processSearchResults = function (pricesToDestination) {
                this.modelPricesToDestination = pricesToDestination;
            };

            this.clearModel = function () {
                this.modelPricesToDestination = {};
            };

            this.isAnyDataToDisplayAvailable = function () {
                return !(_.isEmpty(this.modelPricesToDestination.FareInfo));
            };

            this.clearModel();

            return this;
        }
        DestinationPricesController.prototype = Object.create(BaseController.prototype);
        DestinationPricesController.prototype.constructor = DestinationPricesController;

        return angular.module('sdsWidgets')
            .controller('DestinationPricerCtrl', [
                      '$scope'
                    , 'DestinationPricerDataService'
                    , 'newInspirationalSearchCriteriaEvent'
                    , 'InspirationalSearchCriteriaBroadcastingService'
                , DestinationPricesController])
            .directive('destinationPricer', function (
                ) {
                return {
                    restrict: 'EA',
                    scope: true,
                    templateUrl: '../widgets/view-templates/widgets/DestinationPricer.tpl.html',
                    controller: 'DestinationPricerCtrl',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {
                        executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.destination, attrs.pointOfSaleCountry);

                        function executeLifeSearchOnPredefinedCriteriaIfPresent(destination, pointOfSaleCountry) {
                            if (destination) {
                                var searchCriteria = {
                                      destination: destination
                                };
                                if (pointOfSaleCountry) {
                                    _.extend(searchCriteria, {
                                        pointOfSaleCountry: pointOfSaleCountry
                                    });
                                }
                                controller.processSearchCriteria(searchCriteria);
                            }
                        }

                    }
                };
            });
    });
