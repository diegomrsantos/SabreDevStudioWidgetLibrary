define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'util/LodashExtensions'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
        moment
        , angular
        , _
        , __
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('errorDisplay', [
                      'errorEvent'
                    , 'resetErrorsEvent'
                    , 'newSearchCriteriaEvent'
                    , 'newInspirationalSearchCriteriaEvent'
                , function (
                        errorEvent
                      , resetErrorsEvent
                      , newSearchCriteriaEvent
                      , newInspirationalSearchCriteriaEvent
                ) {
                return {
                    replace: true,
                    templateUrl: '../widgets/view-templates/widgets/ErrorDisplayWidget.tpl.html',
                    link: function (scope) {

                        function resetErrorModel() {
                            scope.errors = [];
                            scope.lastSearchCriteriaAirports = {};
                        }

                        resetErrorModel();

                        scope.$on(errorEvent, function (event, errorsArray, searchCriteria) {
                            __.pushAll(scope.errors, errorsArray);
                            if (searchCriteria) {
                                scope.lastSearchCriteriaAirports.departureAirport = (_.isFunction(searchCriteria.getFirstLeg))? searchCriteria.getFirstLeg().origin: searchCriteria.origin;
                                scope.lastSearchCriteriaAirports.arrivalAirport = (_.isFunction(searchCriteria.getFirstLeg))? searchCriteria.getFirstLeg().destination: searchCriteria.destination;
                            }
                        });

                        scope.$on(newSearchCriteriaEvent, function () {
                            resetErrorModel();
                        });
                        scope.$on(newInspirationalSearchCriteriaEvent, function () {
                            resetErrorModel();
                        });
                        scope.$on(resetErrorsEvent, resetErrorModel);

                        scope.anyErrorPresent = function () {
                            return scope.errors && scope.errors.length > 0;
                        };
                    }
                }
            }]);
    });
