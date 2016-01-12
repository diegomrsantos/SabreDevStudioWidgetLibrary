define([
          'util/LodashExtensions'
        , 'moment'
        , 'webservices/common/validators/TravelInsightEngineSearchCriteriaValidator'
    ],
    function (
          __
        , moment
        , TravelInsightEngineSearchCriteriaValidator
    ) {
        'use strict';

        function InstaflightSearchCriteriaValidator() {
            this.travelInsightEngineSearchCriteriaValidator = new TravelInsightEngineSearchCriteriaValidator();
        }

        InstaflightSearchCriteriaValidator.prototype.validate = function (searchCriteria) {
            var errors = [];

            var tieValidatorErrors = this.travelInsightEngineSearchCriteriaValidator.validate(searchCriteria);
            __.pushAll(errors, tieValidatorErrors);

            if (searchCriteria.isAlternateDatesRequest()) {
                errors.push('Instaflight does not support alt dates requests (date flexibility)');
            }

            return errors; 
        };

        return InstaflightSearchCriteriaValidator;
    });
