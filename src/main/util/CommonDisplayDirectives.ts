define([
          'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          moment
        , angular
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('airlineLogo', function () {
                return {
                    templateUrl: '../widgets/view-templates/partials/AirlineLogo.tpl.html',
                    scope: true,
                    link: function (scope, element, attrs) {
                        scope.airlineCode = attrs.airlineCode;
                    }
                };
            });
});
