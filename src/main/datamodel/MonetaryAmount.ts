define([],
    function () {
        'use strict';

        function MonetaryAmount(amount, currency) {
            this.amount = amount;
            this.currency = currency;
        }

        return MonetaryAmount;
    });
