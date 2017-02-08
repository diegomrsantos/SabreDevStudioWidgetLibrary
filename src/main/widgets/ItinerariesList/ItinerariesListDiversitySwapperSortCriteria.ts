define([
          'lodash'
        , 'util/LodashExtensions'
        , 'widgets/ItinerariesList/ItinerariesListSortCriteria'
    ],
    function (
              _
            , __
            , ItinerariesListSortCriteria
    ) {
        'use strict';

        /**
         * This object models available sort criteria for ItinerariesList, and the currently selected sort criteria order.
         * The Currently selected sort criteria order is the list of sort criteria, that are to be applied to Itineraries, till there are no ties.
         */
        function ItinerariesListDiversitySwapperSortCriteria() {

            ItinerariesListSortCriteria.call(this);
        }

        ItinerariesListDiversitySwapperSortCriteria.prototype = Object.create(ItinerariesListSortCriteria.prototype);
        ItinerariesListDiversitySwapperSortCriteria.prototype.constructor = ItinerariesListDiversitySwapperSortCriteria;

       ItinerariesListDiversitySwapperSortCriteria.prototype.diversitySwapperSortCriteriaDefinitions = {

            byWeightedPriceAmountAsc: {
                label: 'Weighted Price (Lowest)',
                propertyName: 'weightedPriceAmount',
                reverse: false
            },
            byWeightedPriceAmountDesc: {
                label: 'Weighted Price (Highest)',
                propertyName: 'weightedPriceAmount',
                reverse: true
            }
        };

        /* overwriting super class */
        ItinerariesListDiversitySwapperSortCriteria.prototype.configureAvailableSortCriteria = function () {

            return _.union(ItinerariesListSortCriteria.prototype.configureAvailableSortCriteria.call(this),
                [this.diversitySwapperSortCriteriaDefinitions.byWeightedPriceAmountAsc, this.diversitySwapperSortCriteriaDefinitions.byWeightedPriceAmountDesc]);
        };

        return ItinerariesListDiversitySwapperSortCriteria;

    });
