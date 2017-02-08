define([
    'angular',
    'widgets/SDSWidgets'
    ],
    function (
    angular,
    SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('itinerariesFilterPanel', function () {
                return {
                    scope: true,
                    templateUrl: '../widgets/view-templates/widgets/ItinerariesFilterPanelWidget.tpl.html',
                    //The safest way to initialize scope properties is using either controller or pre-link functions.
                    //That's beacause the post-link (or just link) function is executed after all child elements are linked.
                    //If we define scope properties in the link function and child elements use them without two way data bind
                    //it won't work. See more in https://www.toptal.com/angular-js/angular-js-demystifying-directives
                    controller: ['$scope', '$element', function ($scope, $element) {
                        $scope.id = $element.attr('id');
                        $scope.ownerId = $element.attr('owner-id');
                    }]
                };
            });
    });