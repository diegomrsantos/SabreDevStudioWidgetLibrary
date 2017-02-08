define([
        'angular',
        'webservices/SabreDevStudioWebServicesModule',
        'widgets/inspirational/ThemedDestinationFinderWidget.ctr',
        'widgets/inspirational/TilesThemedDestinationFinderWidget.drv',
        'widgets/inspirational/MapThemedDestinationFinderWidget.drv',
        'util/CommonGenericFilters',
        'widgets/inspirational/ThemedInspirationalSearchCriteriaBroadcastingService.srv',
        'widgets/inspirational/ThemedInspirationalSearchCompleteBroadcastingService.srv',
        'widgets/inspirational/TripOriginChangedBroadcastingService.srv',
        'widgets/inspirational/TripOriginChangedLocalStorageService.srv',
        'widgets/inspirational/TripOriginChangedCompositeService.srv',
        'widgets/inspirational/TripOriginLocalStorageProvider.srv',
        'widgets/inspirational/TravelThemesSelectionBar.drv',
        'angular_google_maps',
        'webservices/inspirational/DestinationFinderSummaryServicePriceClassifierDecorator',
        'webservices/inspirational/DestinationFinderSummaryServiceGeoCoordsDecorator',
        'webservices/inspirational/DestinationFinderCachedSummaryService',
        'webservices/geo/ClosestAirportGeoService',
        'widgets/inspirational/changeOriginSelect.drv'
    ],
    function (
        angular,
        webServicesModule,
        ThemedDestinationFinderWidgetController,
        TilesThemedDestinationFinderWidgetDirective,
        MapThemedDestinationFinderWidgetDirective,
        CommonGenericFiltersModule,
        ThemedInspirationalSearchCriteriaBroadcastingService,
        ThemedInspirationalSearchCompleteBroadcastingService,
        TripOriginChangedBroadcastingService,
        TripOriginChangedLocalStorageService,
        TripOriginChangedCompositeService,
        TripOriginLocalStorageProvider,
        TravelThemesSelectionBarDirective,
        angularGoogleMapsModule,
        DestinationFinderSummaryServicePriceClassifierDecoratorSrc,
        DestinationFinderSummaryServiceGeoCoordsDecoratorSrc,
        DestinationFinderCachedSummaryServiceSrc,
        ClosestAirportGeoServiceSrc,
        ChangeOriginSelectDirective
    ) {
        'use strict';

        return angular.module('sdsWidgets.inspirationalWidgets', [
            'sabreDevStudioWebServices',
            'commonFilters',
            'uiGmapgoogle-maps',
            'ngStorage'
        ])
            .config(['uiGmapGoogleMapApiProvider', function(uiGmapGoogleMapApiProvider) {
                uiGmapGoogleMapApiProvider.configure({
                    key: 'AIzaSyBVxxTahaPICgkB26ddyLy_U-kN90V4pmE',
                    v: '3' // per Google recommendations use just v3, to always get latest stable version. Do not specify specific versions line 3.23, as over time they become retired
                });
            }])
            .constant('newThemedInspirationalSearchCriteriaEvent', 'newThemedInspirationalSearchCriteriaEvent')

            .constant('themedInspirationalSearchCompleteEvent', 'themedInspirationalSearchCompleteEvent')

            .constant('tripOriginChangedEvent', 'tripOriginChangedEvent')

            .service('ThemedInspirationalSearchCriteriaBroadcastingService',
                ThemedInspirationalSearchCriteriaBroadcastingService)

            .service('ThemedInspirationalSearchCompleteBroadcastingService',
                ThemedInspirationalSearchCompleteBroadcastingService)

            .service('TripOriginChangedBroadcastingService',
                TripOriginChangedBroadcastingService)

            .service('TripOriginChangedLocalStorageService', [
                '$localStorage',
                TripOriginChangedLocalStorageService])

            .service('TripOriginChangedLocalStorageBroadcastService', [
                'TripOriginChangedLocalStorageService',
                'TripOriginChangedBroadcastingService'
                , TripOriginChangedCompositeService])

            .service('TripOriginLocalStorageProvider', [
                '$localStorage',
                TripOriginLocalStorageProvider])

            .directive('travelThemesSelectionBar',
                TravelThemesSelectionBarDirective)

            .factory('DestinationFinderSummaryDataServiceCached', [
                'DestinationFinderSummaryDataService',
                DestinationFinderCachedSummaryServiceSrc])

            .factory('DestinationFinderSummaryServicePriceClassifierDecoratorCached', [
                'DestinationFinderSummaryServicePriceClassifierDecorator',
                DestinationFinderCachedSummaryServiceSrc])

            .controller('TilesThemedDestinationFinderWidgetController', [
                '$scope',
                'ClosestAirportGeoService',
                'CachedGeoCodeDataService',
                'DestinationFinderSummaryDataServiceCached',
                'ThemedInspirationalSearchCriteriaBroadcastingService',
                'ThemedInspirationalSearchCompleteBroadcastingService',
                'TripOriginChangedBroadcastingService',
                ThemedDestinationFinderWidgetController])

            .controller('MapThemedDestinationFinderWidgetController', [
                '$scope',
                'ClosestAirportGeoService',
                'CachedGeoCodeDataService',
                'DestinationFinderSummaryServicePriceClassifierDecoratorCached',
                'ThemedInspirationalSearchCriteriaBroadcastingService',
                'ThemedInspirationalSearchCompleteBroadcastingService',
                'TripOriginChangedBroadcastingService',
                ThemedDestinationFinderWidgetController])

            .directive('tilesThemedDestinationFinder',
                TilesThemedDestinationFinderWidgetDirective)

            .directive('mapThemedDestinationFinder',
                MapThemedDestinationFinderWidgetDirective)

            .directive('changeOriginSelect', [
                'TripOriginLocalStorageProvider',
                'TripOriginChangedLocalStorageBroadcastService',
                ChangeOriginSelectDirective])
    }
);