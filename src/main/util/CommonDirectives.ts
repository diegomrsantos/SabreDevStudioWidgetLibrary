define([
        'angular'
    ],
    function (
        angular
    ) {
        'use strict';

        return angular.module('commonDirectives', [])
            .directive('stringToNumber', function() {
                return {
                    require: 'ngModel',
                    link: function(scope, element, attrs, ngModel) {
                        ngModel.$parsers.push(function(value) {
                            return '' + value;
                        });
                        ngModel.$formatters.push(function(value) {
                            return parseFloat(value);
                        });
                    }
                };
            })
            .directive('hideOnClick', function () {
                return {
                    scope: 'A',
                    link: function (scope, el, attrs) {
                        angular.element(el).on('click', function () {
                            angular.element(el).addClass('ng-hide');
                        });
                    }
                }
            })

    });
