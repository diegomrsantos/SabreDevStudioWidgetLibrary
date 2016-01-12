define(['lodash'],
    function (_) {
        'use strict';

        function AirportNameBestSuggestionComparator(stringCurrentlySearchedFor) {

            this.stringCurrentlySearchedFor = stringCurrentlySearchedFor.toUpperCase();

            var that = this;

            return function(a, b) {
                var orderByValueFullMatch = that.getOrderByAirportCodeFullMatch(a, b);
                if (orderByValueFullMatch !== 0) {
                    return orderByValueFullMatch;
                }

                var orderByLabelAtStringStart = that.getOrderByLabelAtStringStart(a, b);
                if (orderByLabelAtStringStart !== 0) {
                    return orderByLabelAtStringStart;
                }

                return 0;
            };
        }

        AirportNameBestSuggestionComparator.prototype.getOrderByAirportCodeFullMatch = function(a, b) {
            if (a.airportCode === this.stringCurrentlySearchedFor) {
                return 1;
            }
            if (b.airportCode === this.stringCurrentlySearchedFor) {
                return -1;
            }
            return 0;
        }

        AirportNameBestSuggestionComparator.prototype.getOrderByLabelAtStringStart = function (a, b) {
            if (_.startsWith(a.fullName.toUpperCase(), this.stringCurrentlySearchedFor)) {
                return 1;
            }
            if (_.startsWith(b.fullName.toUpperCase(), this.stringCurrentlySearchedFor)) {
                return -1;
            }
        }

        return AirportNameBestSuggestionComparator;
});
