define([
        'angular'
    , 'util/validator'
    , 'widgets/SDSWidgets'

    ],
    function (
        agular
    , SDSValidator
    , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('diversitySwapper', [function () {

                return {
                    require: 'ngModel',
                    scope : {
                        internalFormName: '@',
                        enabled: '=',
                        showOptions: '=',
                        ngModel: '='
                    },
                    templateUrl: '../widgets/view-templates/partials/DiversitySwapper.tpl.html',
                    link: function (scope) {

                        scope.lowFareBucketOptionsPattern = (function() {
                            var regexp = SDSValidator.NON_ZERO_POSITIVE_INTEGER_REGEX;
                            return {
                                test: function(value) {
                                    if( scope.ngModel.lowFareBucketMode.toString() !== scope.ngModel.LowFareBucketModeEnum.OPTION.toString() ) {
                                        return true;
                                    }
                                    return regexp.test(value);
                                }
                            };
                        })();

                        scope.fareCutOffPattern = (function() {
                            var regexp = SDSValidator.PERCENTAGE_VALUE_REGEX;
                            return {
                                test: function(value) {
                                    if( scope.ngModel.lowFareBucketMode.toString() !== scope.ngModel.LowFareBucketModeEnum.FARE_CUT_OFF.toString() ) {
                                        return true;
                                    }
                                    return regexp.test(value);
                                }
                            };
                        })();
                    }
                }
            }])
    });