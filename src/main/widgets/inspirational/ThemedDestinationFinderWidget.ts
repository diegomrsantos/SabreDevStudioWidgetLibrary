define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'webservices/lookup/TravelThemeLookupDataService'
        , 'webservices/inspirational/DestinationFinderSummaryDataService'
        , 'util/BaseServices'
        , 'webservices/utility/GeoSearchDataService'
        , 'webservices/lookup/AirportLookupDataService'
    ],
    function (
          moment
        , angular
        , _
        , SDSWidgets
        , BaseController
        , DestinationFinderDataService
        , DestinationFinderSummaryDataServiceSrc
        , BaseServices
        , GeoSearchDataServiceSrc
        , AirportLookupDataServiceSrc
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('ThemedDestinationFinderWidgetCtrl', [
                      '$scope'
                    , 'TravelThemeLookupDataService'
                    , 'DestinationFinderSummaryDataService'
                    , 'GeoSearchDataService'
                    , 'InspirationalSearchCriteriaBroadcastingService'
                    , 'AirportLookupDataService'
                , function (
                    $scope
                    , TravelThemeLookupDataService
                    , DestinationFinderSummaryDataService
                    , GeoSearchDataService
                    , InspirationalSearchCriteriaBroadcastingService
                    , AirportLookupDataService
                ) {
                    var that = this;

                    /* API accepts up to 10 length of stay (LoS) values, but no point to query for consecutive LoS numbers (like 7,8,9,10 ...), especially with relatively long advance purchase (earliestdeparturedate),
                        as the fare rules are typically defined for ranges of length of stay, not particular values. Like up to 7 days, 7-14, more than 21. */
                    var lengthOfStayDaysToSearch = [7,13,14,15];

                    var earliestdeparturedate = moment().add(2, 'months');

                    /* API accepts up to 30 departure dates, but no point to query for all possible with relatively long advance purchase (earliestdeparturedate).
                       Querying for couple departure days should be enough */
                    var departureDaysToQuery = 2;
                    /* WARN: Performance: with departureDaysToQuery==2 and lengthOfStayDaysToSearch.length==4 there are (2+1)*4=12 date combinations to query.
                        At this number of combinations the response time is like 1-2s. Response time grows much with number of date combinations requested. */

                    var searchCriteriaTemplate = {
                          origin: undefined
                        , pointofsalecountry: undefined
                        , lengthofstay: lengthOfStayDaysToSearch.join()
                        , earliestdeparturedate: earliestdeparturedate
                        , latestdeparturedate: earliestdeparturedate.clone().add(departureDaysToQuery, 'days')
                        , topdestinations: 50
                    };

                    this.model = {
                          travelThemes: []
                        , selectedTravelTheme: undefined
                        , originForPricesForDestinations: undefined
                        , pricesForDestinationsGrouped: []
                    };

                    function initializeModel() {
                        TravelThemeLookupDataService.getTravelThemes().then(
                            function (travelThemes) {
                                that.model.travelThemes = travelThemes;
                                var selectedTravelThemeIdx = _.random(0, that.model.travelThemes.length - 1);
                                var selectedTravelTheme = that.model.travelThemes[selectedTravelThemeIdx];
                                selectTravelTheme(selectedTravelTheme);
                            }
                        );
                    }

                    this.isAnyDataToDisplayAvailable = function () {
                        return !(_.isEmpty(this.model.travelThemes));
                    };

                    this.travelThemeClicked = function (event, theme) {
                        var clickTarget = event.target || event.srcElement;
                        var travelThemeLink = angular.element(clickTarget);
                        travelThemeLink.addClass('SDSSearchInProgressUponClicked');
                        function searchCompleteCallback() {
                            travelThemeLink.removeClass('SDSSearchInProgressUponClicked');
                        }
                        selectTravelTheme(theme, searchCompleteCallback);
                    };

                    function selectTravelTheme(theme, searchCompleteCallback?) {
                        InspirationalSearchCriteriaBroadcastingService.searchCriteria = {
                            theme: theme
                        };
                        InspirationalSearchCriteriaBroadcastingService.broadcast();
                        searchDestinationsForTheme(theme, searchCompleteCallback);
                    }

                    function searchDestinationsForTheme(theme, searchCompleteCallback) {
                        searchCompleteCallback = searchCompleteCallback || _.noop;
                        var searchCriteria = _.extend(searchCriteriaTemplate, {
                            theme: theme
                        });
                        DestinationFinderSummaryDataService.getOffersOrderedSummary(searchCriteria).then(function (orderedSummary) {
                            that.model.pricesForDestinationsGrouped = orderedSummary.pricesForDestinationsGrouped
                            that.model.originForPricesForDestinations = orderedSummary.originForPricesForDestinations;
                            that.model.selectedTravelTheme = theme;
                        }).finally(searchCompleteCallback);
                    }

                    GeoSearchDataService.getAPISupportedClosestAirport().then(function (closestAirport) {
                         closestAirport = 'FRA'; // override for testing
                        searchCriteriaTemplate.origin = closestAirport;
                        AirportLookupDataService.getAirportData(closestAirport).then(function (airportData) {
                            searchCriteriaTemplate.pointofsalecountry = airportData.CountryCode;
                            initializeModel();
                        });
                    });

                }])
            .directive('themedDestinationFinder', function (
                ) {
                return {
                    scope: true,
                    replace: true,
                    templateUrl: '../widgets/view-templates/widgets/ThemedDestinationFinderWidget.tpl.html',
                    controller: 'ThemedDestinationFinderWidgetCtrl',
                    controllerAs: 'ctrl'
                };
            })
            .filter('theme', function () {
                return function (themeStringFromApi) {
                    return _.startCase(themeStringFromApi.toLowerCase()); // BEACH -> Beach, NATIONAL-PARKS -> National Parks
                }
            });
});
