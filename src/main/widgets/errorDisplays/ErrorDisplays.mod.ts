define([
        'angular',
        'angular_bootstrap',
        'widgets/errorDisplays/ErrorDisplayWidget.drv',
        'widgets/errorDisplays/ModalErrorDisplayWidget.drv'
    ],
    function (
        angular,
        angular_bootstrap,
        ErrorDisplayWidget,
        ModalErrorDisplayWidget
    ) {
        'use strict';

        return angular.module('sdsWidgets.errorDisplays', [])
            .directive('validationErrorDisplay', [
                'validationErrorEvent',
                '$modal',
                ModalErrorDisplayWidget
            ])
            .directive('networkErrorDisplay', [
                'networkErrorEvent',
                '$modal',
                ModalErrorDisplayWidget
            ])
            .directive('errorDisplay', [
                'errorEvent',
                'resetErrorsEvent',
                'newSearchCriteriaEvent',
                'newInspirationalSearchCriteriaEvent',
                ErrorDisplayWidget
            ])
    }
);