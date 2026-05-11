var bcMarketing = function () {
    function _runNextOnTimeout(func, next, timeout) {
        var nextCalled = false;
        var nextWrapper = function () {
            if (nextCalled !== false) {
                return;
            }
            nextCalled = true;
            next();
        };
        var timeoutHandle = setTimeout(nextWrapper, timeout);
        var callback = function () {
            clearTimeout(timeoutHandle);
            nextWrapper();
        };
        func(callback);
    }
    function _pushGtmEvent(gtmEvent) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(gtmEvent);
    }
    function _pushGtmEventWithTimeout(gtmEvent, next, timeout) {
        var func = function (callback) {
            gtmEvent['eventCallback'] = callback;
            _pushGtmEvent(gtmEvent);
        };
        _runNextOnTimeout(func, next, timeout);
    }
    return {
        pushGtmEvent: function (gtmEvent, next, timeout) {
            if (!next || !timeout) {
                _pushGtmEvent(gtmEvent);
                return;
            }
            _pushGtmEventWithTimeout(gtmEvent, next, timeout);
        }
    };
}();
//# sourceMappingURL=bc.marketing.js.map