"use strict";
window.PaymentOptions = window.PaymentOptions || {};
(function(ns) {
    function checkDonation() {
        var platformIdentifier = window.cordova ? (window.cordova.platformId ? (window.cordova.platformId) : "unknown"): "unknown";
        switch (platformIdentifier.toLowerCase()) {
            case "android":
            case "emulated":
                ns.donationEnabled = true;
                return;
            default:
                ns.donationEnabled = false;
        }
    }
    function doCheck() {
        if (window.cordova === undefined) {
            window.setTimeout(doCheck, 50);
        } else {
            checkDonation();
        }
    }
    doCheck();
})(window.PaymentOptions);
