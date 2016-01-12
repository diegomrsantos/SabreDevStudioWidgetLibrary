define([
          'util/LodashExtensions'
        , 'moment'
        , 'angular'
        , 'angular_bootstrap'
        , 'widgets/SDSWidgets'
    ],
    function (
          _
        , moment
        , angular
        , angular_bootstrap
        , SDSWidgets
    ) {
        'use strict';

        return angular.module('sdsWidgets')
            /* directive for a button with drop-down. On choosing value from dropdown this value is presented on the button.
            *  May be used for example for choosing itineraries list sorting criteria.
            **/
            .directive('inputSelectDropdown', function () {

                return {
                    restrict: 'EA',
                    replace: true,
                    scope: {
                        /* Input argument: label that will be displayed before the dropdown button. For example 'Sort by' */
                          label: '@'

                        /**
                         * Input argument:
                         * array of all available for criteria, to be displayed (and be selectable) on the dropdown.
                         * Array elements must be object and have fields: label, propertyName, reverse.
                         * These objects will come from ItinerariesListSortCriteria.availableSortCriteria
                         */
                        , availableSortCriteria: '='

                        /**
                         * Output argument.
                         * On selection on the dropdown, the directive will set this to the selected value from the availableSortCriteria.
                         * So the return value here will be the specific element from availableSortCriteria
                         */
                        , selectedFirstSortCriterion: '='

                        /**
                         * Callback that will be called on every sorting criteria changed (when value on dropdown is selected).
                         */
                        , onSortingCriteriaChanged: '&'
                    },
                    templateUrl: '../widgets/view-templates/partials/InputSortBy.tpl.html',
                    link: function (scope, element) {

                        var lastSelectedValueIdx;

                        function setSelectDropdownValue(dropdownMenuElement, selectedValueLabel, selectedValueIdx) {
                            var buttonLabelTextSelector = "button span.SDSDropdownLabelText";
                            var buttonLabelElement = angular.element(dropdownMenuElement.parentNode.querySelectorAll(buttonLabelTextSelector));

                            buttonLabelElement.text(selectedValueLabel);
                            buttonLabelElement.val(selectedValueLabel);

                            scope.selectedFirstSortCriterion.selected = scope.availableSortCriteria[selectedValueIdx];
                            scope.onSortingCriteriaChanged();
                        }

                        function isAlreadySelectedValue(selectedValueIdx) {
                            return (selectedValueIdx === lastSelectedValueIdx);
                        }

                        element[0].querySelector('.dropdown-menu').addEventListener('click', function(event) {
                            var clickedElement = event.target;
                            var selectedValueLabel = clickedElement.textContent;
                            var selectedValueIdx = parseInt(clickedElement.getAttribute('data-criterion-index'));
                            if (isAlreadySelectedValue(selectedValueIdx)) {
                                return;
                            }
                            var dropdownMenuElement = this;
                            setSelectDropdownValue(dropdownMenuElement, selectedValueLabel, selectedValueIdx);
                            lastSelectedValueIdx = selectedValueIdx;
                        }, true);

                    }
                };
            });
    });
