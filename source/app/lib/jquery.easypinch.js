'use strict';
(function() {
    function PinchPos(x1, y1, x2, y2) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
    };
    $.fn.easypinch = function() {
        var target = this;
        function possiblePinch(ev) {
            var result = ev.originalEvent.touches.length === 2;
            console.log("is possible pinch: " + result);
            return result;
        }
        var pinchHistory = [];
        function square(num) {
            return num * num;
        }
        function emitLastPinch() {
            if (pinchHistory.length < 2) {
                return;
            }
            console.log(pinchHistory);
            var last = pinchHistory[pinchHistory.length-1];
            var prev = pinchHistory[pinchHistory.length-2];
            var lastGap = Math.sqrt(square(last.x1 - last.x2) + square(last.y1 - last.y2));
            var prevGap = Math.sqrt(square(prev.x1 - prev.x2) + square(prev.y1 - prev.y2));
            var delta = lastGap - prevGap;
            var deltaPerc = delta / prevGap;
            console.log('pinch: ' + deltaPerc);
            return false;
        }
        target.on('touchmove', function(ev) {
            console.log(ev);
            if (!possiblePinch(ev)) {
                pinchHistory = [];
                return;
            }
            var touches = ev.originalEvent.touches;
            console.log(touches);
            pinchHistory.push(new PinchPos(touches[0].screenX,
                                           touches[0].screenY,
                                           touches[1].screenX,
                                           touches[1].screenY));
            emitLastPinch();
        });
        target.on('touchend', function(ev) {
            var result = emitLastPinch();
            pinchHistory = [];
            return result;
        });
    };
})();
