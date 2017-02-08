define([
        'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/WebServicesResourceDefinitions'
    ],
    function (
        angular
        , _
        , __
        , SabreDevStudioWebServicesModule
        , WebServicesResourceDefinitions
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('DestinationFinderDataService', [
                '$q'
                , 'dateFormat'
                , 'DestinationFinderWebService'
                , 'pointOfSaleCountry'
                , 'ErrorReportingService'
                , 'businessMessagesErrorHandler'
                , function (
                    $q
                    , dateFormat
                    , DestinationFinderWebService
                    , pointOfSaleCountry
                    , ErrorReportingService
                    , businessMessagesErrorHandler
                ) {
                    function translateSearchCriteriaIntoRequestParams(searchCriteria) {
                        var requestParams: any = {};

                        requestParams.origin = searchCriteria.origin;

                        var requestedPointOfSaleCountry = (searchCriteria.pointOfSaleCountry) && searchCriteria.pointOfSaleCountry || (pointOfSaleCountry.length > 0) && pointOfSaleCountry;
                        if (requestedPointOfSaleCountry) {
                            requestParams.pointofsalecountry = requestedPointOfSaleCountry;
                        }

                        requestParams.earliestdeparturedate = searchCriteria.inspirationalSearchPolicy.earliestdeparturedate.format(dateFormat);
                        requestParams.latestdeparturedate = searchCriteria.inspirationalSearchPolicy.latestdeparturedate.format(dateFormat);
                        requestParams.lengthofstay = searchCriteria.inspirationalSearchPolicy.lengthOfStayDays.join();
                        requestParams.topdestinations = searchCriteria.inspirationalSearchPolicy.topdestinations;

                        requestParams.theme = searchCriteria.theme;

                        return requestParams;
                    }

                    return {
                        getPricesForDestinations: function (searchCriteria) {
                            return $q(function(resolve, reject) {
                                var requestParams = translateSearchCriteriaIntoRequestParams(searchCriteria);
                                DestinationFinderWebService.get(requestParams).$promise.then(
                                    function (pricesForDestinations) {
                                        const origin = pricesForDestinations.OriginLocation;
                                        pricesForDestinations.FareInfo = pricesForDestinations.FareInfo
                                            .filter((offer) => isFinite(offer.LowestFare.Fare)) //WARN: LowestFare from API may be also just string "N/A"
                                            .map(_.partial(addOrigin, origin))
                                            .map(parseTravelDates);
                                        resolve(pricesForDestinations);
                                    },
                                    function (reason) {
                                        ErrorReportingService.reportError('Could not get prices for destinations', searchCriteria);
                                        businessMessagesErrorHandler.handle(reject, reason);
                                    }
                                );
                            });

                            function parseTravelDates(offer) {
                                var departureDateTime = new Date(offer.DepartureDateTime);
                                var returnDateTime = new Date(offer.ReturnDateTime);
                                const copyWithDatesParsed = _.extend({}, offer, {
                                    departureDateTime: departureDateTime,
                                    returnDateTime: returnDateTime,
                                    lengthOfStay: __.dateDiffDays(departureDateTime, returnDateTime)
                                });
                                delete copyWithDatesParsed.DepartureDateTime;
                                delete copyWithDatesParsed.ReturnDateTime;
                                return copyWithDatesParsed;
                            }

                            function addOrigin(origin, offer) {
                                return _.extend({}, offer, {
                                    origin: origin
                                });
                            }
                        }
                    };
                }]);

    });
