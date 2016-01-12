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

        function AdvancedCalendarSearchCriteriaValidator() {
            this.travelInsightEngineSearchCriteriaValidator = new TravelInsightEngineSearchCriteriaValidator();
        }

        AdvancedCalendarSearchCriteriaValidator.prototype.validate = function (searchCriteria) {
            var errors = [];

            var tieValidatorErrors = this.travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
            _.pushAll(errors, tieValidatorErrors);

            return errors;
        };

        return AdvancedCalendarSearchCriteriaValidator;
    });
