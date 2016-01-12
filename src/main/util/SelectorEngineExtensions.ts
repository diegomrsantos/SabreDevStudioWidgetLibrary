define([
        'util/LodashExtensions'
    ], function (
        __
    ) {
        'use strict';

        function defineExtensions() {

            // from http://modernweb.com/2014/05/12/rethinking-dom-traversal/
            function getNext(elem, all) {
                var n = elem.nextSibling, matches = [];

                for ( ; n; n = n.nextSibling ) {
                    if ( n.nodeType === 1) {
                        matches.push( n );
                        if (!all) {
                            return matches;
                        }
                    }
                }
                return matches;
            }

            function getNextAll(elem) {
                return getNext(elem, true);
            }

            /**
             * Returns self and all the succeeding siblings of the current element and all first level cousins (the children of all the succeeding siblings of the current element parent).
             * It is intended to be invoked on one element only.
             * No selectors supported
             * @param maxElements
             */
            function  nextAllAndFirstLevelCousins(currentElement, maxElements) {
                var succeedingSiblings = getNextAll(currentElement);

                var parentSucceedingSiblings = getNextAll(currentElement.parentNode);
                var firstLevelSucceedingCousins = [];
                parentSucceedingSiblings.forEach(function (parentSuccSibling) {
                    __.pushAll(firstLevelSucceedingCousins, parentSuccSibling.children);
                });

                var selfAndNextAllAndFirstLevelSucceedingCousins = __.pushAll(__.pushAll([currentElement], succeedingSiblings), firstLevelSucceedingCousins);

                return (maxElements)? selfAndNextAllAndFirstLevelSucceedingCousins.slice(0, maxElements): selfAndNextAllAndFirstLevelSucceedingCousins;
            }

            return {
                  nextAllAndFirstLevelCousins: nextAllAndFirstLevelCousins
            };

        }
    return defineExtensions();
});