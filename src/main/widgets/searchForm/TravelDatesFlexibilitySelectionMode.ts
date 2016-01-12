define([
        'lodash'
        , 'util/LodashExtensions'
    ],
    function (
        _
        , __
    ) {
        'use strict';

        function TravelDatesFlexibilitySelectionMode(selectableModes) {
            var that = this;
            validateModes(selectableModes);

            this.selectableModes = selectableModes;
            this.activeMode = undefined;

            function validateModes(modes) {
                modes.forEach(function (mode) {
                   if (!_.contains(that.allSelectableModes, mode)) {
                       throw new Error('The provided travel dates flexibility mode "' + mode + '" is not recognized.');
                   }
                });
            }
        }

        TravelDatesFlexibilitySelectionMode.prototype.isAnyModeActive = function () {
            return __.isDefined(this.activeMode);
        };

        TravelDatesFlexibilitySelectionMode.prototype.isSelectableByEarliestDepartureLatestReturn = function () {
           return _.contains(this.selectableModes, 'earliestDepartureLatestReturn.losDays')
               || _.contains(this.selectableModes, 'earliestDepartureLatestReturn.daysOfWeekAtDestination');
        };

        TravelDatesFlexibilitySelectionMode.prototype.isSelectableByAnyOf = function (modes) {
            var that = this;
            return modes
                .split(',')
                .map(_.trim)
                .some(function (mode) {
                    return _.contains(that.selectableModes, mode);
                })
        };

        TravelDatesFlexibilitySelectionMode.prototype.isSelectableBy = function (mode) {
            return _.contains(this.selectableModes, mode);
        };

        TravelDatesFlexibilitySelectionMode.prototype.isEarliestDepartureLatestReturnActive = function () {
            return this.activeMode === 'earliestDepartureLatestReturn.losDays' || this.activeMode === 'earliestDepartureLatestReturn.daysOfWeekAtDestination';
        };

        TravelDatesFlexibilitySelectionMode.prototype.allSelectableModes = [
              'plusMinusConstantDaysFlexibility'
            , 'plusMinusVariableDaysFlexibility'
            , 'earliestDepartureLatestReturn.losDays'
            , 'earliestDepartureLatestReturn.daysOfWeekAtDestination'
        ];


        return TravelDatesFlexibilitySelectionMode;
    });
