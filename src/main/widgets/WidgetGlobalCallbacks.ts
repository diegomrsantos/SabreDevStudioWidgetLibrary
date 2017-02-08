define([
    'elementQuery'
], function(
    elementQuery
) {
    // Callbacks to be called by all widgets, especially at link function
    "use strict";
    return {
        // callback to be called by all standalone (not partials) widgets at the end of link function.
        // Not using any global decorator or global post-link, as do not want to change behaviour of all directives
        linkComplete: function (scope, element) {
            // see https://github.com/marcj/css-element-queries/issues/95. In future maybe will be optimized for something like refresh. Then init or listen will be run globally on widgets SDK level
            // WARN: there is performance penalty in this ElementQuery init, on fast desktop browser takes 0.7 second. So DO NOT call unnecessarily, especially from partials.
            elementQuery.init();

            scope.$on('$destroy', function() {
                elementQuery.detach(element);
            });
        }
    };
});