define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'datamodel/ItinerariesList'
        , 'webservices/bargainFinderMax/BargainFinderMaxWebServices'
        , 'webservices/instaflights/InstaflightsDataService'
        , 'datamodel/BestItineraryComparator'
        , 'widgets/ItinerariesList/ItineraryShortSummary'
        , 'widgets/ItinerariesList/ItineraryPricePerStopsPerAirlineSummary'
        , 'widgets/ItinerariesList/ItineraryDirective'
        , 'datamodel/ItinerariesListSummaryByAirlineAndNumberOfStops'
        , 'datamodel/search/SearchCriteriaFactory'
        , 'widgets/ItinerariesList/ItinerariesListSortCriteria'
        , 'widgets/ItinerariesList/ItinerariesListDiversitySwapperSortCriteria'
        , 'webservices/common/searchStrategyFactories/ItinerariesSearchStrategyFactoryBagsFilteringDecorator'
        , 'webservices/common/searchStrategyFactories/BrandedItinerariesSearchStrategyFactory'
        , 'util/CommonDisplayDirectives'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (
          _
        , __
        , moment
        , angular
        , angular_bootstrap
        , SDSWidgets
        , ItinerariesList
        , BargainFinderMaxWebServices
        , InstaflightsDataService
        , BestItineraryComparator
        , ItineraryShortSummary
        , ItineraryPricePerStopsPerAirlineSummary
        , ItineraryDirective
        , ItinerariesListSummaryByAirlineAndNumberOfStops
        , SearchCriteriaFactory
        , ItinerariesListSortCriteria
        , ItinerariesListDiversitySwapperSortCriteria
        , ItinerariesSearchStrategyFactory
        , BrandedItinerariesSearchStrategyFactory
        , CommonDisplayDirectives
        , WidgetGlobalCallbacks
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('ItineraryListCtrl', [
                      '$scope'
                    , '$filter'
                    , '$location'
                    , '$anchorScroll'
                    , 'ItinerariesSearchStrategyFactoryBagsFilteringDecorator'
                    , 'BrandedItinerariesSearchStrategyFactory'
                    , 'SearchCriteriaBroadcastingService'
                    , 'newSearchCriteriaEvent'
                    , 'DateSelectedBroadcastingService'
                    , 'dateSelectedEvent'
                    , 'BargainFinderMaxDataService'
                    , 'noResultsFoundEvent'
                    , 'filterServiceFactory'
                , function (
                      $scope
                    , $filter
                    , $location
                    , $anchorScroll
                    , itinerariesSearchStrategyFactory
                    , brandedItinerariesSearchStrategyFactory
                    , SearchCriteriaBroadcastingService
                    , newSearchCriteriaEvent
                    , DateSelectedBroadcastingService
                    , dateSelectedEvent
                    , BargainFinderMaxDataService
                    , noResultsFoundEvent
                    , filterServiceFactory
                ) {

                    var sortCriteria;
                    if($scope.activeSearchWebService === "bfm-enable-diversity-swapper") {
                        sortCriteria = new ItinerariesListDiversitySwapperSortCriteria();
                    }else {
                        sortCriteria = new ItinerariesListSortCriteria();
                    }

                    $scope.availableSortCriteria = sortCriteria.availableSortCriteria;

                    $scope.selectedFirstCriterion = { // must be object so that the scope of inputSelectDropdown can update the parent scope object, not its copy (like when it was a scalar)
                        selected: _.first(sortCriteria.availableSortCriteria)
                    };
                    $scope.paginationSettings = {};

                    resetNavigationAndSortCriteria();

                    var itineraries;
                    var permittedItineraries;
                    var permittedItinerariesSorted;

                    function resetNavigationAndSortCriteria() {
                        sortCriteria.resetSortCriteria();
                        $scope.selectedFirstCriterion.selected =  _.first(sortCriteria.availableSortCriteria);

                        $scope.itemsPerPage = 20;
                        // have to explicitly set the current page for pagination (startFrom filter), otherwise undefined and filter getting NaN parameter.
                        $scope.paginationSettings.currentPage = 1;
                    }

                    var filterService = filterServiceFactory.newInstance($scope.itinerariesListId);

                    filterService.configure({
                        pricePropertyAmountAccessor: 'amount',
                        pricePropertyAmountForPriceFrom: 'totalFareAmount',
                        pricePropertyCurrencyForPriceFrom: 'totalFareCurrency'
                    });

                    $scope.onSortingCriteriaChanged = function () {
                        sortCriteria.setSortCriteria($scope.selectedFirstCriterion.selected);
                        updateAllItinListsExportedToView(permittedItineraries);

                        // when changing sorting criteria, which will trigger resorting of itineraries list, reset current page to 1.
                        // The customer expectation upon changing sort criteria, is to see, at the very top of the list,
                        //  the very top items according to the criteria specified.
                        // However in case customer was already on any results page other than one, then it will not be displayed at the top (we are on the other page and we would need to manually go to page 1).
                        $scope.paginationSettings.currentPage = 1;
                    };

                    $scope.$watch('paginationSettings.currentPage', function (newPage, oldPage) {
                        if (newPage === oldPage) {
                            return;
                        }
                        $scope.permittedItinerariesSortedCurrentPageView = updateItinListForCurrentPage();
                    });

                    function updateAllItinListsExportedToView(permittedItins) {
                        // filtering in controller, not in view filter for performance reasons
                        permittedItinerariesSorted = $filter('sortByCriteria')(permittedItins, sortCriteria.getCurrentSortCriteria());
                        $scope.permittedItinerariesSortedCurrentPageView = updateItinListForCurrentPage();
                    }

                    function updateItinListForCurrentPage() {
                        var startIdx = ($scope.paginationSettings.currentPage - 1) * $scope.itemsPerPage;
                        var endIdx = startIdx + $scope.itemsPerPage;
                        return permittedItinerariesSorted.slice(startIdx, endIdx);
                    }

                    /**
                     * Recalculates itinerary list summaries:
                     * 1. _short_ summary, that is the cheapest itinerary, shortest and the best.
                     * 2. summary per stops per airline, which is the lowest price for every airline returned, for every stop count
                     */
                    function recalculateSummaries() {

                        var sortCriteriaArray = sortCriteria.sortCriteriaNaturalOrder.map(criteria => criteria.propertyName);

                        $scope.bestItinerariesSummary = {
                            cheapest: itineraries.getCheapestItinerary(sortCriteriaArray),
                            best: _.last(permittedItinerariesSorted.slice().sort(BestItineraryComparator.comparator)),// have to sort on copy, not original, not to mutate original array which is the source for displaying the itineraries list
                            shortest: itineraries.getShortestItinerary(sortCriteriaArray)
                        };
                        $scope.summaryPerStopsPerAirline = (new ItinerariesListSummaryByAirlineAndNumberOfStops(permittedItinerariesSorted)).getSummaries();
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
                        $scope.permittedItinerariesCount = permittedItineraries.length;
                        updateAllItinListsExportedToView(permittedItineraries);
                        filterService.updateFiltersState(itineraries.getPermittedItineraries());
                        recalculateSummaries();
                        updateSearchAirports(newSearchCriteria);
                    }

                    function clearModel() {
                        itineraries = undefined;
                        permittedItineraries = undefined;
                        permittedItinerariesSorted = undefined;
                        $scope.permittedItinerariesSortedCurrentPageView = undefined;
                        $scope.bestItinerariesSummary = undefined;
                        $scope.summaryPerStopsPerAirline = undefined;
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

                    var searchSuccessCallback = __.cancellable(function (searchCriteria, newItins) {
                        $scope.searchSuccessCallback({
                            itineraries: newItins,
                            searchCriteria: searchCriteria
                        });
                        processNewItineraries(searchCriteria, newItins);
                    });

                    var searchErrorCallback = __.cancellable(function (searchCriteria, errorMessages) {
                        $scope.searchErrorCallback({
                            errorMessages: errorMessages,
                            searchCriteria: searchCriteria
                        });
                        processServiceErrorMessages(searchCriteria, errorMessages);
                    });

                    var searchUpdateCallback = __.cancellable(function (searchCriteria, newItins) {
                        $scope.searchSuccessCallback({
                            itineraries: newItins,
                            searchCriteria: searchCriteria
                        });
                        updateWithNewItineraries(searchCriteria, newItins);
                    });

                    var resultsStreamEndCallback = __.cancellable(() => $scope.allSearchesComplete());

                    $scope.processSearchCriteria = function(searchCriteria) {
                        $scope.searchStartedCallback({searchCriteria: searchCriteria});

                        if (!$scope.activeSearch) { //active search disabled
                            return;
                        }

                        searchStrategy.search(searchCriteria, {
                                successCallback: _.partial(searchSuccessCallback, searchCriteria),
                                failureCallback: _.partial(searchErrorCallback, searchCriteria),
                                updateCallback: _.partial(searchUpdateCallback, searchCriteria),
                                streamEndCallback: resultsStreamEndCallback
                            }
                        );
                    };

                    filterService.onFilterChange(function (filteringFn) {
                        itineraries.applyFilters(filteringFn);
                        permittedItineraries = itineraries.getPermittedItineraries();
                        $scope.permittedItinerariesCount = permittedItineraries.length;
                        updateAllItinListsExportedToView(permittedItineraries);
                        recalculateSummaries();
                    });

                    $scope.$on(dateSelectedEvent, function () {
                        var newSearchCriteria = DateSelectedBroadcastingService.newSearchCriteria;
                        // the web service which produced the data, from which the particular date was selected
                        var webService = selectItinerariesListProducingService(DateSelectedBroadcastingService.originalDataSourceWebService);

                        $scope.searchStartedCallback({searchCriteria: newSearchCriteria});
                        webService
                            .getItineraries(newSearchCriteria)
                            .then(
                              _.partial(searchSuccessCallback, newSearchCriteria)
                            , _.partial(searchErrorCallback, newSearchCriteria)
                            )
                            .finally(resultsStreamEndCallback);
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

                    function updateSearchAirports(newSearchCriteria) {
                        $scope.searchCriteriaDepartureAirport = newSearchCriteria.getFirstLeg().origin;
                        $scope.searchCriteriaArrivalAirport = newSearchCriteria.getFirstLeg().destination;
                    }

                    $scope.isAnyDataToDisplayAvailable = function () {
                        if (_.isUndefined(itineraries)) {
                            return false;
                        }
                        return ($scope.permittedItinerariesCount > 0);
                    };

                    $scope.summaryItemClickedCallback = function (itineraryId) {
                        $scope.paginationSettings.currentPage = getItineraryPage(itineraryId);
                        var anchorId = $scope.getItinAnchorId(itineraryId);
                        $location.hash(anchorId);
                        $anchorScroll();
                    };

                    $scope.getItinAnchorId = function(itineraryId) {
                        return '#SDS_itin_' + itineraryId;
                    }

                    function getItineraryPage(itineraryId) {
                        var itinerarySequentialPosition = 1 + _.findIndex(permittedItinerariesSorted, itin => (itin.id === itineraryId));
                        return Math.ceil(itinerarySequentialPosition / $scope.itemsPerPage);
                    }

                    $scope.$on('$destroy', function() {
                        clearModel();
                        delete $scope.availableSortCriteria;
                        delete $scope.selectedFirstCriterion;
                        delete $scope.paginationSettings;
                        delete $scope.itemsPerPage;
                        searchStrategyFactory = undefined;
                        searchStrategy = undefined;

                        // on destroying scope we have to clear also the callbacks that we passed to promises that may resolve after the scope is cleared (for example client navigated out of the view containing this directive (directive destroy), but still there are long http requests in progress).
                        // BTW: these callbacks may still keep reference to objects on scope  (like in our case), thus also preventing the scope from being destroyed (mem leak) - not fixed yet.
                        clearSearchCallbacks();
                        clearScopeFunctionsExportedToView();
                        filterService.destroy();
                    });

                    function clearSearchCallbacks() {
                        searchSuccessCallback.cancel();
                        searchUpdateCallback.cancel();
                        searchErrorCallback.cancel();
                        resultsStreamEndCallback.cancel();
                    }

                    function clearScopeFunctionsExportedToView() {
                        delete $scope.isAnyDataToDisplayAvailable;
                        delete $scope.onSortingCriteriaChanged;
                        delete $scope.getItinAnchorId;
                        delete $scope.summaryItemClickedCallback;
                    }

                }])
            .directive('itineraryList', [function () {
                return {
                    restrict: 'EA',
                    scope: {
                          activeSearch: '@?'
                        , activeSearchWebService: '@?'
                        , requestBrandedItineraries: '=?'
                        , searchCriteria: '=?'
                        , selectedItineraryCallback: '&?'
                        , enableItinerarySelectButton: '@?'
                        , searchStartedCallback: '&?'
                        , searchSuccessCallback: '&?'
                        , searchErrorCallback: '&?'
                        , allSearchesComplete: '&?'
                        , itinerariesListId: '@'
                    },
                    templateUrl: '../widgets/view-templates/widgets/ItinerariesListWidget.tpl.html',
                    controller: 'ItineraryListCtrl',
                    link: function (scope, element) {
                        var predefinedSearchCriteria = buildSearchCriteriaFromPredefinedParameters();
                        if (predefinedSearchCriteria) {
                            scope.processSearchCriteria(predefinedSearchCriteria);
                        }

                        if(__.isDefined(scope.searchCriteria)) {
                            scope.processSearchCriteria(scope.searchCriteria);
                        }

                        function buildSearchCriteriaFromPredefinedParameters() {
                            var origin = element.attr('origin');
                            var destination = element.attr('destination');
                            var departureDateString = element.attr('departure-date');
                            var returnDateString = element.attr('return-date');

                            if (origin && destination && departureDateString && returnDateString) {
                                return SearchCriteriaFactory.buildRoundTripTravelSearchCriteria(origin, destination, departureDateString, returnDateString);
                            }
                        }

                        WidgetGlobalCallbacks.linkComplete(scope, element);
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
