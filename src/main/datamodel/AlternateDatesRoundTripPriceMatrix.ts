define([
          'lodash'
        , 'datamodel/AlternateDatesAbstractPriceMatrix'
    ],
    function (
          _
        , AlternateDatesAbstractPriceMatrix
    ) {
        'use strict';

        function AlternateDatesRoundTripPriceMatrix() {
            AlternateDatesAbstractPriceMatrix.apply(this, arguments);
        }

        AlternateDatesRoundTripPriceMatrix.prototype = Object.create(AlternateDatesAbstractPriceMatrix.prototype);
        AlternateDatesRoundTripPriceMatrix.prototype.constructor = AlternateDatesRoundTripPriceMatrix;

        AlternateDatesRoundTripPriceMatrix.prototype.addLeadFareForDate = function (travelDatesWithLeadPrice) {
            var entry = this.findEntryForDepartureAndReturnDates(travelDatesWithLeadPrice.departureDate, travelDatesWithLeadPrice.returnDate);
            this.updateEntry(entry, travelDatesWithLeadPrice.price, travelDatesWithLeadPrice.currency);
        };

        AlternateDatesRoundTripPriceMatrix.prototype.getLeadFareForTravelDates = function (departureDate, returnDate) {
            var sameDateAsDepartureDateFn = _.partial(this.datesAreSameDay, departureDate);
            var departureEntry = _.find(this.leadFaresForDates, function (entry) {
                return sameDateAsDepartureDateFn(entry.departureDate);
            });
            if (_.isUndefined(departureEntry)) {
                return;
            }
            var sameDateAsReturnDateFn = _.partial(this.datesAreSameDay, returnDate);
            var entry = _.find(departureEntry.pricesForReturnDates, function (price) {
                return sameDateAsReturnDateFn(price.returnDate);
            });
            if (_.isUndefined(entry)) {
                return;
            }
            return {
                price: entry.price,
                currency: entry.currency
            };
        };

        /**
         * Returns ordered deduplicated list of all return dates that exist for any departure date
         */
        AlternateDatesRoundTripPriceMatrix.prototype.getAllReturnDates = function () {
            var allReturnDates = _.flattenDeep(this.leadFaresForDates.map(function (departureDateEntry) {
                return departureDateEntry.pricesForReturnDates.map(function (returnDateEntry) {
                    return returnDateEntry.returnDate;
                });
            }));
            return _.uniq(allReturnDates, false, function (momentDate) {
                return momentDate.unix();
            });
        };

        AlternateDatesRoundTripPriceMatrix.prototype.findEntryForDepartureAndReturnDates = function(departureDate, returnDate) {
            var departureDateEntry = this.findEntryForDepartureDate(departureDate);
            return this.findEntryForReturnDate(departureDateEntry, returnDate);
        }

        AlternateDatesRoundTripPriceMatrix.prototype.findEntryForReturnDate = function(departureDateEntry, returnDate) {
            if (_.isUndefined(departureDateEntry.pricesForReturnDates)) {
                departureDateEntry.pricesForReturnDates = [];
            }
            var departureDateEntriesArray = departureDateEntry.pricesForReturnDates;
            var sameDateAsReturnDateFn = _.partial(this.datesAreSameDay, returnDate);
            var entryForReturnDate = _.find(departureDateEntriesArray, function (entry) {
                return sameDateAsReturnDateFn(entry.returnDate);
            });
            if (_.isUndefined(entryForReturnDate)) {
                var newEntry = {
                    returnDate: returnDate
                };
                var lowestIndexForInsert = _.sortedIndex(departureDateEntriesArray, newEntry, function (entry) {
                    return entry.returnDate.unix();
                });
                departureDateEntriesArray.splice(lowestIndexForInsert, 0, newEntry);
                return newEntry;
            }
            return entryForReturnDate;
        }

        return AlternateDatesRoundTripPriceMatrix;
    });