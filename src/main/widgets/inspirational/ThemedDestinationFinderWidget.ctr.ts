define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'widgets/SDSWidgets'
        , 'util/BaseServices'
        , 'widgets/WidgetGlobalCallbacks'
        , 'util/CommonGenericFilters'
        , 'datamodel/inspirationalSearch/InspirationalSearchCriteriaFactory'
    ],
    function (
          moment
        , angular
        , _
        , __
        , SDSWidgets
        , BaseServices
        , WidgetGlobalCallbacks
        , CommonGenericFilters
        , InspirationalSearchCriteriaFactory
    ) {
        'use strict';

        function TilesThemedDestinationFinderWidgetCtr(
            $scope,
            ClosestAirportGeoService,
            GeoCodeDataService,
            DestinationFinderSummaryDataService,
            ThemedInspirationalSearchCriteriaBroadcastingService,
            ThemedInspirationalSearchCompleteBroadcastingService,
            TripOriginChangedBroadcastingService
        ) {
            var searchCriteria = InspirationalSearchCriteriaFactory.create();

            $scope.model = {
                originForPricesForDestinations: undefined,
                pricesForDestinationsGrouped: []
            };

            function clearModel() {
                $scope.model.originForPricesForDestinations = undefined;
                $scope.model.pricesForDestinationsGrouped = [];
            }

            $scope.closestAirportGeoCoordinates = {
                latitude: 0,
                longitude: 0
            };

            $scope.isAnyDataToDisplayAvailable = () => {
                return !(_.isEmpty($scope.model.pricesForDestinationsGrouped));
            };

            $scope.$on('newThemedInspirationalSearchCriteriaEvent', function () {
                var themeSearched = ThemedInspirationalSearchCriteriaBroadcastingService.searchCriteria.theme;
                var searchCompleteCallback = () => {
                    ThemedInspirationalSearchCompleteBroadcastingService.themeSearched = themeSearched;
                    ThemedInspirationalSearchCompleteBroadcastingService.broadcast();
                };
                searchDestinationsForTheme(themeSearched, searchCompleteCallback);
            });

            $scope.$on('tripOriginChangedEvent', function (event, origin) {
                var newOrigin = origin;
                updateSearchCriteriaWithClosestAirport(newOrigin, () => {
                    searchDestinationsForTheme(searchCriteria.theme, _.noop);
                });
            });

            function searchDestinationsForTheme(theme, searchCompleteCallback) {
                var themedSearchCriteria = _.extend(searchCriteria, {
                    theme: theme
                });
                $scope.searchStartedCallback({searchCriteria: searchCriteria});
                DestinationFinderSummaryDataService.getOffersOrderedSummary(themedSearchCriteria)
                    .then(function (orderedSummary) {
                        orderedSummary.pricesForDestinationsGrouped = orderedSummary.pricesForDestinationsGrouped.map(addClickHandlerToOfferForDestination);
                        $scope.model.pricesForDestinationsGrouped = orderedSummary.pricesForDestinationsGrouped;
                        $scope.model.originForPricesForDestinations = orderedSummary.originForPricesForDestinations;
                        $scope.model.priceTiersStatistics = orderedSummary.priceTiersStatistics;

                        $scope.searchSuccessCallback({
                            searchResults: orderedSummary,
                            searchCriteria: searchCriteria
                        });
                    }, (reason) => {
                        clearModel();
                        $scope.searchErrorCallback({
                            errorMessages: reason,
                            searchCriteria: searchCriteria
                        });
                    })
                    .finally(searchCompleteCallback);
            }

            // we are exporting the directive searchOfferClicked click handler onto every offerForDestination item, so that it can be used by subviews, like google maps, which only interface to communicate with parent controller is the offerForDestination object.
            function addClickHandlerToOfferForDestination(offerForDestination) {
                return _.extend({}, offerForDestination, {searchOfferClicked: $scope.searchOfferClicked});
            }

            function updateSearchCriteriaWithClosestAirport(closestAirport, completeCallback = _.noop) {
                ClosestAirportGeoService.getClosestAirportData(closestAirport)
                    .then((closestAirportGeoData) => {
                        searchCriteria.origin = closestAirportGeoData.airportCode;
                        searchCriteria.pointofsalecountry = closestAirportGeoData.countryCode;
                        GeoCodeDataService.getAirportGeoCoordinates(closestAirportGeoData.airportCode)
                            .then((geoCoordinates) => {
                                $scope.closestAirportGeoCoordinates = geoCoordinates;
                                completeCallback();
                            });
                    });
            }

            updateSearchCriteriaWithClosestAirport($scope.closestAirport);
        }
        return TilesThemedDestinationFinderWidgetCtr;
});
