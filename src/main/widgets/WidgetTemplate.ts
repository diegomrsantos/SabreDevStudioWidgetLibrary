/**
 * The template for any new widget - inheriting from BaseController.
 */
define([
          'moment'
        , 'angular'
        , 'lodash'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
        , 'widgets/BaseController'
        , 'webservices/' //TODO what webservice you will use
    ],
    function (
          moment
        , angular
        , _
        , angular_bootstrap
        , SDSWidgets
        , BaseController
        , WebServiceSrc //TODO what webservice you will use
    ) {
        'use strict';

        function WidgetTemplate( //TODO rename
            $scope
            , WebService
            , newSearchCriteriaEvent
            , searchCriteriaBroadcastingService
        ) {

            var searchService = {
                executeSearch: WebService.getXXX //TODO domain objects getter from data service
            };

            BaseController.call(this, {
                scope: $scope
                , searchService: searchService
                , newSearchCriteriaEvent: newSearchCriteriaEvent
                , searchCriteriaBroadcastingService: searchCriteriaBroadcastingService
            });

            this.processSearchResults = function (domainObjectsFromWebServiceName) { //TODO
                this.modelRename = domainObjectsFromWebServiceName;//TODO
            };

            this.clearModel = function () {
                this.modelRename = {}; //TODO
            };

            this.isAnyDataToDisplayAvailable = function () {
                //return !(_.isEmpty(this.modelRename)); //TODO
            };

            this.clearModel();

            return this;
        }
        WidgetTemplate.prototype = Object.create(BaseController.prototype);
        WidgetTemplate.prototype.constructor = WidgetTemplate;

        return angular.module('sdsWidgets')
            .controller('WidgetTemplateCtrl', [ //TODO rename
                      '$scope'
                    , 'DataService' //TODO rename
                    , 'newSearchCriteriaEvent'
                    , 'SearchCriteriaBroadcastingService'
                , WidgetTemplate])
            .directive('widgetTemplate', function ( //TODO rename
                ) {
                return {
                    scope: { // TODO params to your widget

                    },
                    replace: true,
                    templateUrl: '../widgets/view-templates/widgets/WidgetTemplate.tpl.html', //TODO rename
                    controller: 'WidgetTemplateCtrl',
                    controllerAs: 'ctrl',
                    link: function (scope, element, attrs, controller) {
                        controller.executeLifeSearchOnPredefinedCriteriaIfPresent(attrs.origin, attrs.destination, attrs.departureDate, attrs.returnDate);
                    }
                };
            });
});
