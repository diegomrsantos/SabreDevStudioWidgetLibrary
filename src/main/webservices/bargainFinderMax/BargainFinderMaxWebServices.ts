define([
          'util/LodashExtensions'
        , 'angular'
        , 'moment'
        , 'moment_range'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
        , 'webservices/bargainFinderMax/BargainFinderMaxRequestFactory'
        , 'webservices/bargainFinderMax/BFMResponseParser'
        , 'webservices/bargainFinderMax/BrandedBFMResponseParser'
        , 'datamodel/ItinerariesList'
        , 'util/NGPromiseUtils'
    ],
    function (
          _
        , angular
        , moment
        , moment_range
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
        , BargainFinderMaxRequestFactory
        , BFMResponseParser
        , BrandedBFMResponseParser
        , ItinerariesList
        , NGPromiseUtils
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('BargainFinderMaxDataService', [
                      '$q'
                    , 'BargainFinderMaxWebService'
                    , 'BargainFinderMaxAlternateDateWebService'
                    , 'ErrorReportingService'
                    , 'businessMessagesErrorHandler'
                    , 'bfmRequestPcc'
                , function (
                      $q
                    , bfmWebService
                    , bfmAltDatesWebService
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                    , bfmRequestPcc
                ) {

                    /**
                     * The main method, for getting Shopping itineraries (ItinerariesList, holding Itinerary object, not branded) from Bargain Finder Max (BFM) web service.
                     * @param searchCriteria
                     * @returns {*}
                     */
                    function getItineraries(searchCriteria) {
                        if (!searchCriteria.isAlternateDatesRequest()) {
                            return getDataFromService(bfmWebService, searchCriteria);
                        }
                        // alternate dates requests
                        if (searchCriteria.isAlternateDatesRequest()) {
                            if (searchCriteria.returnAlternateDatesOnly) {
                                return getDataFromService(bfmAltDatesWebService, searchCriteria);
                            } else { // call both Alt Dates BFM and normal BFM
                                var searchCriteriaWithoutDateFlexibility = searchCriteria.cloneWithoutDateFlexibility();
                                var bfmDataPromise = getDataFromService(bfmWebService, searchCriteriaWithoutDateFlexibility);
                                var bfmAltDatesDataPromise = getDataFromService(bfmAltDatesWebService, searchCriteria);
                                return $q.mergePromises([bfmDataPromise, bfmAltDatesDataPromise], itinerariesListMergingFn, otaResponseErrorsMergingFn);
                            }
                        }
                    }

                    var bfmRequestFactory = new BargainFinderMaxRequestFactory({
                        bfmRequestPcc: bfmRequestPcc
                    });

                    var parser = new BFMResponseParser();

                    var bfmBrandedRequestFactory = new BargainFinderMaxRequestFactory({
                        bfmRequestPcc: bfmRequestPcc
                    });
                    bfmBrandedRequestFactory.requestBrandedFares = true;

                    var brandedItinerariesParser = new BrandedBFMResponseParser();

                    /**
                     * Returns itineraries with brand information if this information is available.
                     * So it may return only branded itineraries, mix of branded and non-branded or only non-branded itineraries
                     * @param searchCriteria
                     * @returns {*}
                     */
                    function getBrandedItineraries(searchCriteria) {
                        var bfmBrandedRequest = bfmBrandedRequestFactory.createRequest(searchCriteria);
                        return $q(function(resolve, reject) {
                            bfmWebService.sendRequest(bfmBrandedRequest).then(
                                function (response) {
                                    var itinerariesList = brandedItinerariesParser.parse(response);
                                    resolve(itinerariesList);
                                },
                                function (reason) {
                                    ErrorReportingService.reportError('Could not find branded itineraries', searchCriteria);
                                    businessMessagesErrorHandler.handle(reject, reason, brandedItinerariesParser.getBusinessErrorMessages);
                                }
                            );
                        });
                    }

                    /**
                     * Returns the matrix of alternate dates lead prices: that is the matrix of cheapest fare per given outbound and inbound days of travel.
                     * The returned matrix is stored in the designated container AlternateDatesOneWayPriceMatrix or AlternateDatesRoundTripPriceMatrix.
                     * @param searchCriteria
                     * @returns {*}
                     */
                    function getAlternateDatesPriceMatrix(searchCriteria) {
                        if (!searchCriteria.isAlternateDatesRequest()) {
                            throw new Error('Calling Alternative Dates service for non alternative dates request');
                        }
                        var bfmRequest = bfmRequestFactory.createRequest(searchCriteria);
                        return $q(function(resolve, reject) {
                            bfmAltDatesWebService.sendRequest(bfmRequest).then(
                                function (response) {
                                    var alternateDatesPriceMatrix = parser.extractAlternateDatesPriceMatrix(response);
                                    resolve(alternateDatesPriceMatrix);
                                },
                                function (reason) {
                                    ErrorReportingService.reportError('BFM: Could not find alternate dates prices', searchCriteria);
                                    businessMessagesErrorHandler.handle(reject, reason, parser.getBusinessErrorMessages);
                                }
                            );
                        });
                    }

                    function getDataFromService(webService, searchCriteria) {
                        var bfmRequest = bfmRequestFactory.createRequest(searchCriteria);
                        return $q(function(resolve, reject) {
                            webService.sendRequest(bfmRequest).then(
                                function (response) {
                                    var itinerariesList = parser.parse(response);
                                    resolve(itinerariesList);
                                },
                                function (reason) {
                                    ErrorReportingService.reportError('BFM: Could not find itineraries', searchCriteria);
                                    businessMessagesErrorHandler.handle(reject, reason, parser.getBusinessErrorMessages);
                                }
                            );
                        });
                    }

                    function itinerariesListMergingFn(first, second) {
                        first = first || new ItinerariesList();
                        return first.addItinerariesListWithDedup(second);
                    }

                    function otaResponseErrorsMergingFn(first, second) {
                        first = first || [];
                        return _.unique(_.pushAll(first, second));
                    }

                    return {
                        getItineraries: getItineraries,
                        getBrandedItineraries: getBrandedItineraries,
                        getAlternateDatesPriceMatrix: getAlternateDatesPriceMatrix
                    };
            }]);
    });
