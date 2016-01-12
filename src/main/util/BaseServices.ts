define([
          'moment'
        , 'angular'
        , 'datamodel/ShoppingData'
    ],
    function (
          moment
        , angular
        , ShoppingData
    ) {
        'use strict';

        return angular.module('baseServices', [])
            .service('DateService', function () {
               return {
                   now: function () {
                       return moment();
                   }
               };
            })
            .service('ShoppingOptionsCacheService', function () {
                return new ShoppingData();
            })
            .service('WidgetIdGeneratorService', function () {
                var seqNumber = 0;
                return {
                    next: function () {
                        return seqNumber++;
                    }
                };
            });
    });
