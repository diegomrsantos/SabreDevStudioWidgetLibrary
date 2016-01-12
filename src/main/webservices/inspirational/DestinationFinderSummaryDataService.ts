/// <reference path="../../../../typings/tsd.d.ts" />
define([
          'angular'
        , 'moment'
        , 'lodash'
        , 'datamodel/MonetaryAmount'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/inspirational/DestinationFinderDataService'
        , 'webservices/lookup/AirportLookupDataService'
        , 'webservices/common/PromiseUtils'
    ],
    function (
          angular
        , moment
        , _
        , MonetaryAmount
        , SabreDevStudioWebServicesModule
        , DestinationFinderDataServiceSrc
        , AirportLookupDataServiceSrc
        , PromiseUtilsSrc
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('DestinationFinderSummaryDataService', [
                  '$q'
                , 'DestinationFinderDataService'
                , 'AirportLookupDataService'
                , 'PromiseUtils'
                , function (
                      $q
                    , DestinationFinderDataService
                    , AirportLookupDataService
                    , PromiseUtils
                ) {

                    /** Returns summaries of prices for destinations. Contains array (ordered by destinationRank) of destinations, all offers to that destination and lowest fare offer to this destination.
                     */
                    function getOffersOrderedSummary(searchCriteria) {
                        return $q(function(resolve, reject) {
                            DestinationFinderDataService.getPricesForDestinations(searchCriteria).then(function(pricesForDestinations) {
                                // mapping of destination code into list of offers to this destination
                                var offersWithPrices = pricesForDestinations.FareInfo
                                    .filter((offer) => isFinite(offer.LowestFare.Fare)); //WARN: LowestFare from API may be also just string "N/A"
                                var allDestinationAirports = _.unique(offersWithPrices.map(function (offer) {
                                    return offer.DestinationLocation;
                                }));
                                buildAirportToCityMapping(allDestinationAirports).then(function (airportCodeIntoCityNameMapping) {
                                    var orderedSummary = {
                                        pricesForDestinationsGrouped: buildGroupingForDestinations(offersWithPrices, airportCodeIntoCityNameMapping)
                                        , originForPricesForDestinations: pricesForDestinations.OriginLocation
                                    };
                                    resolve(orderedSummary);
                                }, reject);
                            }, reject)
                        });
                    }

                    function buildAirportToCityMapping(allDestinationAirports) {
                        return $q(function(resolve, reject) {
                            $q.mapSettled(allDestinationAirports, AirportLookupDataService.getAirportDataWithAirportCode).then(function (results) {
                                PromiseUtils.rejectIfAnyRejected(results, reject);
                                var airportCodeIntoCityNameMapping = results
                                    .map((item) => item.value)
                                    .reduce(function (allMappings, mappingForOneAirport) {
                                    if (mappingForOneAirport) { // it may happen that the mapping was not found so mappingForOneAirport will be undefined
                                        allMappings[mappingForOneAirport.airportCode] = mappingForOneAirport.CityName;
                                    }
                                    return allMappings;
                                }, {});
                                resolve(airportCodeIntoCityNameMapping);
                            });
                        });
                    }

                    function buildGroupingForDestinations(offersWithPrices, airportCodeIntoCityNameMapping) {
                        return _.chain(offersWithPrices)
                            .groupBy(function (offer) {
                                return airportCodeIntoCityNameMapping[offer.DestinationLocation] || offer.DestinationLocation;
                            })
                            .pairs()
                            .sortBy(function (pairOfCityAndOffersForCity) {
                                var offersForDestination = pairOfCityAndOffersForCity[1];
                                var destinationRank = offersForDestination[0].DestinationRank; // DestinationRank must be the same for all offers for one destination and also the same for all airports within one MAC city. So reading DestinationRank from first one.
                                return destinationRank;
                            })
                            .map(zipIntoObject)
                            .map(addLowestFareOffer)
                            .value(); // array is sorted by destinationRank
                    }

                    function zipIntoObject(destinationAndOffersForDestinationPair) {
                        var destinationCity = destinationAndOffersForDestinationPair[0];
                        var offersForDestination = destinationAndOffersForDestinationPair[1];
                        return {
                            destinationCity: destinationCity
                            , destination: offersForDestination[0].DestinationLocation
                            , offers: offersForDestination
                        }
                    }

                    function addLowestFareOffer(destinationAndOffers) {
                        var lowestFareOffer = _.min(destinationAndOffers.offers, function (offer) {
                            return offer.LowestFare.Fare;
                        });
                        return _.extend(destinationAndOffers, {
                            lowestFare: new MonetaryAmount(lowestFareOffer.LowestFare.Fare, lowestFareOffer.CurrencyCode)
                        });
                    }

                    return {
                        getOffersOrderedSummary: getOffersOrderedSummary
                    };
                }]);

    });