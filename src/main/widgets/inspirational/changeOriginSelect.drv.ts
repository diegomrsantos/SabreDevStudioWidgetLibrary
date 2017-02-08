define([],
    function (
    ) {
        'use strict';

        function ChangeOriginSelectDirective(
            tripOriginProvider:ITripOriginProvider,
            tripOriginChangedService:ITripOriginChangedService
        ) {
            return {
                scope: {
                    originPreset: '@?'
                },
                templateUrl: '../widgets/view-templates/widgets/ChangeOriginSelect.tpl.html',
                link: function (scope) {

                    var origin: string =  tripOriginProvider.get() || scope.originPreset;
                    if (origin) {
                        // initialize this main model object only here, and not outside of this if,
                        // because otherwise, if there is no originPreset, the input-airport directive will render undefined (undefined)
                        // in the input airport field (as object does not have airport code or airport full name yet
                        scope.origin = {};
                        scope.origin.airportCode = origin;
                    }

                    scope.newOriginSelected = function () {
                        tripOriginChangedService.onOriginChange(scope.origin.airportCode);
                    };
                }
            }
        }
        return ChangeOriginSelectDirective;
    });
