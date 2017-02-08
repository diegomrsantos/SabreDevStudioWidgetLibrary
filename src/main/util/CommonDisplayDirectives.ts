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
                    scope: {

                    // Previously it was just getting directive attribute value and exporting it to directive view as scope param.
                    // But as views using this directive may get other data (their scope may be updated, which results in presenting different itineraries with different airlines),
                    // then we need to watch this attribute here as well. It might have negative performance impact, test it.

                    airlineCode: '@'
                    }
                };
            });
});
