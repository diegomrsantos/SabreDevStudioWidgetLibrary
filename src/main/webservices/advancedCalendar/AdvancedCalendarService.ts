define([
          'angular'
        , 'lodash'
        , 'moment'
        , 'moment_range'
        , 'webservices/advancedCalendar/AdvancedCalendarSearchCriteriaValidator'
        , 'webservices/advancedCalendar/AdvancedCalendarRequestFactory'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'webservices/advancedCalendar/AdvancedCalendarRequestDatesExpander'
        , 'datamodel/ShoppingData'
        , 'webservices/common/parsers/OTAResponseParser'
    ],
    function (
          angular
        , _
        , moment
        , moment_range
        , AdvancedCalendarSearchCriteriaValidator
        , AdvancedCalendarRequestFactory
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , AdvancedCalendarRequestDatesExpander
        , ShoppingData
        , OTAResponseParser
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('AdvancedCalendarDataService', [
                '$q'
                , 'AdvancedCalendarSearchService'
                , 'ShoppingOptionsCacheService'
                , 'ErrorReportingService'
                , 'ValidationErrorReportingService'
                , 'businessMessagesErrorHandler'
                , 'bfmRequestPcc'
                , function (
                    $q
                    , AdvancedCalendarSearchService
                    , ShoppingOptionsCacheService
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                    , bfmRequestPcc
                ) {

                    var requestDatesExpander = new AdvancedCalendarRequestDatesExpander();
                    var configOverrides = {
                        bfmRequestPcc: bfmRequestPcc
                    }
                    var requestBuilderForDateRanges = new AdvancedCalendarRequestFactory(requestDatesExpander, configOverrides);

                    var requestBuilder = new AdvancedCalendarRequestFactory(undefined, configOverrides);

                    var responseParser = new OTAResponseParser();

                    var validator = new AdvancedCalendarSearchCriteriaValidator();

                    // create cache key to reuse itineraries from date range searches (getLeadPricesForRange), as results for one day searches (getItineraries)
                    function createCacheKey(searchCriteria) {
                        var keyElements = [
                            searchCriteria.getFirstLeg().origin
                            , searchCriteria.getFirstLeg().destination
                            , searchCriteria.getLengthOfStay()
                            , JSON.stringify(searchCriteria.preferredAirlines)
                            , searchCriteria.maxStops
                            , JSON.stringify(searchCriteria.passengerSpecifications)
                        ];
                        return keyElements.join('-');
                    }

                    function itinerariesFromDateRangeSearchMayBeReused(searchCriteria) {
                        return !searchCriteria.isAlternateDatesRequest();
                    }

                    return {
                        getLeadPricesForRange: function (searchCriteria, range) {
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var cacheKey = createCacheKey(searchCriteria);
                                var optionsFromCache = ShoppingOptionsCacheService.getLeadPricesForRange(cacheKey, range.start, range.end);
                                if (_.size(optionsFromCache) > 0) {
                                    return resolve(optionsFromCache);
                                }
                                var advancedCalendarRequest = requestBuilderForDateRanges.createRequest(searchCriteria);
                                AdvancedCalendarSearchService.sendRequest(advancedCalendarRequest).then(
                                    function (response) {
                                        var itinerariesList = responseParser.parse(response);

                                        var shoppingData = new ShoppingData();
                                        shoppingData.markRequestedData(cacheKey, range.start, range.end);
                                        itinerariesList.getItineraries().forEach(function(itineary) {
                                            shoppingData.addItinerary(cacheKey, itineary, itineary.getOutboundDepartureDateTime());
                                        });
                                        shoppingData.updateLeadPrices(cacheKey);

                                        ShoppingOptionsCacheService.addUpdate(shoppingData);
                                        var leadPricesForRange = shoppingData.getLeadPricesForRange(cacheKey, range.start, range.end);
                                        return resolve(leadPricesForRange);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Advanced Calendar: Could not get lead prices for dates ' + range.start.format('YYYY-MM-DD') + ' thru ' + range.end.format('YYYY-MM-DD'), searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason, responseParser.getBusinessErrorMessages);
                                    }
                                );
                            });
                        },
                        getItineraries : function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                if (itinerariesFromDateRangeSearchMayBeReused(searchCriteria)) {
                                    var cacheKey = createCacheKey(searchCriteria);
                                    var tripDepartureDay = searchCriteria.getFirstLeg().departureDateTime.clone().startOf('day');
                                    var optionsFromCache = ShoppingOptionsCacheService.getItinerariesList(cacheKey, tripDepartureDay);
                                    if (optionsFromCache && optionsFromCache.size() > 0) {
                                        return resolve(optionsFromCache);
                                    }
                                }
                                var advancedCalendarRequest = requestBuilder.createRequest(searchCriteria);
                                AdvancedCalendarSearchService.sendRequest(advancedCalendarRequest).then(
                                    function (response) {
                                        var itinerariesList = responseParser.parse(response);
                                        return resolve(itinerariesList);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Advanced Calendar: Could not get itineraries', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason, responseParser.getBusinessErrorMessages);
                                    }
                                );
                            });
                        },
                        getAlternateDatesPriceMatrix: function (searchCriteria) {
                            if (!searchCriteria.isAlternateDatesRequest()) {
                                throw new Error('Calling Alternative Dates service for non alternative dates request');
                            }
                            var advancedCalendarRequest = requestBuilder.createRequest(searchCriteria);
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                AdvancedCalendarSearchService.sendRequest(advancedCalendarRequest).then(
                                    function (response) {
                                        var alternateDatesPriceMatrix = responseParser.extractAlternateDatesPriceMatrix(response);
                                        resolve(alternateDatesPriceMatrix);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Advanced Calendar: Could not get alternate dates lead prices', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason, responseParser.getBusinessErrorMessages);
                                    }
                                );
                            });

                        },
                        //WARN: assuming this method is called _after_ getLeadPricesForRange. Otherwise it will not return results.
                        //WARN: it will extract min date and price pair for the range that was previously specified when calling getLeadPricesForRange
                        getMinDateAndPricePair: function (searchCriteria) {
                            var cacheKey = createCacheKey(searchCriteria);
                            var minDateAndPricePair = ShoppingOptionsCacheService.getMinDateAndPricePair(cacheKey);
                            return {
                                  totalFareAmount: minDateAndPricePair.totalFareAmountWithCurrency.amount
                                , currency: minDateAndPricePair.totalFareAmountWithCurrency.currency
                                , date: minDateAndPricePair.date
                            };
                        },
                        //WARN: same comments as for getMinDateAndPricePair
                        getMaxAvailableDate: function (searchCriteria) {
                            var cacheKey = createCacheKey(searchCriteria);
                            return ShoppingOptionsCacheService.getMaxAvailableDate(cacheKey);
                        }
                    };
                }]);
    });
