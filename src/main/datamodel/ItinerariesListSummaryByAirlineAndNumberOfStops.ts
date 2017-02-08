define([
        'lodash'
    ],
    function (
        _
    ) {
        'use strict';

        function ItinerariesListSummaryByAirlineAndNumberOfStops(itineraries) {
            var summaries = this.calculateSummaries(itineraries);

            this.getSummaries = function () {
              return summaries;
            };
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.initializeSummaryForAirline = function(airlineSummaries, marketingAirline) {
            if (_.isUndefined(airlineSummaries[marketingAirline])) {
                airlineSummaries[marketingAirline] = this.createEmptySummary();
            }
            return airlineSummaries;
        };

        /*jshint maxcomplexity: 6*/
        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.calculateSummaries = function(itineraries) {

            var totalSummary = this.createEmptySummary();
            var airlineSummaries = {};

            var that = this;
            itineraries.forEach(function (itin) {
                var marketingAirline = itin.getFirstLeg().getFirstFlightMarketingAirline();
                airlineSummaries = that.initializeSummaryForAirline(airlineSummaries, marketingAirline);

                var itineraryTotalFareAmount = itin.totalFareAmountWithCurrency.amount;
                var totalFareCurrency = itin.totalFareAmountWithCurrency.currency;
                var itineraryNumberOfStops = itin.getNumberOfStops();

                that.updateSummary(totalSummary, itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops, itin.id);
                that.updateSummary(airlineSummaries[marketingAirline], itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops, itin.id);
            });

            totalSummary =  this.resetInfinityValuesToUndefined(totalSummary);
            var airlineSummariesArray = this.airlineSummariesToArray(airlineSummaries)
                .map(this.resetInfinityValuesToUndefined)
                .sort(this.airlineSummaryComparator);

            airlineSummariesArray = this.addIsCheapestFlags(airlineSummariesArray);

            return {
                airlineSummaries: airlineSummariesArray,
                totalSummary: totalSummary
            };
        }

        function assertSameCurrencies(summary, candidateCurrency) {
            if (summary.totalFareCurrency && summary.totalFareCurrency !== candidateCurrency) {
                throw new Error('Unable to compare two prices when they have different currencies');
            }
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.updateSummary = function(summary, itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops, itineraryId) {
            assertSameCurrencies(summary, totalFareCurrency);
            summary.totalFareCurrency = totalFareCurrency;

            if (itineraryNumberOfStops === 0) {
                if (itineraryTotalFareAmount < summary.nonStopLowestPrice) {
                    summary.nonStopLowestPrice = itineraryTotalFareAmount;
                    summary.nonStopLowestPriceItineraryId = itineraryId;
                }
            } else if (itineraryNumberOfStops === 1) {
                if (itineraryTotalFareAmount < summary.oneStopLowestPrice) {
                    summary.oneStopLowestPrice = itineraryTotalFareAmount;
                    summary.oneStopLowestPriceItineraryId = itineraryId;
                }
            } else { // for all number of stops over 1
                if (itineraryTotalFareAmount < summary.twoAndMoreStopsLowestPrice) {
                    summary.twoAndMoreStopsLowestPrice = itineraryTotalFareAmount;
                    summary.twoAndMoreStopsLowestPriceItineraryId = itineraryId;
                }
            }
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.createEmptySummary = function() {
            return {
                nonStopLowestPrice: Infinity,
                nonStopLowestPriceItineraryId: undefined,
                oneStopLowestPrice: Infinity,
                oneStopLowestPriceItineraryId: undefined,
                twoAndMoreStopsLowestPrice: Infinity,
                twoAndMoreStopsLowestPriceItineraryId: undefined
            };
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.airlineSummariesToArray = function(airlineSummariesObj) {
            return _.map(airlineSummariesObj, function (summary, airlineCode) {
                return _.extend({}, {airline: airlineCode}, summary);
            });
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.resetInfinityValuesToUndefined = function(object) {
            var retValue = {};
            _.each(object, function (propValue, propKey) {
                retValue[propKey] = (propValue === Infinity)? undefined : propValue;
            });
            return retValue;
        }

        /**
         * Sorts airline summaries array, bringing to the head of array the records with lowest prices, regardless of number of stops.
         * Number of stops is not considered, only prices.
         */
        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.airlineSummaryComparator = function(first, second) {
            var firstLowestPrice = _.min([first.nonStopLowestPrice, first.oneStopLowestPrice, first.twoAndMoreStopsLowestPrice]);
            var secondLowestPrice = _.min([second.nonStopLowestPrice, second.oneStopLowestPrice, second.twoAndMoreStopsLowestPrice]);
            if (firstLowestPrice === secondLowestPrice) {
                return 0;
            } else if (firstLowestPrice > secondLowestPrice) {
                return 1;
            } else {
                return -1;
            }
        }

        /**
         * Operates on assumption that the list is already sorted.
         */
        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.addIsCheapestFlags = function(airlineSummaries) {
            var firstCheapestNonStop = _.find(airlineSummaries, 'nonStopLowestPrice');
            if (firstCheapestNonStop) {
                firstCheapestNonStop.isCheapestNonStop = true;
            }

            var firstCheapestOneStop = _.find(airlineSummaries, 'oneStopLowestPrice');
            if (firstCheapestOneStop) {
                firstCheapestOneStop.isCheapestOneStopLowestPrice = true;
            }

            var firstCheapestTwoOrMoreStops = _.find(airlineSummaries, 'twoAndMoreStopsLowestPrice');
            if (firstCheapestTwoOrMoreStops) {
                firstCheapestTwoOrMoreStops.isCheapestTowOrMoreStopsLowestPrice = true;
            }

            return airlineSummaries;
        }

        return ItinerariesListSummaryByAirlineAndNumberOfStops;
    });
