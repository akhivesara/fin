SCC = {
    keyboard: {
        UP: 38,
        DOWN: 40,
        DEL: 46,
        TAB: 9,
        RETURN: 13,
        ESC: 27,
        COMMA: 188,
        PAGEUP: 33,
        PAGEDOWN: 34,
        BACKSPACE: 8,
        CTRL: 224,
        SPACE: 32,
        LEFTARROW: 37,
        UPARROW: 38,
        RIGHTARROW: 39,
        DOWNARROW: 40
    },

    util: {
        getTopZIndex: function(selector) {
            var $container = $(selector);
            var level = 0;
            $container.children().each(function(){
                var zDepth = parseInt($(this).css('z-index'));
                if (zDepth >= level){
                    level = zDepth;
                }
            });
            return level;
        }
    },

    cookie:{
        // Max cookie length is 4,096 characters (4 KB)
        // Maximum number of cookies per domain is 20 (many browsers allow more)
        write: function(name, value, maxAge) {
            if(maxAge){
                // persistent cookie (maxAge is days)
                var now = new Date();
                var expires = new Date(now.getTime() + maxAge * 24 * 60 * 60 * 1000);
                document.cookie = name + '=' + encodeURIComponent(value) + "; expires=" + expires.toGMTString();
            } else {
                // session cookie
                document.cookie = name + '=' + encodeURIComponent(value);
            }
        },
        read: function(name) {
            var value = document.cookie.match('(?:^|;)\\s*' + name.escapeRegExp() + '=([^;]*)');
            return (value) ? decodeURIComponent(value[1]) : null;
        },
        dispose: function(name) {
            document.cookie = name + "=; expires=Thu, 01-Jan-1970 00:00:01 GMT";
        }
    }

};



<!-- ============== TEXT SIZING WIDGET ============== -->

(function activateChangeTextSize() {
    try {
        var check = $("body:first");
        if (check.hasClass('scc-sc2')){
            return;
        }
        
        if (($("#scc-font-toggle").length > 0) && (!$("#scc-font-toggle").hasClass("hidden"))) {
            return;
        }
        
        if ($("#scc-font-toggle").length == 0) {
            var base = $("#beta-inner");
            if (base.length == 0) base = $("#alpha-inner");
            if (base.length > 0 && !check.hasClass('scc-mmadmin')) {
                base.prepend('<div id="scc-font-toggle" class="scc-font-toggle hidden"></div>');
            }
        }
        $("#scc-font-toggle").removeClass("hidden");
        $("#scc-font-toggle").append("<span>Font&nbsp;Size:</span>&nbsp;" +
            "<a href=\"#\" onclick=\"changeTextSize(-1);return false;\">&nbsp;-&nbsp;</a>&nbsp;" +
            "<a href=\"#\" onclick=\"changeTextSize(1);return false;\">&nbsp;+&nbsp;</a>&nbsp;" +
            "<a href=\"#\" onclick=\"changeTextSize('reset');return false;\">reset</a>");
        //existing preference:
        var match = (document.cookie+"").match(/sccPrefs=([^\;]+)/);
        if (match) {
            var oldPrefs = decodeURIComponent(match[1]);
            match = (oldPrefs).match(/(^|\|)font=(\-?[\d]+)\|/);
            if (match) {
                var fontSize = parseInt(match[2]);
                var isNegative = (fontSize<0);
                for (var i=0; i < Math.abs(fontSize); i++){
                    changeTextSize(isNegative?-1:1, false);
                }
            }
        }
    } catch(e) {}
})();

function changeTextSize(changeSize,setCookie) {
    if (typeof(setCookie) == "undefined") setCookie = true;
    var parent = $("#alpha");
    var base = $("#alpha-inner");
    if (!base) return;
    if (changeSize == "reset")  {
        base.css("font-size", "");
    } else {
        changeSize = parseInt(changeSize);
        var parentSize = parent.css("font-size");
        var currentSize = base.css("font-size");
        if (parentSize == currentSize) currentSize = "100%";
        if (currentSize == "") currentSize = "100%";
        if (/^[\d\.]+(em|px)$/.test(parentSize) && /^[\d\.]+(em|px)$/.test(currentSize)
            && parentSize.substr(-2) == currentSize.substr(-2)) {
            var temp = 100 * (parseFloat(currentSize) / parseFloat(parentSize));
            if (temp && !isNaN(temp)) currentSize = temp + "%";
        }
        if (!/^[\d\.]+\%$/.test(currentSize)) currentSize=_ieLastTextSize;
        if ((currentSize == "300%" && changeSize > 0) || (currentSize == "30%" && changeSize < 0)) return;
        var nextTextSize = parseInt(currentSize) + ((changeSize > 0) ? 10 : -10) + "%";
        base.css("font-size", nextTextSize);
        _ieLastTextSize = nextTextSize;
    }

    //save preference:
    if (setCookie) {
        var oldPrefs = "";
        var fontSize = (changeSize == "reset") ? "" : changeSize;
        var match = (document.cookie+"").match(/sccPrefs=([^\;]+)/);
        if (fontSize && match) {
            oldPrefs = decodeURIComponent(match[1]);
            match = (oldPrefs).match(/(^|\|)font=(\-?[\d]+)\|/);
            if (match) {
                fontSize = parseInt(match[2]);
                fontSize += changeSize;
            }
        }
        document.cookie = "sccPrefs=;expires=Thu, 01-Jan-1970 00:00:01 GMT;path=/";//delete old domain
        oldPrefs = "font=" + fontSize + "|" + oldPrefs.replace(/font=[^\|]*\|/ig, "");
        var expires = new Date((new Date()).getFullYear()+5, 1, 1);
        document.cookie = "sccPrefs=" + encodeURIComponent(oldPrefs) + ";expires=" + expires.toGMTString() + ";path=/;domain=.stockcharts.com";
    }
}

// this is used for the main search box at the top of almost every page
function chartSearch(prefix) {
    var field = document.getElementById(prefix + "text"); // the input field
    var opts = document.getElementById(prefix + "options"); // the select dropdown
    if (!field || !opts ||!field.value || /^\s*$/.test(field.value)){
        return false;
    }

    var urls = ["//stockcharts.com/h-sc/ui?s=",
    "//stockcharts.com/def/servlet/SC.pnf?c=",
    "//stockcharts.com/freecharts/candleglance.html?",
    "//stockcharts.com/freecharts/perf.html?",
    "//stockcharts.com/freecharts/gallery.html?",
    "//stockcharts.com/symsearch?",
    "//stockcharts.com/search?q="];

    if (opts.selectedIndex < urls.length) {
        var url = urls[opts.selectedIndex];
        if(opts.selectedIndex==0 && field.value.indexOf(",")!=-1) {
           url = url.replace("h-sc","h-perf"); // redirect to the perf workbench when we have multiple symbols
        }
        url += encodeURIComponent(field.value);
        if (opts.selectedIndex == 1) {
           url += ",P";
        }
        if (typeof(self) != "undefined" && typeof(top) != "undefined" && self != top) {
            parent.location = url;
        } else {
            window.location = url;
        }
    }
    return false;
}
