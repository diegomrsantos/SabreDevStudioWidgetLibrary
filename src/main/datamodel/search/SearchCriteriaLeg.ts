define([
        'lodash'
    ],
    function (
        _
    ) {
        'use strict';

        /**
         * The details object to the Search Criteria. Represents one leg of the requested travel. Contains all flight related information of one leg.
         * @param origin: 3 letter airport code, case not important
         * @param destination: 3 letter airport code, case not important
         * @param departureDateTime: moment object, not String or plain Javascript Date
         * @param arrivalDateTime: moment object, not String or plain Javascript Date
         * @constructor
         */
        function SearchCriteriaLeg(legOnDAndDates) {

            var that = this;

            var originNormalized = legOnDAndDates.origin.toUpperCase();
            validateAirportRegex(originNormalized);
            this.origin = originNormalized;

            var destinationNormalized = legOnDAndDates.destination.toUpperCase();
            validateAirportRegex(destinationNormalized);
            this.destination = destinationNormalized;

            var _departureDateTime;

            Object.defineProperty(this, 'departureDateTime', {
                enumerable: true,
                get: function() {
                    return _departureDateTime && _departureDateTime.clone();}, // defensive cloning to avoid many errors resulting from moment objects mutable
                set: function(departureDateTime) {
                    _departureDateTime = departureDateTime && departureDateTime.clone();}
            });

            this.departureDateTime = legOnDAndDates.departureDateTime;

            var _arrivalDateTime;
            Object.defineProperty(this, 'arrivalDateTime', {
                enumerable: true,
                get: function() {
                    return _arrivalDateTime && _arrivalDateTime.clone(); // defensive cloning to avoid many errors resulting from moment objects mutable
                },
                set: function(arrivalDateTime) {
                    if (arrivalDateTime) {
                        _arrivalDateTime = arrivalDateTime && arrivalDateTime.clone();
                    }
                }
            });

            this.arrivalDateTime = legOnDAndDates.arrivalDateTime;

            function validateAirportRegex(airportString) {
                if (_.isUndefined(airportString) || airportString.length === 0) {
                    throw new Error ("airport or city code needed");
                }
                if (!that.AIRPORT_CODE_REGEX.test(airportString)) {
                    throw new Error ("'" + airportString + "' is not a valid IATA airport or city code");
                }
            }
        }

        SearchCriteriaLeg.prototype.addDaysToDepartureDate = function(daysOffset) {
            this.departureDateTime = this.departureDateTime.add(daysOffset, 'days');
        };

        SearchCriteriaLeg.prototype.AIRPORT_CODE_REGEX = /^[A-Z]{3}$/;

        return SearchCriteriaLeg;
    });
