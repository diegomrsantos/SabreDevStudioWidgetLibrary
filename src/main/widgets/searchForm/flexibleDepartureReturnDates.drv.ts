define([
    'lodash'
], function (
    _
) {
    'use strict';

    return function flexibleDepartureReturnDates () {

        return {
            require: 'ngModel',
            replace: true,
            scope: {
                required: '@'
                , dateFormat: '@'
                , minDate: '='
                , onAnyDateChange: '&'
                , ngModel: '='
                , internalFormName: '@'
            },
            templateUrl: '../widgets/view-templates/partials/FlexibleDepartureReturnDates.tpl.html',
            link: function (scope, elm, attrs, ctrl) {

                /*From Angular documentation:
                 By default, ngModel watches the model by reference, not value. This is important to know when
                 binding inputs to models that are objects (e.g. Date) or collections (e.g. arrays).
                 If only properties of the object or collection change, ngModel will not be notified and so the input will not be re-rendered.
                 The model must be assigned an entirely new object or collection before a re-rendering will occur.

                 Here we are not exactly interested in re-rendering as it will be handled by internal directives
                 used in our template, but we want Angular to automatically run validators when dates change.
                 */
                scope.$watch("ngModel.dates", function (newVal, oldVal) {
                    if(!_.isEqual(newVal, oldVal)){
                        scope.ngModel = _.clone(scope.ngModel);
                    }
                }, true);

                ctrl.$validators.invalidDepartureDate = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleDepartureDate) {
                        return true;
                    }
                    if (preferences.isFlexibleReturnDate) {
                        result = preferences.departureDate <= preferences.flexibleReturnDate.from;
                    }
                    else {
                        result = preferences.departureDate <= preferences.returnDate;
                    }
                    return result;
                };

                ctrl.$validators.invalidReturnDate = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleReturnDate) {
                        return true;
                    }
                    if (preferences.isFlexibleDepartureDate) {

                        result = preferences.returnDate >= preferences.flexibleDepartureDate.from;
                    }
                    else {

                        result = preferences.returnDate >= preferences.departureDate;
                    }
                    return result;
                };

                ctrl.$validators.invalidDepartureDateFrom = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(!preferences.isFlexibleDepartureDate) {
                        return true;
                    }
                    if (preferences.isFlexibleReturnDate) {

                        result = preferences.flexibleDepartureDate.from  <= preferences.flexibleReturnDate.from;
                    }
                    else {

                        result = preferences.flexibleDepartureDate.from <= preferences.returnDate;
                    }
                    return result;
                };

                ctrl.$validators.invalidDepartureDateFromTo = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleDepartureDate) {
                        result = preferences.flexibleDepartureDate.from  < preferences.flexibleDepartureDate.to;
                    }
                    return result;
                };

                ctrl.$validators.invalidDepartureDateToFrom = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleDepartureDate) {
                        result = preferences.flexibleDepartureDate.to > preferences.flexibleDepartureDate.from;
                    }
                    return result;
                };

                ctrl.$validators.invalidDepartureDateToReturnDateTo = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleDepartureDate && preferences.isFlexibleReturnDate) {
                        result = preferences.flexibleDepartureDate.to <= preferences.flexibleReturnDate.to ;
                    }
                    return result;
                };

                ctrl.$validators.invalidReturnDateFrom = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(!preferences.isFlexibleReturnDate) {
                        return true;
                    }
                    if (preferences.isFlexibleDepartureDate) {

                        result = preferences.flexibleReturnDate.from >= preferences.flexibleDepartureDate.from;
                    }
                    else {

                        result = preferences.flexibleReturnDate.from >= preferences.departureDate;
                    }
                    return result;
                };

                ctrl.$validators.invalidReturnDatesFromTo = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleReturnDate) {
                        result = preferences.flexibleReturnDate.from  < preferences.flexibleReturnDate.to;
                    }
                    return result;
                };

                ctrl.$validators.invalidReturnDatesToFrom = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleReturnDate) {
                        result = preferences.flexibleReturnDate.to > preferences.flexibleReturnDate.from;
                    }
                    return result;
                };

                ctrl.$validators.invalidReturnDateToDepartureDateTo = function (modelValue, viewValue) {

                    var result = true;
                    var preferences = modelValue.dates;
                    if(preferences.isFlexibleReturnDate && preferences.isFlexibleDepartureDate) {
                        result = preferences.flexibleReturnDate.to >= preferences.flexibleDepartureDate.to;
                    }
                    return result;
                };
            }
        };
    }
})
