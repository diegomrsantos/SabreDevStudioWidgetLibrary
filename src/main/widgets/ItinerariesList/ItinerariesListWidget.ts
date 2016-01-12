define([
          'lodash'
        , 'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/ItinerariesList'
        , 'util/ItinerariesStatisticsCalculator'
        , 'webservices/bargainFinderMax/BargainFinderMaxWebServices'
        , 'webservices/instaflights/InstaflightsDataService'
        , 'datamodel/DiversitySwapper'
        , 'widgets/ItinerariesList/ItineraryShortSummary'
        , 'widgets/ItinerariesList/ItineraryPricePerStopsPerAirlineSummary'
        , 'widgets/ItinerariesList/ItineraryDirective'
        , 'datamodel/ItinerariesListSummaryByAirlineAndNumberOfStops'
        , 'datamodel/SearchCriteria'
        , 'widgets/ItinerariesList/ItinerariesListSortCriteria'
        , 'webservices/common/searchStrategyFactories/ItinerariesSearchStrategyFactory'
        , 'webservices/common/searchStrategyFactories/BrandedItinerariesSearchStrategyFactory'
        , 'util/CommonDisplayDirectives'
    ],
    function (
          _
        , moment
        , angular
        , angular_bootstrap
        , SDSWidgets
        , ItinerariesList
        , ItinerariesStatisticsCalculator
        , BargainFinderMaxWebServices
        , InstaflightsDataService
        , DiversitySwapper
        , ItineraryShortSummary
        , ItineraryPricePerStopsPerAirlineSummary
        , ItineraryDirective
        , ItinerariesListSummaryByAirlineAndNumberOfStops
        , SearchCriteria
        , ItinerariesListSortCriteria
        , ItinerariesSearchStrategyFactory
        , BrandedItinerariesSearchStrategyFactory
        , CommonDisplayDirectives
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('ItineraryListCtrl', [
                      '$scope'
                    , '$filter'
                    , 'ItinerariesSearchStrategyFactory'
                    , 'BrandedItinerariesSearchStrategyFactory'
                    , 'SearchCriteriaBroadcastingService'
                    , 'newSearchCriteriaEvent'
                    , 'StatisticsGatheringRequestsRegistryService'
                    , 'ItineraryStatisticsBroadcastingService'
                    , 'filteringCriteriaChangedEvent'
                    , 'FilteringCriteriaChangedBroadcastingService'
                    , 'DateSelectedBroadcastingService'
                    , 'dateSelectedEvent'
                    , 'BargainFinderMaxDataService'
                    , 'noResultsFoundEvent'
                , function (
                      $scope
                    , $filter
                    , itinerariesSearchStrategyFactory
                    , brandedItinerariesSearchStrategyFactory
                    , SearchCriteriaBroadcastingService
                    , newSearchCriteriaEvent
                    , StatisticsGatheringRequestsRegistryService
                    , ItineraryStatisticsBroadcastingService
                    , filteringCriteriaChangedEvent
                    , FilteringCriteriaChangedBroadcastingService
                    , DateSelectedBroadcastingService
                    , dateSelectedEvent
                    , BargainFinderMaxDataService
                    , noResultsFoundEvent
                ) {

                    var sortCriteria = new ItinerariesListSortCriteria();
                    $scope.availableSortCriteria = sortCriteria.availableSortCriteria;

                    $scope.selectedFirstCriterion = { // must be object so that the scope of inputSelectDropdown can update the parent scope object, not its copy (like when it was a scalar)
                        selected: _.first(sortCriteria.availableSortCriteria)
                    };
                    $scope.paginationSettings = {};

                    resetNavigationAndSortCriteria();

                    var itineraries;
                    var permittedItineraries;

                    function resetNavigationAndSortCriteria() {
                        sortCriteria.resetSortCriteria();
                        $scope.selectedFirstCriterion.selected =  _.first(sortCriteria.availableSortCriteria);

                        $scope.itemsPerPage = 20;
                        // have to explicitly set the current page for pagination (startFrom filter), otherwise undefined and filter getting NaN parameter.
                        $scope.paginationSettings.currentPage = 1;
                    }

                    $scope.onSortingCriteriaChanged = function () {
                        sortCriteria.setSortCriteria($scope.selectedFirstCriterion.selected);
                        // filtering in controller, not in view filter for performance reasons
                        $scope.permittedItinerariesSorted = $filter('sortByCriteria')(permittedItineraries, sortCriteria.getCurrentSortCriteria());

                        // when changing sorting criteria, which will trigger resorting of itineraries list, reset current page to 1.
                        // The customer expectation upon changing sort criteria, is to see, at the very top of the list,
                        //  the very top items according to the criteria specified.
                        // However in case customer was already on any results page other than one, then it will not be displayed at the top (we are on the other page and we would need to manually go to page 1).
                        $scope.paginationSettings.currentPage = 1;
                    };

                    /**
                     * Recalculates itinerary list summaries:
                     * 1. _short_ summary, that is the cheapest itinerary, shortest and the best.
                     * 2. summary per stops per airline, which is the lowest price for every airline returned, for every stop count
                     */
                    function recalculateSummaries() {
                        $scope.bestItinerariesSummary = {
                            cheapest: itineraries.getCheapestItinerary(),
                            best: _.last($scope.permittedItinerariesSorted.slice().sort(DiversitySwapper.comparator)),// have to sort on copy, not original, not to mutate original array which is the source for displaying the itineraries list
                            shortest: itineraries.getShortestItinerary()
                        };
                        $scope.summaryPerStopsPerAirline = (new ItinerariesListSummaryByAirlineAndNumberOfStops($scope.permittedItinerariesSorted)).getSummaries();
                    }

                    function processNewItineraries(newSearchCriteria, itins) {
                        resetNavigationAndSortCriteria();

                        itineraries = itins;
                        //// for performance measuring and optimizations
                        //for (var i = 0; i < 4; i++) {
                        //    var copy = _.cloneDeep(itins);
                        //    copy.itineraries.forEach(itin => itineraries.add(itin));
                        //}
                        ////
                        processItinerariesUpdate(newSearchCriteria);
                    }

                    function updateWithNewItineraries(newSearchCriteria, itinerariesList) {
                        resetNavigationAndSortCriteria();
                        itineraries.addItinerariesListWithDedup(itinerariesList);
                        processItinerariesUpdate(newSearchCriteria);
                    }

                    function processItinerariesUpdate(newSearchCriteria) {
                        permittedItineraries = itineraries.getPermittedItineraries();
                        $scope.permittedItinerariesSorted = $filter('sortByCriteria')(permittedItineraries, sortCriteria.getCurrentSortCriteria());
                        recalculateAndBroadcastStatistics();
                        recalculateSummaries();
                        updateSearchAirports(newSearchCriteria);
                    }

                    function clearModel() {
                        itineraries = undefined;
                        $scope.permittedItinerariesSorted = undefined;
                    }

                    function processServiceErrorMessages(newSearchCriteria, businessErrorMessages) {
                        // clear model from previous search
                        clearModel();
                    }

                    var searchStrategyFactory = ($scope.requestBrandedItineraries)? brandedItinerariesSearchStrategyFactory: itinerariesSearchStrategyFactory;

                    var searchStrategy = searchStrategyFactory.createSearchStrategy($scope.activeSearchWebService);

                    // main controller function, acting on new search criteria sent to the widget
                    $scope.$on(newSearchCriteriaEvent, function () {
                        var newSearchCriteria = SearchCriteriaBroadcastingService.searchCriteria;
                        $scope.processSearchCriteria(newSearchCriteria);
                    });

                    $scope.processSearchCriteria = function(searchCriteria) {
                        if (!$scope.activeSearch) { //active search disabled
                            return;
                        }

                        searchStrategy.search(searchCriteria,
                            _.partial(processNewItineraries, searchCriteria),
                            _.partial(processServiceErrorMessages, searchCriteria),
                            _.partial(updateWithNewItineraries, searchCriteria));
                    };

                    $scope.$on(filteringCriteriaChangedEvent, function () {
                        var currentFilteringFunctions = FilteringCriteriaChangedBroadcastingService.filteringFunctions;
                        itineraries.applyFilters(currentFilteringFunctions);
                        permittedItineraries = itineraries.getPermittedItineraries();
                        $scope.permittedItinerariesSorted = $filter('sortByCriteria')(permittedItineraries, sortCriteria.getCurrentSortCriteria());
                        recalculateSummaries();
                        $scope.$evalAsync();
                        // We need to call the digest cycle manually, as we changed the model outside of Angular (we have read the state of filters UI controls (sliders), sent new filtering functions thru event and applied to the itineraries domain model).
                        // In case of discrete filters (checkboxes), the digest cycle is already triggered by Angular (checkboxes with ng-model), while range sliders are component totally outside of Angular: that is why we have to call digest after change from these components.
                        // It is evalAsync, not just digest(), because in case of discrete values filters, the digest cycle is already in progress.
                    });

                    $scope.$on(dateSelectedEvent, function () {
                        var newSearchCriteria = DateSelectedBroadcastingService.newSearchCriteria;
                        // the web service which produced the data, from which the particular date was selected
                        var webService = selectItinerariesListProducingService(DateSelectedBroadcastingService.originalDataSourceWebService);

                        webService.getItineraries(newSearchCriteria).then(
                              _.partial(processNewItineraries, newSearchCriteria)
                            , _.partial(processServiceErrorMessages, newSearchCriteria)
                        );
                        $scope.$evalAsync();
                    });

                    /**
                     * this event may come from other widget, like Calendar, when no results were found.
                     * In such case we should clear (passive) itineraries list, to reflect that noting is found or selected.
                     * clearing is needed, when for example previously the other widget found data for some search criteria, then sent dateSelected event
                     * , so the itinerary list populated, and later there was another search in the other widget which now did not return any results (so we have to clear previous state).
                     */
                    $scope.$on(noResultsFoundEvent, function () {
                        clearModel();
                    });

                    function selectItinerariesListProducingService(originalWebService) {
                        return (isItinerariesListProducingService(originalWebService))? originalWebService : BargainFinderMaxDataService;
                    }

                    function isItinerariesListProducingService(originalWebService) {
                        return _.isFunction(originalWebService.getItineraries);
                    }

                    function recalculateAndBroadcastStatistics() {
                        var requestedStatisticsDescriptions = StatisticsGatheringRequestsRegistryService.getAll();
                        var statisticsCalculator = new ItinerariesStatisticsCalculator(itineraries.getPermittedItineraries());
                        ItineraryStatisticsBroadcastingService.statistics = statisticsCalculator.getCurrentValuesBounds(requestedStatisticsDescriptions);
                        ItineraryStatisticsBroadcastingService.broadcast();
                    }

                    function updateSearchAirports(newSearchCriteria) {
                        $scope.searchCriteriaDepartureAirport = newSearchCriteria.getFirstLeg().origin;
                        $scope.searchCriteriaArrivalAirport = newSearchCriteria.getFirstLeg().destination;
                    }

                    $scope.isAnyDataToDisplayAvailable = function () {
                        if (_.isUndefined(itineraries)) {
                            return false;
                        }
                        return ($scope.permittedItinerariesSorted.length > 0);
                    };

                }])
            .directive('itineraryList', ['$templateCache', function ($templateCache) {
                return {
                    restrict: 'EA',
                    scope: {
                          activeSearch: '@?'
                        , activeSearchWebService: '@?'
                        , requestBrandedItineraries: '=?'
                    },
                    templateUrl: '../widgets/view-templates/widgets/ItinerariesListWidget.tpl.html',
                    controller: 'ItineraryListCtrl',
                    link: function (scope, element) {
                        var predefinedSearchCriteria = buildSearchCriteriaFromPredefinedParameters();
                        if (predefinedSearchCriteria) {
                            scope.processSearchCriteria(predefinedSearchCriteria);
                        }

                        function buildSearchCriteriaFromPredefinedParameters() {
                            var origin = element.attr('origin');
                            var destination = element.attr('destination');
                            var departureDateString = element.attr('departure-date');
                            var returnDateString = element.attr('return-date');

                            if (origin && destination && departureDateString && returnDateString) {
                                return SearchCriteria.prototype.buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString);
                            }
                        }
                    }

                };
            }])
            .filter('sortByCriteria', ['$filter', function ($filter) {
                var orderBy = $filter('orderBy');
                return function (values, sortingCriteriaArray) {
                    var ngOrderByPredicatesArray = sortingCriteriaArray.map(function (criterion) {
                        return (criterion.reverse ? '-' : '+') + criterion.propertyName;
                    });
                    var valuesSorted = orderBy(values, ngOrderByPredicatesArray);
                    return valuesSorted;
                };
            }]);
    });
