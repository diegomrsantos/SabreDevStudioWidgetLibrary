define([
          'angular'
        , 'moment'
        , 'widgets/SDSWidgets'
        , 'webservices/fareNabber/FareNabberSubscriptionService'
        , 'widgets/searchForm/InputTimeOfDayRange'
    ],
    function (
          angular
        , moment
        , SDSWidgets
        , FareNabberSubscriptionServiceSrc
        , InputTimeOfDayRange
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            .controller('FareNabberFormModalInstanceCtrl', ['$scope', '$modalInstance', function ($scope, $modalInstance) {

                $scope.defaultOptions = {
                      earliestTravelStart: new Date()
                    , subscriptionExpiry: moment().add(1, 'years').toDate()
                    , allowInterline: true
                };
                $scope.subscriptionExpiryDate = $scope.defaultOptions.subscriptionExpiry;

                $scope.outboundTravelTimeRange = {
                    departure: undefined,
                    arrival: undefined
                };
                $scope.inboundTravelTimeRange = {
                    departure: undefined,
                    arrival: undefined
                };

                $scope.daysOfTravelPreference = {
                    outbound: undefined,
                    inbound: undefined
                };

                $scope.preferredAirlines = {
                    selected: []
                };

                $scope.subscribe = function () {

                    var allProps = [
                          'subscriberEmail'
                        , 'origin'
                        , 'destination'
                        , 'departureDate'
                        , 'returnDate'
                        , 'passengerType'
                        , 'passengerCount'
                        , 'directFlightsOnly'
                        , 'allowInterline'
                        , 'maximumAcceptablePrice'
                        , 'maximumAcceptablePriceCurrency'
                        , 'subscriptionExpiryDate'
                        , 'outboundTravelTimeRange'
                        , 'inboundTravelTimeRange'
                        , 'daysOfTravelPreference'
                        , 'preferredAirlines'
                    ];
                    var fareNabberSubscriptionRequest = allProps.reduce(function (acc, curr) {
                        if ($scope[curr]) {
                            acc[curr] = $scope[curr];
                        }
                        return acc;
                    }, {});

                    $modalInstance.close(fareNabberSubscriptionRequest);
                };

                $scope.cancel = function () {
                    $modalInstance.dismiss('cancelled');
                };

            }])
            .directive('fareNabber', [
                      '$modal'
                    , 'FareNabberSubscriptionService'
                    , 'resetErrorsEvent'
                    , '$rootScope'
                , function (
                      $modal
                    , FareNabberSubscriptionService
                    , resetErrorsEvent
                    , $rootScope
                ) {
                return {
                    restrict: 'A',
                    scope: {
                          origin: '@'
                        , destination: '@'
                        , predefinedDepartureDate: '@departureDate'
                        , predefinedReturnDate: '@returnDate'
                        , passengerType: '@'
                        , passengerCount: '@'
                        , maximumAcceptablePrice: '@'
                        , maximumAcceptablePriceCurrency: '@'
                    },
                    templateUrl: '../widgets/view-templates/widgets/FareNabberWidget.tpl.html',
                    transclude: true,
                    link: function (scope, element) {

                        parseDirectiveAttributes();

                        element.on('click', function () {
                            runSubscriptionWorkflow();
                            $rootScope.$broadcast(resetErrorsEvent); // reset previous errors (from previous tries).
                        });

                        function parseDirectiveAttributes() {
                            const directiveAttributesDateFormat = moment.ISO_8601;
                            scope.departureDate = moment(scope.predefinedDepartureDate, directiveAttributesDateFormat).toDate();
                            scope.returnDate = moment(scope.predefinedReturnDate, directiveAttributesDateFormat).toDate();
                        }

                        function runSubscriptionWorkflow() {
                            showSubscriptionForm()
                                .then(createSubscription)
                                .then(showSuccessfulSubscriptionMessage)
                        }

                        function showSubscriptionForm () {
                            var modalInstance = $modal.open({
                                animation: true
                                , templateUrl: 'FareNabberSubscriptionFormModal.html.tpl'
                                , controller: 'FareNabberFormModalInstanceCtrl'
                                , size: 'lg'
                                , scope: scope
                            });

                            return modalInstance.result;
                        }

                        function createSubscription(fareNabberFormData: any) {
                            return FareNabberSubscriptionService.subscribe(fareNabberFormData);
                        }

                        function showSuccessfulSubscriptionMessage() {
                            $modal.open({
                                animation: true
                                , templateUrl: 'FareNabberSubscriptionSuccessful.html.tpl'
                                , controller: ['$scope', '$modalInstance', function (modalInstanceScope, $modalInstance) {
                                    modalInstanceScope.ok = function () {
                                        $modalInstance.close();
                                    };
                                }]
                                , size: 'md'
                                , scope: scope
                            });
                        }
                    }
                };
            }]);
    });