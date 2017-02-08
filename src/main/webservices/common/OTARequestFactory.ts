define([],
    function () {
        'use strict';

        function OTARequestFactory(configOverrides) {
            this.configOverrides = configOverrides;
        }

        OTARequestFactory.prototype.createRequest = function(searchCriteria) {
            var requestedItinsCount = searchCriteria.optionsPerDay || 100;
            return {
                'OTA_AirLowFareSearchRQ': {
                      'OriginDestinationInformation': this.createOriginDestinationInfos(searchCriteria)
                    , 'POS': this.createPOS()
                    , 'TPA_Extensions': this.createRequestTPAExtensions(requestedItinsCount, searchCriteria)
                    , 'TravelPreferences': this.createTravelPreferences(requestedItinsCount, searchCriteria.preferredCabin, searchCriteria.maxStops)
                    , 'TravelerInfoSummary': this.createTravelerInfoSummary(searchCriteria.passengerSpecifications)
                }
            };
        };

        OTARequestFactory.prototype.createLegTPAExtensions = function(preferredAirlines) {
            return {
                "IncludeVendorPref": preferredAirlines.map(function (airline) {
                    return {
                        "Code": airline
                    };
                })
            };
        };

        OTARequestFactory.prototype.createPOS  = function() {
            return {
                "Source": [
                    {
                        "RequestorID": {
                            "CompanyName": {
                                "Code": "TN"
                            },
                            "ID": "REQ.ID",
                            "Type": "0.AAA.X"
                        },
                        "PseudoCityCode": this.configOverrides.bfmRequestPcc
                    }
                ]
            };
        };

        OTARequestFactory.prototype.createTravelPreferences = function(requestedItinsCount, preferredCabin, maxStops) {
            return {
                "CabinPref": [
                    {
                        "Cabin": preferredCabin.code
                    }
                ],
                "MaxStopsQuantity": maxStops, // when maxStops is undefined (not constraint), then it will not be serialized later into JSON
                "TPA_Extensions": {
                    "NumTrips": this.createNumTrips(requestedItinsCount)
                }
            };
        };

        OTARequestFactory.prototype.createTravelerInfoSummary = function(passengerSpecifications) {
            return {
                "AirTravelerAvail": [
                    {
                        "PassengerTypeQuantity": passengerSpecifications.map(function (specItem) {
                            return {
                                "Code": specItem.passengerTypeCode
                                , "Quantity": specItem.count
                            };
                        })
                    }
                ],
                "PriceRequestInformation": this.createPriceRequestInformation()
            };
        };

        OTARequestFactory.prototype.createRequestTPAExtensions = function(requestedItinsCount, searchCriteria) {
            return {
                "IntelliSellTransaction": {
                    "RequestType": {
                        "Name": this.getRequestType(requestedItinsCount, searchCriteria.dateFlexibilityDays)
                    }
                }
            };
        };

        OTARequestFactory.prototype.createPriceRequestInformation = function () {
            return {};
        };


        OTARequestFactory.prototype.dateTimeFormat = 'YYYY-MM-DDTHH:mm:ss'; // //"2015-04-11T00:00:00",


        return OTARequestFactory;
    });
