define([
          'angular'
        , 'widgets/SDSWidgets'
        , 'widgets/version'
    ],
    function (
          angular
        , SDSWidgets
        , version
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .directive('about', function (
                ) {
                return {
                    replace: true,
                    templateUrl: '../widgets/view-templates/widgets/AboutWidgetTemplate.tpl.html',
                    link: function (scope) {
                        scope.version = version.version();
                    }
                };
            });
});
