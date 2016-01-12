define([
          'lodash'
        , 'util/LodashExtensions'
        , 'moment'
        , 'angular'
        , 'util/CommonGenericFilters'
    ],
    function (
          _
        , __
        , moment
        , angular
        , CommonGenericFilters
    ) {
        'use strict';

        return angular.module('commonFilters')
            .filter('cabin', function () {
                /*jshint maxcomplexity:10 */
                return function (cabinSymbol) {
                    switch (cabinSymbol) {
                        case 'Y': return 'Economy';
                        case 'S': return 'Premium Economy';
                        case 'C': return 'Business';
                        case 'J': return 'Premium Business';
                        case 'F': return 'First';
                        case 'P': return 'Premium First';
                        default: return cabinSymbol;
                    }
                };
            })
            .filter('ticketRefundability', function () {
                return function (nonRefundableIndicator) {
                    return (nonRefundableIndicator)? 'Non-refundable ticket': 'Refundable ticket';
                };
            })
            .filter('baggageAllowance', function () {
                /*jshint maxcomplexity:6 */
                return function (allowanceObj) {
                    if (_.isUndefined(allowanceObj)) {
                        return allowanceObj;
                    }
                    if (__.isDefined(allowanceObj.Pieces)) {
                        var allowedPieces;
                        switch (allowanceObj.Pieces) {
                            case 0: allowedPieces = '0 pieces'; break;
                            case 1: allowedPieces = '1 piece'; break;
                            default : allowedPieces = allowanceObj.Pieces + ' pieces'; break;
                        }
                    }
                    if (allowanceObj.Weight && allowanceObj.Unit) {
                        var allowedWeight = allowanceObj.Weight + ' ' + allowanceObj.Unit;
                    }
                    return [allowedPieces, allowedWeight].filter(__.isDefined).join(', ');
                };
            })
            .filter('meal', function () {

                var mealCodeMappings = {};
                mealCodeMappings['P'] = 'Alcoholic beverages for purchase';
                mealCodeMappings['B'] = 'Breakfast';
                mealCodeMappings['O'] = 'Cold meal';
                mealCodeMappings['C'] = 'Complimentary alcoholic beverages';
                mealCodeMappings['K'] = 'Continental Breakfast';
                mealCodeMappings['D'] = 'Dinner ';
                mealCodeMappings['F'] = 'Food for purchase';
                mealCodeMappings['G'] = 'Food and Beverage / for purchase';
                mealCodeMappings['H'] = 'Hot Meal';
                mealCodeMappings['L'] = 'Lunch';
                mealCodeMappings['M'] = 'Meal';
                mealCodeMappings['N'] = 'No meal service';
                mealCodeMappings['R'] = 'Refreshment';
                mealCodeMappings['V'] = 'Refreshment / for purchase';
                mealCodeMappings['S'] = 'Snack';

                return function (mealCode) {
                    return mealCodeMappings[mealCode] || mealCode;
                };
            })
            .filter('humanizeNumberOfStops', function () {
                return function (numberOfStops) {
                    switch (numberOfStops) {
                        case 0:
                            return 'Non-stop';
                        case 1:
                            return 'One stop';
                        default:
                            return 'Two+ stops';
                    }
                };
            })
            .filter('passengerType', function () {

                var paxTypeMappings = {};
                paxTypeMappings['ADT'] = 'Adult';
                paxTypeMappings['CNN'] = 'Child';
                paxTypeMappings['SNN'] = 'Senior';
                paxTypeMappings['SRC'] = 'Senior citizen';
                paxTypeMappings['INS'] = 'Infant with a seat';
                paxTypeMappings['INF'] = 'Infant without a seat';
                paxTypeMappings['FFY'] = 'Frequent flyer';

                return function (passengerType) {
                    return paxTypeMappings[passengerType] || passengerType;
                };
            })
            .filter('humanizeDurationDays', function () {
                return function (days) {
                    if (days === 1) {
                        return '1 day';
                    }
                    if (days > 1 && days < 7) {
                        return days + ' days';
                    }
                    if (days === 7) {
                        return '1 week';
                    }
                    if (days === 14) {
                        return '2 weeks';
                    } else {
                        return days + ' days';
                    }
                };
            })
            .filter('humanizeMinutes', function () {
                return function(minutes) {
                    var hours = Math.floor(minutes / 60);
                    var minutesOverFullHours = minutes % 60;
                    if (hours === 0) {
                        return minutes + ' min.';
                    }
                    if (hours === 1) {
                        return hours + ' hour, ' + minutesOverFullHours + ' min.';
                    }
                    if (hours > 1) {
                        return hours + ' hour, ' + minutesOverFullHours + ' min.';
                    }
                };
            });
    });
