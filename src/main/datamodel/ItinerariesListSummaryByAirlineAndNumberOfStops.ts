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

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.calculateSummaries = function(itineraries) {

            var totalSummary = this.createEmptySummary();
            var airlineSummaries = {};

            var that = this;
            itineraries.forEach(function (itin) {
                var marketingAirline = itin.getFirstLeg().getFirstFlightMarketingAirline();

                if (_.isUndefined(airlineSummaries[marketingAirline])) {
                    airlineSummaries[marketingAirline] = that.createEmptySummary();
                }

                var itineraryTotalFareAmount = itin.totalFareAmountWithCurrency.amount;
                var totalFareCurrency = itin.totalFareAmountWithCurrency.currency;
                var itineraryNumberOfStops = itin.getNumberOfStops();

                that.updateSummary(totalSummary, itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops);
                that.updateSummary(airlineSummaries[marketingAirline], itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops);
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

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.updateSummary = function(summary, itineraryTotalFareAmount, totalFareCurrency, itineraryNumberOfStops) {
            if (summary.totalFareCurrency && summary.totalFareCurrency !== totalFareCurrency) {
                throw new Error('Unable to compare two prices when they have different currencies');
            }
            summary.totalFareCurrency = totalFareCurrency;

            if (itineraryNumberOfStops === 0) {
                summary.nonStopLowestPrice = Math.min(summary.nonStopLowestPrice, itineraryTotalFareAmount);
            } else if (itineraryNumberOfStops === 1) {
                summary.oneStopLowestPrice = Math.min(summary.oneStopLowestPrice, itineraryTotalFareAmount);
            } else { // for all number of stops over 1
                summary.twoAndMoreStopsLowestPrice = Math.min(summary.twoAndMoreStopsLowestPrice, itineraryTotalFareAmount);
            }
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.createEmptySummary = function() {
            return {
                nonStopLowestPrice: Infinity
                , oneStopLowestPrice: Infinity
                , twoAndMoreStopsLowestPrice: Infinity
            };
        }

        ItinerariesListSummaryByAirlineAndNumberOfStops.prototype.airlineSummariesToArray = function(airlineSummariesObj) {
            return _.map(airlineSummariesObj, function (summary, airlineCode) {
                return {
                    airline: airlineCode
                    , nonStopLowestPrice: summary.nonStopLowestPrice
                    , oneStopLowestPrice: summary.oneStopLowestPrice
                    , twoAndMoreStopsLowestPrice: summary.twoAndMoreStopsLowestPrice
                };
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
