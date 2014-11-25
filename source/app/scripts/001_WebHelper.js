"use strict";
(function(w) {
    var WebHelper = {
        openUrl: function(url) {
            if (WebHelper.hasWebIntentPlugin()) {
                w.plugins.webintent.startActivity({
                        action: window.plugins.webintent.ACTION_VIEW,
                        url: url
                },
                function() {},
                function() { alert("Failed to open URL via Android intent"); }
                );
            } else {
                w.open(url, "_blank");
            }
        },
        hasWebIntentPlugin: function() {
            return w.plugins !== undefined &&
                    w.plugins.webintent !== undefined;
        }
    };
    w.WebHelper = WebHelper;
})(window);
