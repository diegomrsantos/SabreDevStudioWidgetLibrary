define([
        'util/LodashExtensions'
        , 'moment'
        , 'webservices/common/validators/TravelInsightEngineSearchCriteriaValidator'
    ],
    function (
        _
        , moment
        , TravelInsightEngineSearchCriteriaValidator
    ) {
        'use strict';

        function LeadPriceCalendarSearchCriteriaValidator() {
            this.travelInsightEngineSearchCriteriaValidator = new TravelInsightEngineSearchCriteriaValidator();
        }

        LeadPriceCalendarSearchCriteriaValidator.prototype.validate = function (searchCriteria) {
            var errors = [];

            var tieValidatorErrors = this.travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
            _.pushAll(errors, tieValidatorErrors);

            if (searchCriteria.getPreferredAirlines().length > 0) {
                errors.push('Lead Price calendar does not support airline preference');
            }

            return errors;
        };

        return LeadPriceCalendarSearchCriteriaValidator;
    });
