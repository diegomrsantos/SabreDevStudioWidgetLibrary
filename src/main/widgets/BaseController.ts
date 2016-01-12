define([
          'lodash'
        , 'datamodel/SearchCriteria'
    ],
    function (
          _
        , SearchCriteria
    ) {
        'use strict';

        function BaseController(args) {
            this.scope = args.scope;
            this.searchService = args.searchService;
            this.noResultsFoundBroadcastingService = args.noResultsFoundBroadcastingService || { broadcast: _.noop };

            this.lastSearchCriteriaAirports = {};

            var that = this;
            this.scope.$on(args.newSearchCriteriaEvent, function () {
                var newSearchCriteria = args.searchCriteriaBroadcastingService.searchCriteria;
                that.processSearchCriteria(newSearchCriteria);
            });
        }
        
        BaseController.prototype.executeLifeSearchOnPredefinedCriteriaIfPresent = function (origin, destination, departureDateString, returnDateString) {
            if (origin && destination && departureDateString && returnDateString) {
                var searchCriteria = SearchCriteria.prototype.buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString);
                this.processSearchCriteria(searchCriteria);
            }
        };

        BaseController.prototype.processSearchCriteria = function (searchCriteria) {
            var that = this;
            this.searchService.executeSearch(searchCriteria).then(
                function (searchResults) {
                    that.saveLastSearchCriteria(searchCriteria);
                    that.processSearchResults(searchResults);
                }, function (errors) {
                    that.saveLastSearchCriteria(searchCriteria);
                    // clear model from previous search
                    that.clearModel();
                    that.noResultsFoundBroadcastingService.broadcast();
                }
            );
        };

        BaseController.prototype.saveLastSearchCriteria = function(searchCriteria) {
            this.lastSearchCriteria = searchCriteria;
            this.lastSearchCriteriaAirports.departureAirport = (_.isFunction(searchCriteria.getFirstLeg))? searchCriteria.getFirstLeg().origin: searchCriteria.origin;
            this.lastSearchCriteriaAirports.arrivalAirport = (_.isFunction(searchCriteria.getFirstLeg))? searchCriteria.getFirstLeg().destination: searchCriteria.destination;
        };

        return BaseController;
    });
