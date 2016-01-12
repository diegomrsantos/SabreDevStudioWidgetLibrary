define([
          'lodash'
        , 'webservices/common/parsers/AbstractOTAResponseParser'
    ],
    function (
          _
        , AbstractOTAResponseParser
    ) {
        'use strict';

        function InstaflightResponseParser() {
            AbstractOTAResponseParser.apply(this, arguments);
        }

        InstaflightResponseParser.prototype = Object.create(AbstractOTAResponseParser.prototype);
        InstaflightResponseParser.prototype.constructor = InstaflightResponseParser;

        InstaflightResponseParser.prototype.getPricedItinerariesArray = function(response) {
            return response.PricedItineraries;
        };

        InstaflightResponseParser.prototype.itinerariesFound = function (response) {
            return _.has(response, 'PricedItineraries');
        };

        InstaflightResponseParser.prototype.getItineraryPricingInfoResponsePart = function(itin) {
            return itin.AirItineraryPricingInfo;
        };

        InstaflightResponseParser.prototype.parseEquipment = function(segment) {
            return segment.Equipment.AirEquipType;
        };

        InstaflightResponseParser.prototype.parsePricingSource = function() {
            return 'Instaflights';
        };

        return InstaflightResponseParser;
    });
