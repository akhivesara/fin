SCC.AutoSuggest = function(selector, args) {
    this.init(selector, args);
};

SCC.AutoSuggest.prototype = {
    init: function(selector, args) {
        // the purpose of this plugin is to automatically fill an input field
        // the selector should point to the pertinent input field on the page
        // it can also point to a form element, if so, we will use the first input field in the form

        this.$searchbox = $(selector);

        if(this.$searchbox.is("form")) {
            this.$searchbox = this.$searchbox.children("input[type=text]").first();
        }
        if(!this.$searchbox.is("input")){
            return;
        }

        this.opts = $.extend({
            inputText  : "Enter Company Name or Symbol",
            maxResults : 10
        }, args || {});
        
        this.companyServer = "//stockcharts.com/j-ci/ci";
        this.timerId         = 0;
        this.isReturnKeyDown = false;
        this.isExpandDown    = true;
        this.isExpandRight   = true;
        this.cache           = {}; // a cache for search results
        this.lastTyped       = ""; // the most recently typed characters

        var that = this;

        // initialize the search box
        this.$searchbox.attr({
            autocomplete: "off"
        }).css({
            fontStyle: this.opts.inputText.length>0 ? "italic" : "normal",
            color:  this.opts.inputText.length>0 ? "#aaaaaa" : "#000000"
        }).focus(function() {
            // erase default text when search box gains focus
            if ($(this).val() == that.opts.inputText) {
                $(this).val("")
            }
            $(this).css({
                fontStyle: "normal",
                color: "#000000"
            });
        }).blur(function() {
            // hide the suggestion box when the search box loses focus, we must delay this
            // slightly, because it could conflict with a click event in the suggestion box
            setTimeout(function(){
                that.destroySuggestions();
            }, 500);
			myTable.fillTickerSlot($(this).val());
			// Fill up the table?

        }).keydown(function(event){
            // submit when return key is pressed
            if (event.keyCode === SCC.keyboard.RETURN && !that.isReturnKeyDown) {
                that.isReturnKeyDown = true;

                var searchQuery = $.trim( that.$searchbox.val().toLowerCase() );

                if (searchQuery.length > 0) {
                    var isShowMore = $(this).children().hasClass("more");
                    that.destroySuggestions();
                    if (isShowMore) {
                        event.preventDefault();
                        that.refreshPage( "//stockcharts.com/symsearch?" + searchQuery);
                    }
                }
            }
        }).keyup(function(event){
            var searchQuery = $.trim( $(this).val().toLowerCase() );

            var lastChar    = searchQuery.charAt(searchQuery.length-1);
            var isDownArrow = (event.keyCode == SCC.keyboard.DOWN);
            var isUpArrow   = (event.keyCode == SCC.keyboard.UP);
            var isReturn    = (event.keyCode == SCC.keyboard.RETURN);
            var isComma     = (event.keyCode == SCC.keyboard.COMMA) || (lastChar == ',');
            var isSpace     = (event.keyCode == SCC.keyboard.SPACE) || (lastChar == ' ');
            var isColon     = (lastChar == ':');

            if (isDownArrow) {
                that.next();
            } else if (isUpArrow) {
                that.prev();
            } else if (isReturn){
                that.isReturnKeyDown = false;
            } else if(isComma || isSpace || isColon) {
                // don't refresh the suggestions
                that.lastTyped = $(this).val();
            } else if (searchQuery.length > 0) {
                that.lastTyped = $(this).val();
                // pause slightly before we try to retrieve suggestions, this is to prevent fast typists
                // from retrieving intermediate suggestions that will never be seen
                clearTimeout(that.timerId);
                that.timerId = setTimeout(function() {
                    that.refreshSuggestions();
                }, 250);
            } else {
                // empty search query
                that.lastTyped = "";
                that.destroySuggestions();
            }
        }).val(this.opts.inputText);

        // the suggestion box is initially null, we will create it when needed and remove it from the document when hidden
        this.$suggestionbox = null;

        // reposition the suggestion box when the browser is resized, to keep it aligned with search box
        $(window).resize(function() {
            that.positionSuggestions();
        });
    },

    refreshPage: function(url){
        var inFrameset = typeof(self) != "undefined" && typeof(top) != "undefined" && self != top;
        if(inFrameset){
            parent.location = url;
        }else{
            window.location = url;
        }
    },
  
    refreshSuggestions: function() {
        var that = this;
        var searchQuery = $.trim( this.$searchbox.val().toLowerCase() );
        // if we have a comma delimited list or a ratio symbol, just use
        // the characters after the final comma (or colon)
        var iComma = searchQuery.lastIndexOf(",");
        var iColon = searchQuery.lastIndexOf(":");
        var hasComma = iComma != -1 && iComma > iColon;
        var hasColon = iColon != -1 && iColon > iComma;
        if (hasComma) {
            searchQuery = $.trim( searchQuery.substring(iComma + 1) );
        } else if (hasColon) {
            searchQuery = $.trim( searchQuery.substring(iColon + 1) );
        }

        if (this.cache[searchQuery]) {
            // we've found the results in the cache
            var json = this.cache[searchQuery];
            this.showSuggestions(searchQuery, json);
        } else {
            // retrieve the suggested results as a json object
            // this uses jsonp to enable cross-browser ajax calls
			//JSONP.get('http://stockcharts.com/j-ci/ci', {suggest : suggested , limit :10} , function(data) { console.log(data) ; showSuggestions(suggested,data)})

            $.getJSON('http://stockcharts.com/j-ci/ci' +"?callback=?", {
                suggest: searchQuery,
                limit: this.opts.maxResults
            }, function(json) {
                if (typeof json === "object" && json.companies && json.companies.length > 0) {
                    // we have a json object with an array of company info, cache it, and display suggestions
                    that.cache[searchQuery] = json;
                    that.showSuggestions(searchQuery, json);
                } else {
                    // couldn't retrieve any suggestions
                    that.destroySuggestions();
                }
            });
        }
    },

    showSuggestions: function(searchQuery, json) {
        var that = this;
        // convert the json to an html table of suggestions
        var markup = "<table class='suggestions' cellspacing='0' cellpadding='2'>";
        if (json.companies && json.companies.length > 0) {
            // convert the json object to a simple table containing symbol, name, and exchange
            
			/*
			if (json.companies.length == this.opts.maxResults && !this.isExpandDown){
			                markup += "<tr class='suggestion'><td class='more' colspan='3'>More Results For \"" + searchQuery.toUpperCase() + "\" ...</td></tr>";
			}*/
			
            for (var i=0; i < json.companies.length; i++) {
                var index = (this.isExpandDown) ? i : json.companies.length - 1 - i;
                var symbol = json.companies[index].symbol;
                var name = json.companies[index].name;
                var exchange = json.companies[index].exchange;
                markup += "<tr class='suggestion'>";
                markup += "<td class='symbol'>" + this.hilite(symbol, searchQuery) + "</td>";
                markup += "<td class='company'>" + this.hilite(name, searchQuery) + "</td>";
                markup += "<td class='exchange' align='right'>" + exchange + "</td>";
                markup += "</tr>";
            }
/*
            if (json.companies.length == this.opts.maxResults && this.isExpandDown) {
                markup += "<tr class='suggestion'><td class='more' colspan='3'>More Results For \"" + searchQuery.toUpperCase() + "\" ...</td></tr>";
            }
*/

        } else {
            this.destroySuggestions();
            return;
        }
        markup += "</table>";

        // fill the suggestions div with this table
        if (this.$suggestionbox == null) {
            // if the suggestion box doesn't exist, create it on-the-fly
            this.initSuggestions(markup);
        } else {
            this.$suggestionbox.html(markup);
            // nullify any width previously given to the suggestion box (let the table have as much width as it needs)
            this.$suggestionbox.css('width','');
        }

        $('.suggestion', this.$suggestionbox).hover(function() {
            $(this).addClass('hovered');
        },function(){
            $(this).removeClass('hovered');
        }).click(function(event) {
            $(this).addClass("selected").removeClass("hovered").siblings().removeClass("selected");
            that.fillSearchBox();

            var searchQuery = $.trim( that.$searchbox.val().toLowerCase() );

            if (searchQuery.length > 0) {
                var isShowMore = $(this).children().hasClass("more");
                that.destroySuggestions();
                if (isShowMore) {
                    event.preventDefault();
                    that.refreshPage( "//stockcharts.com/symsearch?" + searchQuery);
                } else {
                    var $form = that.$searchbox.parent("form");
                    if($form.size()>0){
                        var formElem = $form.get(0);
                        if(typeof formElem.onsubmit == "function"){
                            formElem.onsubmit();
                        }
                    }
                }
            }

        });

        $('.suggestion:even', this.$suggestionbox).addClass('even');
        $('.suggestion:odd', this.$suggestionbox).addClass('odd');

        // if the suggestion box turns out to be smaller than the search box, make their widths equal
        var wSuggesions = this.$suggestionbox.width();
        var wInput = this.$searchbox.outerWidth();

        if (wSuggesions < wInput) {
            this.$suggestionbox.width(wInput);
            $('table', this.$suggestionbox).width(wInput);
        }

        this.hideApplet();
    },

    initSuggestions: function(markup) {
        // add the suggestion box to the document
        this.$suggestionbox = $("<div>").addClass('autosuggest').html(markup).css({
            position: "absolute",
            zIndex: SCC.util.getTopZIndex(document.body) + 1
        }).appendTo(document.body);
        this.positionSuggestions();
    },

    positionSuggestions: function(){
        if (this.$suggestionbox == null) {
            return;
        }
        // position relative to window
        var xInput = this.$searchbox.offset().left;
        var yInput = this.$searchbox.offset().top;
        var hInput = this.$searchbox.outerHeight();
        var wInput = this.$searchbox.outerWidth();
        // window dimensions
        var hWindow = $(window).height();
        var wWindow = $(window).width();
        // dimensions for suggestions
        var hSuggestions = this.$suggestionbox.outerHeight();
        var wSuggestions = this.$suggestionbox.outerWidth();

        // can we drop down
        this.isExpandDown = (hWindow - hInput - yInput) > hSuggestions || yInput < hSuggestions;
        // can we expand right
        this.isExpandRight = (wWindow - wInput - xInput) > wSuggestions || xInput < wSuggestions;

        if (this.isExpandDown) {
            this.$suggestionbox.css({
                top: yInput + hInput,
                bottom: ""
            });
        } else {
            this.$suggestionbox.css({
                top: "",
                bottom: hWindow - yInput
            });
        }

        if(this.isExpandRight) {
            this.$suggestionbox.css({
                left:  xInput,
                right:""
            });
        } else {
            this.$suggestionbox.css({
                right: wWindow - wInput - xInput,
                left: ""
            });
        }
    },

    destroySuggestions: function() {
        if (this.$suggestionbox != null) {
            this.$suggestionbox.remove();
            this.$suggestionbox = null;
            this.showApplet();
        }
    },

    hilite: function(fullstring, substring) {
        var index;
        if (substring.indexOf(" ")!=-1) {
            index = fullstring.toLowerCase().indexOf(substring.toLowerCase());
            if (index!=-1) {
                fullstring = fullstring.substring(0, index) + "<b>" + fullstring.substring(index, index+substring.length) +"</b>" + fullstring.substring(index+substring.length);
            }
            return fullstring;
        } else {
            var tokens = fullstring.split(/\s+/);
            for (var i=0; i<tokens.length; i++) {
                index = tokens[i].toLowerCase().indexOf(substring.toLowerCase());
                if (index!=-1) {
                    tokens[i] = tokens[i].substring(0, index) + "<b>" + tokens[i].substring(index, index+substring.length) +"</b>" + tokens[i].substring(index+substring.length);
                }
            }
            return tokens.join(" ");
        }
    },

    isOverlap: function($elem1, $elem2) {
        // determine if two elements overlap eachother
        // x and y values are relative to window
        var x1 = $elem1.offset().left;
        var y1 = $elem1.offset().top;
        var w1 = $elem1.outerWidth();
        var h1 = $elem1.outerHeight();
        var x2 = $elem2.offset().left;
        var y2 = $elem2.offset().top;
        var w2 = $elem2.outerWidth();
        var h2 = $elem2.outerHeight();
        var intersectH = x1+w1 > x2 && x1 < x2+w2;
        var intersectV = y1+h1 > y2 && y1 < y2+h2;
        return intersectH && intersectV;
    },

    hideApplet: function() {
        var that = this;
        // if their are applets on the page, we must temporarily move them
        // offscreen, otherwise they will obscure the suggestion box
        var $applets = $('object, applet, #testdiv');
        if ($applets.size() === 0) {
            return;
        }
        $applets.each(function() {
            var $applet = $(this);
            var $suggestions = that.$suggestionbox;
            var isOverlap = that.isOverlap($suggestions, $applet);
            if (isOverlap) {
                $applet.css({
                    position: "relative",
                    left: -999
                });
            }
        });
    },

    showApplet: function() {
        // if we have moved applets offscreen, return them to their original position
        var $applets= $('object, applet, #testdiv');
        if ($applets.size()===0) {
            return;
        }
        $applets.each(function() {
            var $applet = $(this);
            if ($applet.position().left == -999) {
                $applet.css({
                    position: "",
                    left: 0
                });
            }
        });
    },

    next: function() {
        var $selected = $('.suggestion.selected', this.$suggestionbox);
        if ($selected.size() > 0) {
            $selected.removeClass('selected');
            $selected.next().addClass('selected');
        } else {
            $('.suggestion:first', this.$suggestionbox).addClass('selected');
        }
        this.fillSearchBox();
    },

    prev: function() {
        var $selected = $('.suggestion.selected', this.$suggestionbox);
        if ($selected.size() > 0) {
            $selected.removeClass('selected');
            $selected.prev().addClass('selected');
        } else {
            $('.suggestion:last', this.$suggestionbox).addClass('selected');
        }
        this.fillSearchBox();
    },

    fillSearchBox: function(){
        // get the selected suggestion
        var $selected = $('.suggestion.selected', this.$suggestionbox);
        if ($selected.size() > 0) {
            // extract the ticker symbol from the selected suggestion
            var $symbol = $('.symbol', $selected);
            if($symbol.size() > 0) {
                var searchQuery = $.trim( this.$searchbox.val() );
                var iComma = searchQuery.lastIndexOf(",");
                var iColon = searchQuery.lastIndexOf(":");
                var hasComma = iComma != -1 && iComma > iColon;
                var hasColon = iColon != -1 && iColon > iComma;
                var symbols;
                if (hasComma) {
                    // if we are a comma delimited list, append the new symbol
                    symbols = searchQuery.split(",");
                    symbols.pop();
                    symbols.push($symbol.text());
                    this.$searchbox.val(symbols.join(","));
                } else if (hasColon) {
                    // if we are a ratio symbol, append the new symbol
                    symbols = searchQuery.split(":");
                    symbols.pop();
                    symbols.push($symbol.text());
                    this.$searchbox.val(symbols.join(":"));
                } else {
                    // otherwise just replace the search contents with the selected symbol
                    this.$searchbox.val($symbol.text());
					myTable.fillTickerSlot($symbol.text());
                }
            } else {
                this.$searchbox.val(this.lastTyped);
				myTable.fillTickerSlot(this.lastTyped);
            }
        } else {
            this.$searchbox.val(this.lastTyped);
			myTable.fillTickerSlot(this.lastTyped);
        }
    }
};

// jquery plugin

document.addEventListener('DOMContentLoaded', function() {
	Y.autoSuggest  =new SCC.AutoSuggest('#ticker input');
    var ticker = urlParams.get('s');
    if (ticker) {
        Y.autoSuggest.$searchbox.val(ticker);
        Y.autoSuggest.$searchbox.focus();
        Y.autoSuggest.$searchbox.keyup({});
        setTimeout(function() {
        Y.autoSuggest.$searchbox.blur();
        },1000)
    }
//	myTable.create();
}, false);

/*
(function($){



    $.fn.autosuggest = function(args) {
        // in this scope, "this" refers to the jQuery object (a wrapped set of elements)
        return this.each(function(){
            // now "this" refers to individual dom elements
            new SCC.AutoSuggest(this, args);
        });
    };

})(jQuery);
*/

