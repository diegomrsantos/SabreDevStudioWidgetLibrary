define([
        'lodash'
        , 'moment'
    ], function (
        _
        , moment
    ) {
    "use strict";

    function DiversityModelOptions() {

        this.lowFareBucketMode = this.LowFareBucketModeEnum.OPTION;
        this.lowFareBucket = undefined;
        this.fareCutOff = undefined;
        this.priceWeight = this.PRICE_WEIGHT_DEFAULT_VALUE;
        this.travelTimeWeight = undefined;

        this.carrier = {
            weight: undefined,
            onlineIndicator: false,
            default: {
                options: undefined
            },
            override: []
        };

        this.operatingDuplicate = {
            weight: undefined,
            preferredCarriers: {
                selected: []
            }
        };

        this.inboundOutboundPairing = {
            weight: undefined,
            duplicates: this.INBOUND_OUTBOUND_PAIRING_DUPLICATES_DEFAULT_VALUE
        };

        this.timeOfDay = {
            weight: undefined,
            distributions: []
        };

        this.numberOfStopsWeight = undefined;
    }

    DiversityModelOptions.prototype.PRICE_WEIGHT_DEFAULT_VALUE = 10;
    DiversityModelOptions.prototype.INBOUND_OUTBOUND_PAIRING_DUPLICATES_DEFAULT_VALUE = 1;
    DiversityModelOptions.prototype.TIME_RANGE_BEGIN = "6:00";
    DiversityModelOptions.prototype.TIME_RANGE_END = "12:00";
    DiversityModelOptions.prototype.TIME_RANGE_FORMAT = "HH:mm";

    DiversityModelOptions.prototype.addCarrierOverriding = function () {
        this.carrier.override.push({
            code: {},
            options: undefined
        });
    };

    DiversityModelOptions.prototype.removeCarrierOverriding = function () {
        this.carrier.override.pop();
    };

    DiversityModelOptions.prototype.getDistributions = function () {
        return this.timeOfDay.distributions;
    }

    DiversityModelOptions.prototype.addDistribution = function () {
        this.getDistributions().push({
            direction: undefined,
            endpoint: undefined,
            ranges: [{
                begin: moment(this.TIME_RANGE_BEGIN, this.TIME_RANGE_FORMAT).toDate(),
                end: moment(this.TIME_RANGE_END, this.TIME_RANGE_FORMAT).toDate(),
                options: undefined
            }]
        });
    };

    DiversityModelOptions.prototype.removeDistribution = function () {
        this.getDistributions().pop();
    };

    DiversityModelOptions.prototype.addRangeToDistribution = function (distributionIndex) {
        this.getDistributions()[distributionIndex].ranges.push({
            begin: moment(this.TIME_RANGE_BEGIN, this.TIME_RANGE_FORMAT).toDate(),
            end: moment(this.TIME_RANGE_END, this.TIME_RANGE_FORMAT).toDate(),
            option: undefined
        });
    };

    DiversityModelOptions.prototype.removeLastRangeFromDistribution = function (distributionIndex) {
        this.getDistributions()[distributionIndex].ranges.pop();
    };

    DiversityModelOptions.prototype.LowFareBucketModeEnum = Object.freeze({
        OPTION: 0,
        FARE_CUT_OFF: 1
    });

    DiversityModelOptions.prototype.AvailableDirectionsEnum = Object.freeze({

        INBOUND: {id: 1, description: 'Inbound'},
        OUTBOUND: {id: 2, description: 'Outbound'},
        values: function () {
            return [this.INBOUND, this.OUTBOUND];
        }
    });

    DiversityModelOptions.prototype.AvailableEndpointsEnum = Object.freeze({

        DEPARTURE: {id: 1, description: 'Departure'},
        ARRIVAL: {id: 2, description: 'Arrival'},
        values: function () {
            return [this.DEPARTURE, this.ARRIVAL];
        }
    });

    return DiversityModelOptions;
});