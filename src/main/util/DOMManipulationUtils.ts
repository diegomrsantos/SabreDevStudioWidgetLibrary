define([],
    function () {
        'use strict';

        /*
            The goal of this util is to provide hide/show/toggle mechanism to be used by "show details" and similar links.
            Using such 'manual' mechanism, outside of angular (ngIf, ngShow, collapse), is needed so that full digest cycle is not triggered
            for events like clicking "show details" link, which does not change the model state in any way.

            WARN: Beware of using "track by $index" in repeater that renders objects that use this mechanism.
            If you also have pagination for these objects, or resorting ar similar, then these css visibility classes
            will stay for the new object at the same position (track by $index) in the repeater.
         */

        /**
         * Currently only click events supported. Taps on touch screens supported as ordinary slow clicks (See comments in ngTouch)
         * Please note than ngTouch, although installed for SDSwidgets module, does not help here, as we on purpose do not use ng-click.
         * To have same support, you need to port ngTouch here.
         */
        var CLASS_VISIBLE = 'ng-show';
        var CLASS_HIDDEN = 'ng-hide';

        function toggleVisibility(el) {
            if (angular.element(el).hasClass(CLASS_VISIBLE)) {
                angular.element(el).removeClass(CLASS_VISIBLE);
                angular.element(el).addClass(CLASS_HIDDEN);
            } else if (angular.element(el).hasClass(CLASS_HIDDEN)) {
                angular.element(el).removeClass(CLASS_HIDDEN);
                angular.element(el).addClass(CLASS_VISIBLE);
            }
        }

        function show(el) {
            if (angular.element(el).hasClass(CLASS_HIDDEN)) {
                angular.element(el).removeClass(CLASS_HIDDEN);
            }
            angular.element(el).addClass(CLASS_VISIBLE);
        }

        function hide(el) {
            if (angular.element(el).hasClass(CLASS_VISIBLE)) {
                angular.element(el).removeClass(CLASS_VISIBLE);
            }
            angular.element(el).addClass(CLASS_HIDDEN);
        }

        function addToggleOnClickHandler(element, selectorForToggleLink, selectorForToggledContent) {
            element.querySelectorAll(selectorForToggleLink).on('click', function () { //event delegation not used for code simplicity, especially without jQuery, reconsider
                var elementsToToggle = element.querySelectorAll(selectorForToggledContent);
                [].forEach.call(elementsToToggle, function (e) {
                    toggleVisibility(e);
                });
            });
        }

        function addShowOnClickHandler(element, selectorForShowLink, selectorForContentToShow, selectorForContentToHide) {
            element.querySelectorAll(selectorForShowLink).on('click', function () { //event delegation not used for code simplicity, especially without jQuery, reconsider
                var elementsToShow = element.querySelectorAll(selectorForContentToShow);
                [].forEach.call(elementsToShow, function (e) {
                    show(e);
                });
                if (selectorForContentToHide) {
                    var elementsToHide = element.querySelectorAll(selectorForContentToHide);
                    [].forEach.call(elementsToHide, function (e) {
                        hide(e);
                    });
                }
            });
        }

        function addHideOnClickHandler(element, selectorForHideLink, selectorForContentToHide, selectorForContentToShow) {
            element.querySelectorAll(selectorForHideLink).on('click', function () { //event delegation not used for code simplicity, especially without jQuery, reconsider
                var elementsToHide = element.querySelectorAll(selectorForContentToHide);
                [].forEach.call(elementsToHide, function (e) {
                    hide(e);
                });
                if (selectorForContentToShow) {
                    var elementsToShow = element.querySelectorAll(selectorForContentToShow);
                    [].forEach.call(elementsToShow, function (e) {
                        show(e);
                    });
                }
            });
        }

        return {
              addToggleOnClickHandler: addToggleOnClickHandler
            , addShowOnClickHandler: addShowOnClickHandler
            , addHideOnClickHandler: addHideOnClickHandler
        };
    });
