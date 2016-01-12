define([
          'util/LodashExtensions'
        , 'webservices/common/validators/BasicSearchCriteriaValidator'
    ],
    function (
          __
        , BasicSearchCriteriaValidator
    ) {
        'use strict';

        function TravelInsightEngineSearchCriteriaValidator() {
            this.basicValidator = new BasicSearchCriteriaValidator();

        }

        TravelInsightEngineSearchCriteriaValidator.prototype.validateLengthOfStay = function(lengthOfStay) {
            var errors = [];
            if (lengthOfStay < 0) {
                errors.push("Length of stay must be non-negative");
            }
            if (lengthOfStay > this.MAX_LENGTH_OF_STAY_DAYS) {
                errors.push("Length of stay over " + this.MAX_LENGTH_OF_STAY_DAYS + " not supported. Please select other travel dates");
            }
            return errors;
        };

        TravelInsightEngineSearchCriteriaValidator.prototype.validate = function (searchCriteria) {
            var errors = [];

            if (!searchCriteria.isRoundTripTravel()) {
                errors.push("Travel Insight Engine services support only round trip travel");
                return errors;
            }
            var roundTripTravelValidationErrors = this.basicValidator.validateRoundTripTravelSpecification(searchCriteria);
            __.pushAll(errors, roundTripTravelValidationErrors);

            __.pushAll(errors, this.validateLengthOfStay(searchCriteria.getLengthOfStay()));
            __.pushAll(errors, this.validateLengthOfStay(searchCriteria.getMinLengthOfStay()));
            __.pushAll(errors, this.validateLengthOfStay(searchCriteria.getMaxLengthOfStay()));

            if (!searchCriteria.isEconomyCabinRequested()) {
                errors.push('Travel Insight Engine services support only Economy cabin requests, or requests without cabin preference - then economy fares will be returned)');
            }

            var paxCountAndTypeErrors = this.validatePaxCountAndType(searchCriteria);
            __.pushAll(errors, paxCountAndTypeErrors);

            return errors;
        };

        TravelInsightEngineSearchCriteriaValidator.prototype.validatePaxCountAndType = function (searchCriteria) {
            var errors = [];
            if (searchCriteria.passengerSpecifications.length > 1) {
                errors.push('Travel Insight Engine services do not support multiple passenger type definitions. Use only 1 passenger type definition (for example 1 ADT).');
            }
            if ((searchCriteria.passengerSpecifications[0].count) > 1 || searchCriteria.passengerSpecifications[0].passengerTypeCode !== 'ADT') {
                errors.push('Travel Insight Engine services support only 1 passenger number and only of type ADT. The only supported passenger type is 1 ADT.');
            }
            return errors;
        };


        TravelInsightEngineSearchCriteriaValidator.prototype.MAX_LENGTH_OF_STAY_DAYS = 16;

        return TravelInsightEngineSearchCriteriaValidator;
    });
