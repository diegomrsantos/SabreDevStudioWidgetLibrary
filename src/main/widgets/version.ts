// intentionally empty dummy. It will be replaces in build process by actual angular template charging script (wrapped in AMD)
define([], function() {
    "use strict";
    return {
        version: function () {
            return {'info': 'values are set only in production (requirejs) build'};
        }
    };
});