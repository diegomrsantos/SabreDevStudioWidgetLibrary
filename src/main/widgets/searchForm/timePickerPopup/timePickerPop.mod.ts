import angular = require('angular');

angular.module('sdsWidgets.timePickerPop', [])
    .factory('timepickerState', function() {
        var pickers : any[] = [];
        return {
            addPicker: function(picker) {
                pickers.push(picker);
            },
            closeAll: function() {
                for (var i=0; i<pickers.length; i++) {
                    pickers[i].close();
                }
            }
        };
    })
    .directive("timeFormat", ['$filter', function($filter) {
        return {
            restrict : 'A',
            require : 'ngModel',
            scope : {
                showMeridian : '=',
            },
            link : function(scope, element, attrs, ngModel) {
                /* jshint maxcomplexity:8 */
                var parseTime = function(viewValue) {
                    if (!viewValue) {
                        ngModel.$setValidity('time', true);
                        return null;
                    } else if (angular.isDate(viewValue) && !isNaN(viewValue)) {
                        ngModel.$setValidity('time', true);
                        return viewValue;
                    } else if (angular.isString(viewValue)) {
                        var timeRegex = /^(0?[0-9]|1[0-2]):[0-5][0-9] ?[a|p]m$/i;
                        if (!scope.showMeridian) {
                            timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
                        }
                        if (!timeRegex.test(viewValue)) {
                            ngModel.$setValidity('time', false);
                            return undefined;
                        } else {
                            ngModel.$setValidity('time', true);
                            var date = new Date();
                            var sp = viewValue.split(":");
                            var apm = sp[1].match(/[a|p]m/i);
                            if (apm) {
                                sp[1] = sp[1].replace(/[a|p]m/i, '');
                                // jshint maxdepth:4
                                if (apm[0].toLowerCase() === 'pm') {
                                    sp[0] = sp[0] + 12;
                                }
                            }
                            date.setHours(sp[0], sp[1]);
                            return date;
                        }
                    } else {
                        ngModel.$setValidity('time', false);
                        return undefined;
                    }
                };

                ngModel.$parsers.push(parseTime);

                var showTime = function(data) {
                    parseTime(data);
                    var timeFormat = (!scope.showMeridian) ? "HH:mm" : "hh:mm a";
                    return $filter('date')(data, timeFormat);
                };
                ngModel.$formatters.push(showTime);
                scope.$watch('showMeridian', function(value) {
                    var myTime = ngModel.$modelValue;
                    if (myTime) {
                        element.val(showTime(myTime));
                    }

                });
            }
        };
    }])
    .directive('timepickerPop', ['$document', 'timepickerState', function($document, timepickerState) {
        return {
            restrict : 'E',
            transclude : false,
            scope : {
                inputTime : "=",
                showMeridian : "=",
                minuteStep: "=",
                disabled : "="
            },
            controller : ['$scope', '$element', function($scope, $element) {
                $scope.isOpen = false;

                $scope.disabledInt = angular.isUndefined($scope.disabled)? false : $scope.disabled;

                $scope.toggle = function() {
                    if ($scope.isOpen) {
                        $scope.close();
                    } else {
                        $scope.open();
                    }
                };
            }],
            link : function(scope, element, attrs) {
                var picker = {
                    open : function () {
                        timepickerState.closeAll();
                        scope.isOpen = true;
                    },
                    close: function () {
                        scope.isOpen = false;
                    }

                }
                timepickerState.addPicker(picker);

                scope.open = picker.open;
                scope.close = picker.close;

                scope.$watch("disabled", function(value) {
                    scope.disabledInt = angular.isUndefined(scope.disabled)? false : scope.disabled;
                });

                scope.$watch("inputTime", function(value) {
                    if (!scope.inputTime) {
                        element.addClass('has-error');
                    } else {
                        element.removeClass('has-error');
                    }

                });

                element.bind('click', function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                });

                $document.bind('click', function(event) {
                    scope.$apply(function() {
                        scope.isOpen = false;
                    });
                });

            },
            templateUrl : '../src/main/widgets/searchForm/timePickerPopup/timePickerPop.tpl.html'
        };
    }])