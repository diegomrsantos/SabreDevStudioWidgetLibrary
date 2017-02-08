define([
        'angular'
        , 'widgets/SDSWidgets'
    ],
    function (
        agular
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('spinnerContainer', ['usSpinnerService', function (usSpinnerService) {

                return {
                    transclude: true,
                    templateUrl: '../widgets/view-templates/widgets/SpinnerContainer.tpl.html',
                    scope: true,
                    //The safest way to initialize scope properties is using either controller or pre-link functions.
                    //That's beacause the post-link (or just link) function is executed after all child elements are linked.
                    //If we define scope properties in the link function and child elements use them without two way data bind
                    //it won't work. See more in https://www.toptal.com/angular-js/angular-js-demystifying-directives
                    controller: ['$scope', '$element', function ($scope, $element) {
                        $scope.spinnerId = $element.attr('spinner-id');
                        $scope.spinnerOptions = $element.attr('spinner-options');

                        $scope.startSpin = function() {
                            if (!$scope.spinneractive) {
                                $scope.spinneractive = true;
                                usSpinnerService.spin($scope.spinnerId);

                            }
                        };
                        $scope.stopSpin = function() {
                            if ($scope.spinneractive) {
                                usSpinnerService.stop($scope.spinnerId);
                                $scope.spinneractive = false;
                            }
                        };
                        $scope.spinneractive = false;
                    }]
                }
            }])
    });