define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'webservices/common/OTARequestFactory'
    ],
    function (
          _
        , __
        , moment
        , OTARequestFactory
    ) {
        'use strict';

        function BargainFinderMaxRequestFactory(configOverrides) {
            OTARequestFactory.apply(this, [configOverrides]);
        }

        /**
         * Factory creating Bargain Finder Max (BFM) request, to be send to BFM service.
         * It accepts object of SearchCriteria class and produces object passed to REST BFM POST web service as request body.
         * @type {OTARequestFactory}
         */
        BargainFinderMaxRequestFactory.prototype = Object.create(OTARequestFactory.prototype);
        BargainFinderMaxRequestFactory.prototype.constructor = BargainFinderMaxRequestFactory;

        BargainFinderMaxRequestFactory.prototype.requestBrandedFares = false;

        BargainFinderMaxRequestFactory.prototype.createOriginDestinationInfos = function(searchCriteria) {
            var that = this;
            return searchCriteria.legs.map(function (leg, legIdx) {
                return {
                    "DepartureDateTime": leg.departureDateTime.format(that.dateTimeFormat),
                    "DestinationLocation": {
                        "LocationCode": leg.destination
                    },
                    "OriginLocation": {
                        "LocationCode": leg.origin
                    },
                    "RPH": "" + (legIdx + 1),
                    "TPA_Extensions": that.createLegTPAExtensions(searchCriteria.preferredAirlines, searchCriteria.dateFlexibilityDays)
                };
            });
        };

        BargainFinderMaxRequestFactory.prototype.createLegTPAExtensions = function(preferredAirlines, dateFlexibilityDays) {
            var tpaExtensions = {
                "IncludeVendorPref": preferredAirlines.map(function (airline) {
                    return {
                        "Code": airline
                    };
                })
            };
            dateFlexibilityDays = parseInt(dateFlexibilityDays);
            if (dateFlexibilityDays > 0) {
                _.extend(tpaExtensions, {
                    "DateFlexibility": {
                        "NbrOfDays": dateFlexibilityDays
                    }
                });
            }
            return tpaExtensions;
        };

        BargainFinderMaxRequestFactory.prototype.getRequestType = function (requestedItinsCount, dateFlexibilityDays) {
            if (dateFlexibilityDays > 0) {
                return "AD1";
            }
            if(requestedItinsCount <= 50) {
                return "50ITINS";
            }
            if (requestedItinsCount <= 100) {
                return  "100ITINS";
            }
            return "200ITINS";
        };

        BargainFinderMaxRequestFactory.prototype.createNumTrips = function (requestedItinsCount) {
            return {
                "Number": requestedItinsCount
            };
        };

        BargainFinderMaxRequestFactory.prototype.createPriceRequestInformation = function () {
            if (this.requestBrandedFares) {
                return {
                    "TPA_Extensions": {
                        "BrandedFareIndicators": {
                            "ReturnCheapestUnbrandedFare": { // TN brands may return also cheapest unbranded fare, it will work as single branded fare (SingleBrandedFare). Also this indicator may be used for International Branded Fares
                                Ind: true
                            },
                            "SingleBrandedFare": true, // return main fare (as plain BFM works) + decorate this fare with brand information (with the first brand that is applicable to that fare).
                            "MultipleBrandedFares": true // return main brand (as main fare) and additional brands (as additional fares).
                        }
                    }
                };
            } else {
                return OTARequestFactory.prototype.createPriceRequestInformation.call(this);
            }
        };

        BargainFinderMaxRequestFactory.prototype.createRequestTPAExtensions = function(requestedItinsCount, searchCriteria) {
            var tpaExtensions = this.createIntelliSellTransaction(requestedItinsCount, searchCriteria.dateFlexibilityDays);
            if(searchCriteria.diversityModelOptions){
                _.extend(tpaExtensions, this.createDiversityControl(searchCriteria.diversityModelOptions));
            }
            return tpaExtensions;
        };

        BargainFinderMaxRequestFactory.prototype.createIntelliSellTransaction = function(requestedItinsCount, dateFlexibilityDays) {
            return {
                "IntelliSellTransaction": {
                    "RequestType": {
                        "Name": this.getRequestType(requestedItinsCount, dateFlexibilityDays)
                    }
                }
            };
        };

        /* jshint maxcomplexity:7 */
        BargainFinderMaxRequestFactory.prototype.createDiversityControl = function(diversityModelOptions) {
            var diversityControl:any = {"DiversityControl": {}};
            _.extend(diversityControl.DiversityControl, this.createLowFareBucket(diversityModelOptions));
            _.extend(diversityControl.DiversityControl, this.createPriceWeight(diversityModelOptions));
            if(_.isNumber(diversityModelOptions.travelTimeWeight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createTravelTimeWeight(diversityModelOptions.travelTimeWeight));
            }
            if(__.isNumber(diversityModelOptions.carrier.weight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createCarrierOptions(diversityModelOptions));
            }
            if(__.isNumber(diversityModelOptions.operatingDuplicate.weight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createOperatingDuplicateOptions(diversityModelOptions));
            }
            if(__.isNumber(diversityModelOptions.inboundOutboundPairing.weight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createinboundOutboundPairingOptions(diversityModelOptions));
            }
            if(__.isNumber(diversityModelOptions.timeOfDay.weight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createTimeOfDayOptions(diversityModelOptions));
            }
            if(__.isNumber(diversityModelOptions.numberOfStopsWeight)){
                _.extend(diversityControl.DiversityControl.Dimensions, this.createNonStopWeight(diversityModelOptions.numberOfStopsWeight));
            }
            return diversityControl;
        };

        BargainFinderMaxRequestFactory.prototype.createLowFareBucket = function(diversityModelOptions) {

            var lowFareBucket;
            /* tslint:disable */
            /*jshint ignore:start*/
            if(diversityModelOptions.lowFareBucketMode == diversityModelOptions.LowFareBucketModeEnum.OPTION){
                lowFareBucket = {
                    "LowFareBucket" : {
                        "Options": diversityModelOptions.lowFareBucket.toString()
                    }
                };
            }
            else if(diversityModelOptions.lowFareBucketMode == diversityModelOptions.LowFareBucketModeEnum.FARE_CUT_OFF){
                lowFareBucket = {
                    "LowFareBucket" : {
                        "FareCutOff": diversityModelOptions.fareCutOff + "%"
                    }
                };
            }
            /*jshint ignore:end*/
            /* tslint:enable */
            return lowFareBucket;
        };

        BargainFinderMaxRequestFactory.prototype.createPriceWeight = function(diversityModelOptions) {
            return {
                "Dimensions": {
                    "PriceWeight": _.isNumber(diversityModelOptions.priceWeight) ? diversityModelOptions.priceWeight : diversityModelOptions.PRICE_WEIGHT_DEFAULT_VALUE
                }
            };
        };

        BargainFinderMaxRequestFactory.prototype.createTravelTimeWeight = function(travelTimeWeight) {
            return {
                "TravelTime": {
                    "Weight": travelTimeWeight
                }
            };
        };

        BargainFinderMaxRequestFactory.prototype.createCarrierOptions = function(diversityModelOptions) {
            var carrier = {
                "Carrier": {
                    "Weight": diversityModelOptions.carrier.weight,
                    "OnlineIndicator": diversityModelOptions.carrier.onlineIndicator
                }
            };
            if(__.isDefined(diversityModelOptions.carrier.default.options)){
                _.extend(carrier.Carrier, {
                    "Default": {
                        "Options": diversityModelOptions.carrier.default.options.toString()
                    }
                });
            }
            if(diversityModelOptions.carrier.override.length > 0){
                var override = {
                    "Override": []
                };
                diversityModelOptions.carrier.override.forEach(function (currentValue) {
                    override.Override.push({
                        "Code": currentValue.code,
                        "Options": currentValue.options.toString()
                    });
                });
                _.extend(carrier.Carrier, override);
            }
            return carrier;
        };

        BargainFinderMaxRequestFactory.prototype.createOperatingDuplicateOptions = function(diversityModelOptions) {
            var operatingDuplicate = {
                "OperatingDuplicate": {
                    "Weight": diversityModelOptions.operatingDuplicate.weight
                }
            };
            if(__.isDefined(diversityModelOptions.operatingDuplicate.preferredCarriers.selected.length > 0)){
                var preferredCarriers = {
                    "PreferredCarrier": []
                };
                diversityModelOptions.operatingDuplicate.preferredCarriers.selected.forEach(function (currentValue) {
                    preferredCarriers.PreferredCarrier.push({
                        "Code": currentValue
                    });
                });
                _.extend(operatingDuplicate.OperatingDuplicate, preferredCarriers);
            }
            return operatingDuplicate;
        };

        BargainFinderMaxRequestFactory.prototype.createinboundOutboundPairingOptions = function(diversityModelOptions) {
            return {
                "InboundOutboundPairing": {
                    "Weight": diversityModelOptions.inboundOutboundPairing.weight,
                    "Duplicates": _.isNumber(diversityModelOptions.inboundOutboundPairing.duplicates)
                        ? diversityModelOptions.inboundOutboundPairing.duplicates : diversityModelOptions.INBOUND_OUTBOUND_PAIRING_DUPLICATES_DEFAULT_VALUE
                }
            };
        };

        BargainFinderMaxRequestFactory.prototype.createTimeOfDayOptions = function(diversityModelOptions) {
            var timeOfDay:any = {
                "TimeOfDay": {
                    "Weight": diversityModelOptions.timeOfDay.weight,
                }
            };
            if(diversityModelOptions.getDistributions().length > 0){
                timeOfDay.TimeOfDay.Distribution = createDistributionsOutput(diversityModelOptions.getDistributions());
            }
            return timeOfDay;
        };

        function createDistributionsOutput(distributions){

            return distributions.map(distribution => {
                var distributionObj: any = {
                    "Direction": distribution.direction.description,
                    "Endpoint": distribution.endpoint.description
                };
                if(distribution.ranges.length > 0) {
                    distributionObj.Range = createRangesOutput(distribution.ranges);
                }
                return distributionObj;
            });
        }

        function createRangesOutput(ranges){
            return ranges.map(range => {
                return {
                    "Begin": moment(range.begin).format("HH:mm"),
                    "End": moment(range.end).format("HH:mm"),
                    "Options": range.options + "%"
                };
            });
        }

        BargainFinderMaxRequestFactory.prototype.createNonStopWeight = function(nonStopWeight) {

            return {
                "StopsNumber": {
                    "Weight": nonStopWeight
                }
            };
        };

        return BargainFinderMaxRequestFactory;
    });
