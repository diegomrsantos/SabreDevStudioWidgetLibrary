define([
          'lodash'
        , 'webservices/common/OTARequestFactory'
    ],
    function (
          _
        , OTARequestFactory
    ) {
        'use strict';

        function BargainFinderMaxRequestFactory() {
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

        return BargainFinderMaxRequestFactory;
    });
