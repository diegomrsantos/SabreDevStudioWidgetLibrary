import BFM = require('./bfm.drv');
import angular = require('angular');

angular.module('sdsWidgets.basicSearch', [])
    .directive('bfmSearchWidget', BFM.Factory());