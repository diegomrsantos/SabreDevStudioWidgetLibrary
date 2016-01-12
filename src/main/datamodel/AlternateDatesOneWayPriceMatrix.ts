define([
          'lodash'
        , 'datamodel/AlternateDatesAbstractPriceMatrix'
    ],
    function (
          _
        , AlternateDatesAbstractPriceMatrix
    ) {
        'use strict';

        /**
         * Class storing price matrix for one way alternate date shopping offers (central departure date plus several alternative departure dates)
         *
         * See also similar class AlternateDatesRoundTripPriceMatrix.
         * Both are not refactored into one general N-dimension alternates price matrix to keep code simple.
         * Also there is no need for over 2 dimensions matrix (alternate dates for multidestination trip).
         */
        function AlternateDatesOneWayPriceMatrix() {

            AlternateDatesAbstractPriceMatrix.apply(this, arguments);
        }

        AlternateDatesOneWayPriceMatrix.prototype = Object.create(AlternateDatesAbstractPriceMatrix.prototype);
        AlternateDatesOneWayPriceMatrix.prototype.constructor = AlternateDatesOneWayPriceMatrix;

        AlternateDatesOneWayPriceMatrix.prototype.addLeadFareForDate = function (travelDatesWithLeadPrice) {
            var entry = this.findEntryForDepartureDate(travelDatesWithLeadPrice.departureDate);
            this.updateEntry(entry, travelDatesWithLeadPrice.price, travelDatesWithLeadPrice.currency);
        };

        AlternateDatesOneWayPriceMatrix.prototype.getLeadFareForTravelDate = function (departureDate) {
            var sameDateAsDepartureDateFn = _.partial(this.datesAreSameDay, departureDate);
            var entry = _.find(this.leadFaresForDates, function (leadFare) {
                return sameDateAsDepartureDateFn(leadFare.departureDate);
            });
            if(_.isUndefined(entry)) {
                return;
            }
            return {
                price: entry.price,
                currency: entry.currency
            };
        };

        return AlternateDatesOneWayPriceMatrix;
    });