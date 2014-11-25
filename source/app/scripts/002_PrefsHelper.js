"use strict";
(function(w) {
    if (w.plugins === undefined || w.plugins.appPreferences === undefined) {
        var prefs = {
            store: function(okFunc, failFunc, keyName, value) {
                try {
                    w.localStorage[keyName] = value;
                    okFunc(value);
                } catch (e) {
                    failFunc(e);
                }
            },
            fetch: function(okFunc, failFunc, keyName) {
                try {
                    okFunc(w.localStorage[keyName]);
                } catch (e) {
                    failFunc(e);
                }
            }
        };
        w.PrefsHelper = prefs;
    } else {
        w.PrefsHelper = w.plugins.appPreferences;
    }
})(window);
