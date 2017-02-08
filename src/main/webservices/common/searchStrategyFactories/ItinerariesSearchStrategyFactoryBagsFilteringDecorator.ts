define([
         'angular'
        , 'lodash'
        , 'webservices/SabreDevStudioWebServicesModule'
        , 'webservices/common/searchStrategyFactories/ItinerariesSearchStrategyFactory'
        , 'datamodel/ItinerariesList'
        , 'datamodel/MonetaryAmount'
    ],
    function (
         angular
        , _
        , SDSWebServices
        , delegateFactory
        , ItinerariesList
        , MonetaryAmount
    ) {
        'use strict';

        return angular.module('sabreDevStudioWebServices')
            .factory('ItinerariesSearchStrategyFactoryBagsFilteringDecorator', [
                'ItinerariesSearchStrategyFactory',
                'ErrorReportingService'
            , function (
                delegate,
                ErrorReportingService
            ) {

                function calculateBaggageCharges(additionalPieces, airlineCode) {
                    if (additionalPieces === 0) {
                        return 0;
                    }
                    const chargePerNthAdditionalPiece = {
                        1: 120,
                        2: 200,
                        3: 300
                    };
                    var chargeIncreaseToSimulateDifferencesAcrossCarriers = (airlineCode.charCodeAt(0) % 10) * 10 - 50;
                    var totalCharges = chargeIncreaseToSimulateDifferencesAcrossCarriers;
                    for (var nThAdditionalPiece = 1 ; nThAdditionalPiece <= additionalPieces ; nThAdditionalPiece++) {
                        totalCharges += chargePerNthAdditionalPiece[nThAdditionalPiece];
                    }
                    return totalCharges;
                }

                return {
                    createSearchStrategy: function (activeSearchWebService) {
                        var delegateStrategy = delegate.createSearchStrategy(activeSearchWebService);
                        return {
                            search: function (searchCriteria, callbacks) {
                                const bagsRequested = searchCriteria.bagsRequested;
                                if (_.isUndefined(bagsRequested)) {
                                    return delegateStrategy.search(searchCriteria, callbacks);
                                }

                                //function bagsFilteringStrategy(originalItineraryList) {
                                //    var filteredItins = originalItineraryList.itineraries
                                //        .filter(function (itin) {
                                //            return itin.getMinBaggageAllowance() === bagsRequested;
                                //        });
                                //    var filteredItinList = new ItinerariesList();
                                //    filteredItinList.addAll(filteredItins);
                                //    if (filteredItinList.size() === 0) {
                                //        ErrorReportingService.reportError(`Could not find itineraries with ${bagsRequested} bags requested`, searchCriteria);
                                //        failureCallback();
                                //    } else {
                                //        successCallback(filteredItinList);
                                //    }
                                //}

                                function decorateWithBagsFilteringAndBaggageChargesSupplementingStrategy(originalCallback) {
                                    return function (originalItineraryList) {
                                        var baggageChargesSupplementedItinList = addBaggageChargesForInsufficientAllowance(originalItineraryList);
                                        if (baggageChargesSupplementedItinList.size() === 0) {
                                            ErrorReportingService.reportError(`Could not find itineraries with ${bagsRequested} bags requested`, searchCriteria);
                                            callbacks.failureCallback();
                                        } else {
                                            originalCallback(baggageChargesSupplementedItinList);
                                        }
                                    }
                                }

                                function allowanceUndefinedOrNotGreaterThanRequested(_itin) {
                                    return _.isUndefined(_itin.getMinBaggageAllowance()) || (_itin.getMinBaggageAllowance() <= bagsRequested);
                                }

                                function patchGetterForTotalFareAmount(itin) {
                                    if (_.isUndefined(itin.baggageCharges)) {
                                        return itin;
                                    }
                                    Object.defineProperty(itin, 'totalFareAmount', {
                                        get: function() {
                                            const itinTotalFareAmount = this.itineraryPricingInfo.fareAmounts.totalFare.amount;
                                            return itinTotalFareAmount + itin.baggageCharges;
                                        }
                                    });
                                    return itin;
                                }

                                function patchGetterForTotalFareAmountWithCurrency(itin) {
                                    if (_.isUndefined(itin.baggageCharges)) {
                                        return itin;
                                    }
                                    Object.defineProperty(itin, 'totalFareAmountWithCurrency', {
                                        get: function() {
                                            const itinTotalFare = itin.itineraryPricingInfo.fareAmounts.totalFare;
                                            return new MonetaryAmount(itinTotalFare.amount + itin.baggageCharges, itinTotalFare.currency);
                                        }
                                    });
                                    return itin;
                                }

                                function addBaggageChargesForInsufficientAllowance(originalItineraryList) {
                                    const filteredItins = originalItineraryList.itineraries
                                        .filter(allowanceUndefinedOrNotGreaterThanRequested) // do not return itineraries with allowance greater then requested, per business decision
                                        .map(function (itin) {
                                            if (itin.getMinBaggageAllowance() === bagsRequested) {
                                                return itin;
                                            }
                                            var itinBaggageAllowance = itin.getMinBaggageAllowance() || 0;
                                            var additionalPieces = bagsRequested - itinBaggageAllowance;
                                            itin.baggageCharges = calculateBaggageCharges(additionalPieces, itin.getFirstMarketingAirline());
                                            return itin;
                                        })
                                        .map(patchGetterForTotalFareAmount)
                                        .map(patchGetterForTotalFareAmountWithCurrency);
                                    var filteredItinList = new ItinerariesList();
                                    filteredItinList.addAll(filteredItins);
                                    return filteredItinList;
                                }

                                return delegateStrategy.search(searchCriteria, {
                                    successCallback: decorateWithBagsFilteringAndBaggageChargesSupplementingStrategy(callbacks.successCallback),
                                    failureCallback: callbacks.failureCallback,
                                    updateCallback: decorateWithBagsFilteringAndBaggageChargesSupplementingStrategy(callbacks.updateCallback),
                                    streamEndCallback: callbacks.streamEndCallback
                                });
                            }
                        };
                    }
                };
            }
        ]);

    });
