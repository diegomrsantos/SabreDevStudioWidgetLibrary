define([
        'lodash'
    ],
    function (
        _
    ) {
        'use strict';

        function AlternateDatesAbstractPriceMatrix() {

            /* example content for round trip matrix: order of departure and return dates is maintained (sort order is maintained while inserting new elements)
             [
             {
             departureDate: '05 Jan'
             , pricesForReturnDates: [{ returnDate: '10 Jan', price: 100, currency: 'USD' }, { returnDate: '11 Jan', price: 110, currency: 'USD' }]
             },
             {
             departureDate: '06 Jan'
             , pricesForReturnDates: [{ returnDate: '10 Jan', price: 100, currency: 'USD' }, { returnDate: '11 Jan', price: 110, currency: 'USD' }]
             }
             ]

             example content for one way matrix: order of departure dates is maintained (sort order is maintained while inserting new elements)
             [
             {
             departureDate: '05 Jan',
             price: 100,
             currency: 'USD'
             },
             {
             departureDate: '06 Jan'
             price: 105,
             currency: 'USD'
             }
             ]
             */
            this.leadFaresForDates = [];
        }

        /**
         * returns ordered matrix of lead prices. Both departure dates and return dates are ordered ascending.
         * @returns {Array}
         */
        AlternateDatesAbstractPriceMatrix.prototype.getAllLeadFares = function () {
            return this.leadFaresForDates;
        };

        AlternateDatesAbstractPriceMatrix.prototype.findEntryForDepartureDate = function(departureDate) {
            var sameDateAsDepartureDateFn = _.partial(this.datesAreSameDay, departureDate);
            var entryForDepartureDate = _.find(this.leadFaresForDates, function (entry) {
                return sameDateAsDepartureDateFn(entry.departureDate);
            });
            if (_.isUndefined(entryForDepartureDate)) {
                var newEntry = {
                    departureDate: departureDate
                };
                var lowestIndexForInsert = _.sortedIndex(this.leadFaresForDates, newEntry, function (entry) {
                    return entry.departureDate.unix();
                });
                this.leadFaresForDates.splice(lowestIndexForInsert, 0, newEntry);
                return newEntry;
            }
            return entryForDepartureDate;
        };

        AlternateDatesAbstractPriceMatrix.prototype.updateEntry = function(entry, candidatePrice, candidateCurrency) {
            if (entry.currency && (entry.currency !== candidateCurrency)) {
                throw new Error('Different currency when trying to update price for dates. Cannot compare the already cheapest fare in ' + entry.currency + ' to candidate fare in ' + candidateCurrency);
            }
            if (_.isUndefined(entry.currency)) {
                entry.currency = candidateCurrency;
            }
            if (_.isUndefined(entry.price) || (entry.price > candidatePrice)) {
                entry.price = candidatePrice;
            }
        };

        AlternateDatesAbstractPriceMatrix.prototype.datesAreSameDay = function(first, second) {
            // WARN: other methods of comparing, like moment dayOfYear() or first.clone().startOf('day').isSame(second.clone().startOf('day')) are 10-20 times slower.
            return (first.date() === second.date()) && (first.month() === second.month()) && (first.year() === second.year());
        };

        AlternateDatesAbstractPriceMatrix.prototype.hasAtLeastOnePrice = function () {
            return (!_.isEmpty(this.leadFaresForDates));
        };

        return AlternateDatesAbstractPriceMatrix;
    });
