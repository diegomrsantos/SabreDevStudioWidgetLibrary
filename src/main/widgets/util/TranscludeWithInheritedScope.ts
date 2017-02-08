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
        //This directive transcludes elements and creates a new child scope which inherits from the directive's scope which
        //is defined with transclude: true and uses this one. This behavior is different from the angular's ng-transclude directive
        //which creates a new scope which inherits from the directive's parent scope.
            .directive('transcludeWithInheritedScope', function() {
                return {
                    link: function(scope, element, iAttrs, controller, transcludeFn) {
                        transcludeFn(scope.$new(), function(clone) {
                            element.append(clone);
                        });
                    }
                };
            })
    });