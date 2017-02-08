define([
          'lodash'
        , 'util/LodashExtensions'
        , 'widgets/WidgetGlobalCallbacks'
    ],
    function (
          _
        , __
        , WidgetGlobalCallbacks
    ) {
        'use strict';

        return function ErrorDisplayWidget(
                        errorEvent
                      , resetErrorsEvent
                      , newSearchCriteriaEvent
                      , newInspirationalSearchCriteriaEvent
                ) {
                return {
                    replace: true,
                    templateUrl: '../widgets/view-templates/widgets/ErrorDisplayWidget.tpl.html',
                    link: function (scope, element) {

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
                        WidgetGlobalCallbacks.linkComplete(scope, element);
                    }
                }
            };
    });
