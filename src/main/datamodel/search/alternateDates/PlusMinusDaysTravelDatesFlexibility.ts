define([],
    function () {
        'use strict';

        function PlusMinusDaysTravelDatesFlexibility(plusMinusDaysConfig) {
            this.departureMinusDays = plusMinusDaysConfig.departureMinusDays;
            this.departurePlusDays = plusMinusDaysConfig.departurePlusDays;
            this.returnMinusDays = plusMinusDaysConfig.returnMinusDays;
            this.returnPlusDays = plusMinusDaysConfig.returnPlusDays;
        }

        PlusMinusDaysTravelDatesFlexibility.prototype.buildConstantDaysFlexibility = function (plusMinusDays) {
            return new PlusMinusDaysTravelDatesFlexibility({
                  departureMinusDays: plusMinusDays
                , departurePlusDays: plusMinusDays
                , returnMinusDays: plusMinusDays
                , returnPlusDays: plusMinusDays
            });
        };

        return PlusMinusDaysTravelDatesFlexibility;
    });
