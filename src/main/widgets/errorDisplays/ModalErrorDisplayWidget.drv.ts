define([],
    function (
    ) {
        'use strict';

        return function ModalErrorDisplayWidget (
                    errorEvent,
                    $modal
                ) {
                return {
                    link: function (scope, element, attrs) {
                        var deduplicateSameMessages = attrs.dedup;
                        var receivedMessagesRegistry = {};
                        scope.$on(errorEvent, function (event, errors, errorsCategory) {
                            if (deduplicateSameMessages) {
                                var receivedMessagesKey = JSON.stringify({
                                    errors: errors,
                                    errorsCategory: errorsCategory
                                }) ;
                                if (receivedMessagesRegistry[receivedMessagesKey]) {
                                    return;
                                }
                                receivedMessagesRegistry[receivedMessagesKey] = true;
                            }
                            $modal.open({
                                animation: true,
                                templateUrl: '../widgets/view-templates/partials/ErrorsModal.tpl.html',
                                controller: ['$scope', '$modalInstance', function ($scope, $modalInstance) {
                                    $scope.errorsList = errors;
                                    $scope.modalTitle = errorsCategory;

                                    $scope.ok = function () {
                                        $modalInstance.close();
                                    };
                                }]
                            });
                        });
                    }
                }
            };
});
