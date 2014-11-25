"use strict";
(function(w) {
    w.Drawing = w.Drawing || {};
    var ArrowBuilder = function(options) {
        this._options = $.extend({
            color: "WindowText",
            size: 10,
            orient: "n"
        }, options);
    };
    ArrowBuilder.prototype = {
        get headStyle() {
            return $.extend(this.partStyle, {
                borderWidth: this.sizePx,
                borderBottomColor: "transparent",
                borderRightColor: "transparent",
                borderRadius: "2px",
                width: this.doubleSizePx,
                height: this.doubleSizePx,
                transform: "rotate(45deg)",
                marginLeft: this.sizePx,
                marginTop: this.sizePx
            });
        },
        get bodyStyle() {
            return $.extend(this.partStyle, {
                borderWidth: this.halfSizePx,
                height: this.doubleSizePx,
                marginLeft: this.oneAndHalfSizePx,
                marginTop: "-" + this.doubleSizePx,
                position: "absolute"
            });
        },
        get partStyle() {
            return {
                borderColor: this._options.color,
                borderStyle: "solid",
                display: "inline-block"
            };
        },
        get size() {
            return 10;
        },
        get sizePx() {
            if (this._sizePx === undefined) {
                this._sizePx = this.size + "px";
            }
            return this._sizePx;
        },
        get doubleSizePx() {
            if (this._doubleSizePx === undefined) {
                this._doubleSizePx = (2 * this.size) + "px";
            }
            return this._doubleSizePx;
        },
        get halfSizePx() {
            if (this._halfSizePx === undefined) {
                this._halfSizePx = parseInt(this.size / 2) + "px";
            }
            return this._halfSizePx;
        },
        get oneAndHalfSizePx() {
            if (this._oneAndHalfSizePx === undefined) {
                this._oneAndHalfSizePx = parseInt(this.size * 1.5) + "px";
            }
            return this._oneAndHalfSizePx;
        },
        get zoomForSize() {
            var requiredSize = parseInt(this._options.size);
            if (isNaN(requiredSize) || (requiredSize < 1)) {
                requiredSize = size;
            }
            return requiredSize / this.size;
        },
        get rotationForOrientation() {
            var orient = this._options.orient || "n";
            switch (orient) {
                case "n": return 0;
                case "nw": return -45;
                case "w": return -90;
                case "sw": return -135;
                case "s": return -180;
                case "se": return 135;
                case "e": return 90;
                case "ne": return 45;
            }
            return 0;
        },
        get containerStyle() {
            return {
                display: "inline-block",
                marginLeft: "10px",
                marginTop: "10px",
                paddingRight: "10px",
                paddingBottom: "10px",
                zoom: this.zoomForSize,
                transform: "rotate(" + this.rotationForOrientation + "deg)"
            }
        },
        build: function() {
            var container = $("<div></div>");
            container.addClass("arrow");
            container.css(this.containerStyle);
            var head = $("<div></div>");
            head.css(this.headStyle);
            var body = $("<div></div>");
            body.css(this.bodyStyle);
            var divider = $("<div></div>");
            divider.css("display", "block");
            container.append([head, divider, body]);
            return container;
        },
    };

    var RefreshBuilder = function(options) {
        this._options = $.extend({
            size: 25,
            color: "WindowText"
        }, options);
    };
    RefreshBuilder.prototype = {
        get color() {
            if (this._color === undefined) {
                this._color = this._options.color || "WindowText"
            }
            return this._color;
        },
        get bodyStyle() {
            return {
                borderStyle: "solid",
                borderTopColor: "transparent",
                borderLeftColor: this.color,
                borderRightColor: this.color,
                borderBottomColor: this.color,
                borderWidth: "5px",
                display: "inline-block",
                width: "25px",
                height: "25px",
                borderRadius: "100%",
            };
        },
        get arrowStyle() {
            return {
                borderStyle: "solid",
                borderLeftColor: this.color,
                borderTopColor: this.color,
                borderBottomColor: "transparent",
                borderRightColor: "transparent",
                transform: "rotate(90deg)",
                marginTop: "-3px",
                marginLeft: "-6px",
                borderWidth: "5px",
                width: "10px",
                height: "10px"
            };
        },
        get containerStyle() {
            return {
                padding: "10px",
                marginTop: "10px",
                zoom: this.zoom,
                display: "inline-block"
            };
        },
        get zoom() {
            var size = parseInt(this._options.size);
            if (isNaN(size) || (size < 1)) {
                size = 25;
            }
            return size / 25;
        },
        build: function() {
            var container = $("<div></div>");
            container.addClass("refresh-icon");
            container.css(this.containerStyle)
            var body = $("<div></div>");
            body.css(this.bodyStyle);
            var arrow = $("<div></div>");
            arrow.css(this.arrowStyle);
            body.append(arrow);
            container.append(body);
            return container;
        }
    };

    w.Drawing.buildArrow = function(options) {
        var builder = new ArrowBuilder(options);
        return builder.build();
    };
    w.Drawing.buildRefresh = function(options) {
        var builder = new RefreshBuilder(options);
        return builder.build();
    };
    w.Drawing.rotate = function(item, deg, timeInSeconds) {
        //$(item).animate({transform: "rotate(" + deg + "deg)" }, time || 500);
        timeInSeconds = (timeInSeconds === undefined) ? 0 : timeInSeconds;
        var rot = function() {
            $(item).css("transform", "rotate(" + deg + "deg)");
        }
        if (timeInSeconds > 0) {
            $(item).css("transition", timeInSeconds + "s linear");
            rot();
            window.setTimeout(function() {
                $(item).css("transition", "");
            }, timeInSeconds * 1000);
        } else {
            rot();
        }
    };
})(window);
(function($) {
    var defaults = {
        color: "WindowText"
    };
    $.fn.pullToRefresh = function(options) {
        options = $.extend(defaults, options);
        var target = this;
        var wrapper = $("<div class='scrollWrapper'></div>");
        wrapper.insertBefore(target);
        wrapper.append(target);
        var wrapperEl = wrapper.get(0);
        var initialClientRect = wrapperEl.getBoundingClientRect();

        var feedbackEl = null;
        var arrowEl = null;
        var refreshEl = null;
        var expectingRelease = false;
        var lastTouchY = null;
        var emitPull = false;
        var pullDelta = 0;
        var showFeedbackAt = 40;
        var inMultiTouchEvent = false;
        target.on("touchmove", function(ev) {
            if (isMultiTouch(ev)) {
                inMultiTouchEvent = true;
                return;
            }
            var currentClientRect = wrapperEl.getBoundingClientRect();
            if (currentClientRect.top < initialClientRect.top) {
                // scrolling down
                expectingRelease = false;
                return;
            }
            var currentTouchY = ev.originalEvent.changedTouches[0].screenY;
            var delta = currentTouchY - lastTouchY;
            pullDelta += delta;
            if (pullDelta < 0) {
                pullDelta = 0;
            }
            console.log('pullDelta: '+ pullDelta);
            if (pullDelta === 0) {
                lastTouchY = currentTouchY;
                return;
            }
            ev.preventDefault();
            if (feedbackEl === null) {
                feedbackEl = $("<div></div>");
                feedbackEl.insertBefore(target);
                lastTouchY = currentTouchY;
            }
            var currentFeedbackHeight = feedbackEl.height();
            if (currentFeedbackHeight > 40) {
                if (arrowEl === null) {
                    arrowEl = window.Drawing.buildArrow({ color: options.color });
                    feedbackEl.append(arrowEl);
                } else {
                    arrowEl.show();
                }
                var perc = ((100 - currentFeedbackHeight) / 50);
                if (perc > 100) {
                    perc = 100;
                } else if (perc < 0) {
                    perc = 0;
                }
                var rotateBy = perc * -180;
                if (rotateBy < -180) {
                    rotateBy = -180;
                } else if (rotateBy > 0) {
                    rotateBy = 0;
                }
                window.Drawing.rotate(arrowEl, rotateBy);
            } else {
                if (arrowEl) {
                    arrowEl.hide();
                    window.Drawing.rotate(arrowEl, -180);
                }
            }
            if (currentFeedbackHeight < 100) {
                feedbackEl.height(currentFeedbackHeight + delta);
            } else {
                if (refreshEl == null) {
                    refreshEl = window.Drawing.buildRefresh({color: options.color});
                    feedbackEl.append(refreshEl);
                }
                emitPull = true;
            }
            lastTouchY = currentTouchY;
        });
        function isMultiTouch(ev) {
            var result = ev.originalEvent.changedTouches.length > 1;
            return result;
        }
        target.on("touchstart", function(ev) {
            if (isMultiTouch(ev)) {
                inMultiTouchEvent = true;
                return;
            }
            inMultiTouchEvent = false;
            pullDelta = 0;
            lastTouchY = ev.originalEvent.changedTouches[0].screenY;
            emitPull = false;
        });
        target.on("touchend", function(ev) {
            if (isMultiTouch(ev) || inMultiTouchEvent) {
                return;
            }
            lastTouchY = null;
            if (feedbackEl === null) {
                return;
            }
            if (refreshEl) {
                refreshEl.animate({opacity: "0"}, 300);
            }
            if (arrowEl) {
                arrowEl.animate({opacity: "0"}, 300);
            }
            feedbackEl.animate({height: 0}, 300, null, function() {
                if (arrowEl) {
                    arrowEl.remove();
                }
                arrowEl = null;
                if (refreshEl) {
                    refreshEl.remove();
                }
                refreshEl = null;
                feedbackEl.remove();
                feedbackEl = null;
                if (emitPull) {
                    target.trigger("pulled");
                }
            });
        });
        return target;
    };
})(jQuery);

