define([
          'angular'
        , 'moment'
        , 'lodash'
        , 'webservices/leadPriceCalendar/LeadPriceCalendarSearchCriteriaValidator'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'datamodel/ShoppingData'
        , 'webservices/leadPriceCalendar/LeadPriceCalendarResponseParser'
    ],
    function (
          angular
        , moment
        , _
        , LeadPriceCalendarSearchCriteriaValidator
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , ShoppingData
        , LeadPriceCalendarResponseParser
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('LeadPriceCalendarDataService', [
                '$q'
                , '$cacheFactory'
                , 'LeadPriceCalendarWebService'
                , 'LeadPriceCalendarResponseParser'
                , 'pointOfSaleCountry'
                , 'ErrorReportingService'
                , 'ValidationErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                    $q
                    , $cacheFactory
                    , LeadPriceCalendarWebService
                    , parser
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , ValidationErrorReportingService
                    , businessMessagesErrorHandler
                ) {

                    var leadFaresCache = $cacheFactory('leadPricesCache');

                    var validator = new LeadPriceCalendarSearchCriteriaValidator();

                    function translateSearchCriteriaIntoRequestOptions(searchCriteria) {
                        var requestOptions = {
                            origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , lengthofstay: searchCriteria.getLengthOfStay()
                        };
                        if (pointOfSaleCountry.length > 0) {
                            _.extend(requestOptions, {
                                pointofsalecountry: pointOfSaleCountry
                            });
                        }
                        return requestOptions;
                    }

                    function translateSearchCriteriaIntoAlternateDatesRequestOptions(searchCriteria) {
                        var departureDates = searchCriteria.getRequestedDepartureDates();
                        var lengthOfStays = searchCriteria.getRequestedLengthOfStayValues();
                        lengthOfStays = lengthOfStays.filter(travelInsightsEngineAcceptedLengthOfStayValues);

                        var centralDateRequestLengthOfStay = searchCriteria.getLengthOfStay();
                        var MAX_LEAD_PRICE_CALENDAR_ACCEPTED_LENGTHOFSTAY_SPECIFICATIONS = 10;
                        if (lengthOfStays.length > MAX_LEAD_PRICE_CALENDAR_ACCEPTED_LENGTHOFSTAY_SPECIFICATIONS) {
                            lengthOfStays = filterOutMostDistantLoS(lengthOfStays, centralDateRequestLengthOfStay, MAX_LEAD_PRICE_CALENDAR_ACCEPTED_LENGTHOFSTAY_SPECIFICATIONS);
                        }
                        // Note that such combining of departure dates with all length of stays is the superset of what search criteria specified
                        // (we are producing more combinations), but the interface to Lead Price Calendar does not allow specifying length of stays per departure date
                        var requestOptions = {
                            origin: searchCriteria.getFirstLeg().origin
                            , destination: searchCriteria.getFirstLeg().destination
                            , departuredate: departureDates.map(function (date) {
                                return date.format('YYYY-MM-DD');
                            }).join(',')
                            , lengthofstay: lengthOfStays.join(',')
                        };
                        if (pointOfSaleCountry.length > 0) {
                            _.extend(requestOptions, {
                                pointofsalecountry: pointOfSaleCountry
                            });
                        }
                        return requestOptions;
                    }

                    function travelInsightsEngineAcceptedLengthOfStayValues(LoS) {
                        return (LoS <=16);
                    }

                    function filterOutMostDistantLoS(candidatesIncludingOriginal, original, maxCount) {

                        function distanceToOriginalLengthOfStay(candidate) {
                            return Math.abs(original - candidate);
                        }

                        var sorted = _.sortBy(candidatesIncludingOriginal, distanceToOriginalLengthOfStay);
                        return _.slice(sorted, 0, maxCount);
                    }

                    function sliceLeadFares(leadFares, range) {
                        return leadFares.filter(function (leadFare) {
                            var date = moment(leadFare.departureDateTime, moment.ISO_8601);
                            return range.contains(date);
                        });
                    }

                    function getMinDateAndPricePair(leadFares, maxStops) {
                        var minLeadFare = _.min(leadFares, function (leadFare) {
                            return (maxStops === 0)? leadFare.lowestNonStopFare: leadFare.lowestFare;
                        });
                        return {
                              totalFareAmount: (maxStops === 0)? minLeadFare.lowestNonStopFare: minLeadFare.lowestFare
                            , currency: minLeadFare.currency
                            , date: moment(minLeadFare.departureDateTime, moment.ISO_8601)
                        };
                    }

                    function getMaxAvailableDate(leadFares) {
                        var maxAvailableDateString = leadFares.reduce(function (maxAvailableDate, leadFare) {
                            if (_.isUndefined(maxAvailableDate) || (leadFare.departureDateTime > maxAvailableDate)) {
                                return leadFare.departureDateTime;
                            }
                        });
                        return moment(maxAvailableDateString, moment.ISO_8601);
                    }

                    function buildLeadPrices(leadFaresForRange, maxStops) {
                        return leadFaresForRange.reduce(function (acc, leadFare) {
                            var dateKey = moment(leadFare.departureDateTime, moment.ISO_8601).format(ShoppingData.prototype.DATE_FORMAT_FOR_KEYS);
                            var leadPrice = (maxStops === 0)? leadFare.lowestNonStopFare: leadFare.lowestFare;
                            acc[dateKey] = {
                                  price: leadPrice
                                , currency: leadFare.currency
                            };
                            return acc;
                        }, {});
                    }

                    return {
                        getLeadPricesForRange: function (searchCriteria, range) {
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                var dataFromCache = leadFaresCache.get(searchCriteria);
                                if (dataFromCache) {
                                    let leadFaresForRange = sliceLeadFares(dataFromCache, range);
                                    let leadPrices = buildLeadPrices(leadFaresForRange, searchCriteria.maxStops);
                                    return resolve(leadPrices);
                                }
                                var webServiceRequestOptions = translateSearchCriteriaIntoRequestOptions(searchCriteria);
                                LeadPriceCalendarWebService.get(webServiceRequestOptions).$promise.then(
                                    function(response) {
                                        var leadFares = parser.parse(response);
                                        leadFaresCache.put(searchCriteria, leadFares);
                                        let leadFaresForRange = sliceLeadFares(leadFares, range);
                                        let leadPrices = buildLeadPrices(leadFaresForRange, searchCriteria.maxStops);
                                        return resolve(leadPrices);
                                    },
                                    function(reason) {
                                        ErrorReportingService.reportError('Lead Price Calendar: Could not get lead prices for dates ' + range.start.format('YYYY-MM-DD') + ' thru ' + range.end.format('YYYY-MM-DD'), searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason, parser.getBusinessErrorMessages);
                                    }
                                );
                            });
                        },
                        getAlternateDatesPriceMatrix: function(searchCriteria) {
                            if (!searchCriteria.isAlternateDatesRequest()) {
                                throw new Error('Calling Alternative Dates service for non alternative dates request');
                            }
                            var webServiceRequestOptions = translateSearchCriteriaIntoAlternateDatesRequestOptions(searchCriteria);
                            return $q(function(resolve, reject) {
                                var validationErrors = validator.validate(searchCriteria);
                                if (validationErrors.length > 0) {
                                    ValidationErrorReportingService.reportErrors(validationErrors, 'Unsupported search criteria');
                                    return reject(validationErrors);
                                }
                                LeadPriceCalendarWebService.get(webServiceRequestOptions).$promise.then(
                                    function (response) {
                                        var alternateDatesPriceMatrix = parser.extractAlternateDatesPriceMatrix(response);
                                        resolve(alternateDatesPriceMatrix);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Lead Price Calendar: Could not get alternate dates lead prices', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason, parser.getBusinessErrorMessages);
                                    }
                                );
                            });
                        },
                        getMinDateAndPricePair: function (searchCriteria) { // see AdvancedCalendarService, same method comments
                            var dataFromCache = leadFaresCache.get(searchCriteria);
                            if (_.isUndefined(dataFromCache)) {
                                throw new Error('trying to get aggregate from lead prices data while first call not done yet');
                            }
                            return getMinDateAndPricePair(dataFromCache, searchCriteria.maxStops);
                        },
                        getMaxAvailableDate: function (searchCriteria) { // see AdvancedCalendarService, same method comments
                            var dataFromCache = leadFaresCache.get(searchCriteria);
                            if (_.isUndefined(dataFromCache)) {
                                throw new Error('trying to get aggregate from lead prices data while first call not done yet');
                            }
                            return getMaxAvailableDate(dataFromCache);
                        }

                    };
                }
            ]);

    });
