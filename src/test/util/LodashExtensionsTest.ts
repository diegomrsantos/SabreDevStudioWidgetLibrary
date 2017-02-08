define([
      'lodash'
    , 'util/LodashExtensions'
], function (
      _
    , __
) {
    "use strict";

    describe('leafValues', function () {
        it('one level map', function () {
            var map = {
                'keyOne': 'valueOne',
                'KeyTwo': 'valueTwo'
            };
            var result = __.leafValues(map);
            expect(result.length).toBe(2);
            expect(result[0]).toBe('valueOne');
            expect(result[1]).toBe('valueTwo');
        });

        it('two level map', function () {
            var map = {
                'keyOne': {
                    'keyOneOne': 'val11',
                    'keyOneTwo': 'val12'
                },
                'KeyTwo': {
                    'keyTwoOne': 'val21',
                    'keyTwoTwo': 'val22'
                }
            };
            var result = __.leafValues(map);
            expect(result.length).toBe(4);
            expect(result.sort()).toEqual(['val11', 'val12', 'val21', 'val22'].sort());
        });
    })

    describe('cancellable', function () {
        it('cancelled not called yet, function calls with arguments forwarded', function () {
            //given
            var baseFn = jasmine.createSpy('baseFn');
            var cancellable = __.cancellable(baseFn);
            //when
            var arg1 = {};
            var arg2 = {};
            cancellable(arg1, arg2);
            expect(baseFn).toHaveBeenCalledWith(arg1, arg2);
        })
        it('cancelled called, no more calls forwarding', function () {
            //given
            var baseFn = jasmine.createSpy('baseFn');
            var cancellable = __.cancellable(baseFn);
            cancellable.cancel();
            //when
            cancellable();
            expect(baseFn).not.toHaveBeenCalled();
        })
    })
});