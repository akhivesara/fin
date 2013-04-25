var myTable = (function() {

	var	_table = null ,
		_data = [
	    ["", "Ticker", "Industry" , "Target"],
	    ["", "", ""],
	    ["P/E", "", "" , "low"],
	    ["E/Y", "" , "" , ">= 3.06%"], //(150% of 10Y T-bond)
	    ["PEG", "" , "" , "0.5-1"],
	    ["P/S", "" , "" , "<=2"],
	    ["ROE", "" , "" , ">17%"],
		["Dividend", "" , "" , ""],
		["Payout Ratio", "" , "" , ""],
        ["Dividend Date" , "" , "", ""],
		["Market Cap", "" , "" , ""],
        ["% Short", "" , "" , ""],
        ["Change % Short", "" , "" , ""]

	  ];
	
	var TEN_YR_BOND = '2.04';
		
	return {
		
		current : {},
		
		clear : function() {
			var rows = $("#evaluationTable").handsontable('countRows') , 
				cols = $("#evaluationTable").handsontable('countCols') ,
				r = 0 , c = 0;
			for (; r < rows;r++) {
				for (c=0;c < cols ; c++) {
					this.fillBackgroundColor(r,c,'');
					//$("#evaluationTable").handsontable('getCell',i,c).style['background-color'] = '';
				}
			}			
			this.create([
		    ["", "Ticker", "Industry" , "Target"],
		    ["", "", ""],
		    ["P/E", "", "" , "low"],
		    ["E/Y", "" , "" , ">= 3.06%"], //(150% of 10Y T-bond)
                ["PEG", "" , "" , "0.5-1"],
		    ["P/S", "" , "" , "<=2"],
		    ["ROE", "" , "" , ">17%"],
			["Dividend", "" , "" , ""],
			["Payout Ratio", "" , "" , ""],
            ["Dividend Date" , "" , "", ""],
			["Market Cap", "" , "" , ""],
            ["% Short", "" , "" , ""],
            ["Change % Short", "" , "" , ""]

            ]);
		},
		
		create : function(data) {
		  _table = $("#evaluationTable").handsontable({
		    data: data || _data,
		    startRows: 10,
		    startCols: 4
		  });
		// scrapper calls
		},
		
		fillBackgroundColor : function(row,col,color) {
			$("#evaluationTable").handsontable('getCell',row,col).style['background-color'] = color;	
		},
		
		fillSlot : function(row,col,value) {
			$("#evaluationTable").handsontable('setDataAtCell', row, col, value);			
		},
		
		fillTickerSlot : function(ticker) {
			var that = this;
			this.clear();
			this.fillSlot(0,1,ticker.toUpperCase());
			//$("#evaluationTable").handsontable('setDataAtCell', 2, 2, ticker);
			this.scrapeYahoo(ticker);
			this.scrapeIndustryLink();
			this.scrapeTickerPrice();			
			setTimeout(function() {
				that.applyCellColor();				
				that.scrapeEstimates();				
			},2500);
			$('#past_future_target').text('');
			if ($('.news')) {
				$('.news').text('');
			}
			this.scrapeNews();
		},
		
		applyCellColor : function() {
			var pe_s = $("#evaluationTable").handsontable('getDataAtCell', 2 , 1 );
			var pe_i = $("#evaluationTable").handsontable('getDataAtCell', 2 , 2 );
			if (pe_s && pe_i) {
				if (+pe_s < +pe_i) {
					this.fillBackgroundColor(2,3,'lightgreen');				
				} else {
				this.fillBackgroundColor(2,3,'pink');									
				}
			} else {
				this.fillBackgroundColor(2,3,'');				
			}
			
			console.log('Earnings Yield = '+$("#evaluationTable").handsontable('getDataAtCell', 3 , 1 ));
			
			if (parseInt($("#evaluationTable").handsontable('getDataAtCell', 3 , 1 )) >= (1.5*TEN_YR_BOND)) {
				this.fillBackgroundColor(3,3,'lightgreen');								
			} else {
				this.fillBackgroundColor(3,3,'pink');			
			}

			console.log('PEG = '+$("#evaluationTable").handsontable('getDataAtCell', 4 , 1 ));
			
			if ( $("#evaluationTable").handsontable('getDataAtCell', 4 , 1 ) <= 1 && $("#evaluationTable").handsontable('getDataAtCell', 4 , 1 ) >= 0.5 ) {
				this.fillBackgroundColor(4,3,'lightgreen');								
			} else {
				this.fillBackgroundColor(4,3,'pink');			
			}

			console.log('P/S = '+$("#evaluationTable").handsontable('getDataAtCell', 5 , 1 ));
			
			if ( $("#evaluationTable").handsontable('getDataAtCell', 5 , 1 ) <= 2) {
				this.fillBackgroundColor(5,3,'lightgreen');								
			} else {
				this.fillBackgroundColor(5,3,'pink');			
			}

			console.log('ROE = '+$("#evaluationTable").handsontable('getDataAtCell', 6 , 1 ));
			
			if ( parseInt($("#evaluationTable").handsontable('getDataAtCell', 6 , 1 )) >= '17') {
				this.fillBackgroundColor(6,3,'lightgreen');								
			} else {
				this.fillBackgroundColor(6,3,'pink');			
			}
			if ($("#evaluationTable").handsontable('getDataAtCell', 8 , 1 ) != 'N/A') {
				if ( parseInt($("#evaluationTable").handsontable('getDataAtCell', 8 , 1 )) < '60') {
					this.fillBackgroundColor(8,3,'lightgreen');								
				} else {
					this.fillBackgroundColor(8,3,'pink');						
				}
			}

		},
		
		yqlScrapperCall : function(url , callback , scope) {
			scope = scope || this;
			$.getJSON(url, {}, 
				function(json) {
	            	if (typeof json === "object" && json.query && json.query.results) {
	                	// we have a json object with an array of company info, cache it, and display suggestions
						var results = json.query.results;
	  					console.log('yqlScrapperCall');
						console.log(results);
						callback.call(scope,results);
					}

				}
			);
		},
		
		//key stats//			$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3DTSN%2BKey%2BStatistics%22%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22yfncsumtab%22%5D'&format=json&diagnostics=true", {						
		scrapeYahoo : function(ticker) {
			var that = this;
			ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val());
			/*valuation*/ 						
			$.getJSON("http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22yfnc_datamodoutline1%22%5D'&format=json&diagnostics", {}, 
			  function(json) {
	            if (typeof json === "object" && json.query && json.query.results) {
	                // we have a json object with an array of company info, cache it, and display suggestions
					var results = json.query.results;
	  				console.log(results);
					var data = results.table;
					var valuation = data[0];
					that.current.valuation = valuation;
					that.fillSlot(10,1,that._findValue(valuation.tr.td.table.tr,'Market Cap'));
					that.fillSlot(2,1,that._findValue(valuation.tr.td.table.tr,'Trailing P/E'));
					if (that._findValue(valuation.tr.td.table.tr,'Trailing P/E') != 'N/A') {
						that.fillSlot(3,1,(100*(1/that._findValue(valuation.tr.td.table.tr,'Trailing P/E'))).toFixed(2)+'%');
					}
					that.fillSlot(4,1,that._findValue(valuation.tr.td.table.tr,'PEG'));										
					that.fillSlot(5,1,that._findValue(valuation.tr.td.table.tr,'Price/Sales'));					
					
					var fiscalYear = data[1];
					that.current.fiscalYear = fiscalYear;				
					var profitability = data[2];
					that.current.profitability = profitability;														
					var managementEffectiveness = data[3];
					that.current.managementEffectiveness = managementEffectiveness;																			
					managementEffectiveness.tr.td.table.tr.shift();
					that.fillSlot(6,1,that._findValue(managementEffectiveness.tr.td.table.tr,'Return on Equity'));
					var incomeStatement =  data[4];
					that.current.incomeStatement = incomeStatement;																								
					var balanceSheet =  data[5];					
					that.current.balanceSheet = balanceSheet;																													
					var cashFlowStatement =  data[6];
					that.current.cashFlowStatement = cashFlowStatement;																																		
					var stockPriceHistory = data[7];
					that.current.stockPriceHistory = stockPriceHistory;																																		
					var shareStatistics = data[8];
					that.current.shareStatistics = shareStatistics;
                    that.fillSlot(11,1,that._findValue(shareStatistics.tr.td.table.tr,'Short % of Float', 'td.0.p.content','td.1.p' ));
                    var nowShort = that._findValue(shareStatistics.tr.td.table.tr,'Shares Short (prior month)', 'td.0.p.content','td.1.p' );
                    var lastShort = that._findValue(shareStatistics.tr.td.table.tr,'Shares Short', 'td.0.p.content','td.1.p' );
                    var changeShort = parseFloat(nowShort) - parseFloat(lastShort);
                    if (changeShort != undefined) {
                        that.fillSlot(12,1,changeShort.toFixed(2));
                    }
					var dividendsSplits = data[9];
					that.current.dividendsSplits = dividendsSplits;																																												
					that.fillSlot(7,1,that._findValue(dividendsSplits.tr.td.table.tr,'Forward Annual Dividend Yield', 'td.0.p.content','td.1.p' ));					
					that.fillSlot(8,1,that._findValue(dividendsSplits.tr.td.table.tr,'Payout Ratio', 'td.0.p.content','td.1.p' ));
                    that.fillSlot(9,1,that._findValue(dividendsSplits.tr.td.table.tr,'Dividend Date', 'td.0.p.content','td.1.p' ));
	        	}
			});
		},
		
		_findValue : function(dataTable,entryToLookFor, keySelector,valueSelector) {
			var _table =dataTable ,
				i = 0 , 
				entry , k , v;
			for (;i< _table.length;i++) {
				entry = _table[i];
//			dataTable.tr.td.table.tr.forEach(function(entry) {
				if (keySelector) {
					k = safeLookup(entry,keySelector);
				} else {
					k = entry.td[0].p.content || entry.td[0].p;				
				} 

				if (valueSelector) {
					v = safeLookup(entry , valueSelector);
				} else {
					if (entry.td[1].span) {
						v = entry.td[1].span.content ;
					} else if (entry.td[1].p) {
						v = entry.td[1].p.content || entry.td[1].p;							
					}
				}
				if (v && k && k.indexOf(entryToLookFor)!=-1) {
					return v.replace(',','');
				}					
//			})
			}
		},
							
		scrapeIndustryLink : function() {
			//data.table.tr.td.table.tr.td[0].p[0].a.href		
			var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val());
			var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fin%3Fs%3D"+ticker+"%2BIndustry%22%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22yfncsumtab%22%5D'&format=json&diagnostics=true";
			this.yqlScrapperCall(url,function(results) {
				//debugger;
				console.log(results);
				if (results.table.tr.td.table.tr.td[0].p[0]) {
					this.scrapeIndustryFromYahoo(results.table.tr.td.table.tr.td[0].p[0].a.href);
				} else {
					console.log(results.table.tr.td.table.tr.td[0].p.content);
				}
			});		
		},
	
		scrapeIndustryFromYahoo : function(url , ticker) {
			var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val()) ,
				key = 'td.0.font.content',
				value = 'td.1.font.content' ;
			url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22"+url+"%22%20and%20xpath%3D%22%2Fhtml%2Fbody%2Ftable%2Ftr%2Ftd%2Ftable%5Blast()%5D%2Ftr%2Ftd%5Blast()%5D%22&format=json&diagnostics=true"
			//url = url || "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Fbiz.yahoo.com%2Fic%2F515.html%22%20and%20xpath%3D%22%2Fhtml%2Fbody%2Ftable%2Ftr%2Ftd%2Ftable%5Blast()%5D%2Ftr%2Ftd%5Blast()%5D%22&format=json&diagnostics=true";
			this.yqlScrapperCall(url, function(results) {
				//debugger;
				var t , index ;
				for (var x =0 , len = results.td.table.length ; x < len ; x++) {
					t = results.td.table[x];
					if (safeLookup(t, 'tr.td.font.strong') == 'Industry Statistics') {
						index = x;
						break;
					}
				}
				var data = results.td.table[++index].tr;
				this.current.industry = data;
				console.log(data);				
				this.fillSlot(2,2,this._findValue(data,'Price / Earnings',key,value));
				this.fillSlot(3,2,(100*(1/this._findValue(data,'Price / Earnings',key,value))).toFixed(2)+'%');
				this.fillSlot(6,2,this._findValue(data,'Return on Equity',key,value));											
				this.fillSlot(7,2,this._findValue(data,'Dividend Yield',key,value));	
				this.fillSlot(9,2,this._findValue(data,'Market Capitalization',key,value));										
			});
		},
		
		scrapeTickerPrice : function() {
			var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val()) ;
			$('#quote').text('');											
			$('#change').text('');	
			$('#change').removeClass('down');	
			$('#change').removeClass('up');				
			$('#quote_aft').text('');		
			$('#change_aft').text('');		
			$('#change_aft').removeClass('down');	
			$('#change_aft').removeClass('up');							
							
			var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22yfi_rt_quote_summary_rt_top%22%5D%2Fp'&format=json&diagnostics=true";
			this.yqlScrapperCall(url, function(results) {
				var price , d_change , u_change , price_aft , d_change_aft , u_change_aft , priceElement = $('#price');
				console.log(results);
				this.current.price = results.p.span;
				price = this._findValue(results.p.span,'time_rtq_ticker','class','span.content');
				this.current.quote = price;
				console.log(price);

				$('#quote').text(price);
				d_change = this._findValue(results.p.span,'down_r time_rtq_content','class','span.1.content');
				console.log('d_change = '+d_change);			
				if (d_change != undefined) {
					$('#change').text(d_change);
					$('#change').addClass("down");
				}			
				u_change = this._findValue(results.p.span,'up_g time_rtq_content','class','span.1.content');	
				console.log('u_change = '+u_change);	
				if (u_change != undefined) {
					$('#change').text(u_change);
					$('#change').addClass("up");
				}	
				price_aft = this._findValue(results.p.span,'yfs_rtq_quote','class','span.content');						
				console.log(price_aft);
				$('#quote_aft').text(price_aft);	
				if (price_aft) {
					if (price_aft > price) {
						u_change_aft = (100 * ((price_aft - price)/price)).toFixed(2); 
						console.log('u_change_aft = '+u_change_aft);					
						$('#change_aft').text(u_change_aft+"%");
						$('#change_aft').addClass("up");					
					} else {
						d_change_aft =  (100*((price - price_aft)/price)).toFixed(2); 
						console.log('d_change_aft = '+u_change_aft);										
						$('#change_aft').text(d_change_aft+"%");
						$('#change_aft').addClass("down");										
					}	
				}
			});
		},
		
		scrapeEstimates : function(ticker) {
			var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val()) ;
			$('dirtTargetMethod').text('');
			$('#dirtyTargetMethod2').removeClass('down');						
			$('#dirtyTargetMethod').removeClass('down');						
			
			var quote = this.current.quote;
			var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fae%3Fs%3D"+ticker+"%2BAnalyst%2BEstimates%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22yfnc_tableout1%22%5D'&format=json&diagnostics=true";
			this.yqlScrapperCall(url, function(results) {
				var trends = results.table[3];
				console.log(trends);
				var currentYrEps = trends.tr.td.table.tr[1].td[3].p;
				var nextYrEps = trends.tr.td.table.tr[1].td[4].p;
				console.log('currentYrEps = '+currentYrEps);
				this.current.nextYrEps = nextYrEps;
				console.log('nextYrEps = '+nextYrEps);				
				var epsGrowth = 100*(nextYrEps - currentYrEps)/currentYrEps;
				console.log('espGrowth = '+epsGrowth);
				var dirtyMethodTarget = epsGrowth * nextYrEps;
				console.log('Target Price ='+dirtyMethodTarget);
				var targetPrice = dirtyMethodTarget.toFixed(2);
				var target_p;
				target_p = 100*((targetPrice - quote) / quote);
				$('#dirtyTargetMethod').text(targetPrice +' -> '+target_p.toFixed(2) +'%');
				if (target_p < 0) {
					$('#dirtyTargetMethod').addClass('down');						
				}				
				var pe_ttm = $("#evaluationTable").handsontable('getDataAtCell', 2, 1);
				console.log('pe_ttm = '+pe_ttm);
				
				var targetPrice = (nextYrEps*pe_ttm).toFixed(2);
				var target_p;
				target_p = 100*((targetPrice - quote) / quote)
				
				$('#dirtyTargetMethod2').text(targetPrice +' -> '+target_p.toFixed(2) +'%');
				if (target_p < 0) {
					$('#dirtyTargetMethod2').addClass('down');						
				}
			});
			$('#past_future').val('');						
		},
		
		pastFutureEstimate : function() {
			var pe_history = $('#past_future').val().split('	') ||  $('#past_future').val().split(',');
			var removeIndex = pe_history.indexOf("");
			if (removeIndex != -1) {
				pe_history.splice(removeIndex,1);
			}
			if (pe_history.length) { 
				var quote = this.current.quote;
				var pe_max = Math.max.apply(Math,pe_history);
				var pe_min = Math.min.apply(Math,pe_history);
				var t_max = pe_max * this.current.nextYrEps;
				var t_min = pe_min * this.current.nextYrEps;
				var t_max_p;
				var t_min_p;
				t_max_p = 100*((t_max - quote) / quote)
				t_min_p = 100*((t_min - quote) / quote)
			 	$('#past_future_target').text('('+t_min.toFixed(2)+' - '+t_max.toFixed(2) + ')  -> ('+t_min_p.toFixed(2)+' - '+t_max_p.toFixed(2) +')%');						
			}
		},
		
		scrapeNews : function() {
			var ticker =  $.trim( Y.autoSuggest.$searchbox.val()).toUpperCase() ;
			var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fh%3Fs%3D"+ticker+"%2BHeadlines%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22mod%20yfi_quote_headline%20withsky%22%5D'&format=json&diagnostics=true";
			this.yqlScrapperCall(url, function(results) {
				var olderHeadline = safeLookup(results.div, 'table.tr.0.td.strong.a.href');
				var _on = document.createElement('a');
				_on.href = 'http://finance.yahoo.com'+olderHeadline;
				_on.target = '_blank';
				_on.textContent = 'Older News';
				var headlines = results.div.h3;
				var news = results.div.ul;
				var _n = document.createElement('div');
				_n.className = 'news';
				if (!isArray(headlines)) {
					headlines = [headlines];
					news = [news];
				}
				for (var x=0; x<headlines.length;x++) {
					var div = document.createElement('div');
					var date = headlines[x];
					var h = document.createElement('h4');
					h.textContent = date.span;
					div.appendChild(h);
					var news_date = news[x];
					var ul = document.createElement('ul');
					for (var y=0;y<news_date.li.length;y++) {
						var li = document.createElement('li');
						li.className = 'yfi_quote_headline';
						var a = document.createElement('a');
						a.textContent =  news_date.li[y].a.content;
						a.href = news_date.li[y].a.href;
						a.target= '_blank';
						li.appendChild(a);
						ul.appendChild(li);
					}
					div.appendChild(ul);
					_n.appendChild(div);
					document.body.appendChild(_n);
				}
				_n.appendChild(_on);
			})			
		},
		
		
		open: function(url, handler) {
	        if (this._isOpen) {
	            //util.debug("view.IFrameView.open: overlay view already opened - will not open: " + url);
	            return false;
	        }

	        var iframe = document.createElement("iframe");
	        document.body.appendChild(iframe);
	        iframe.id = "overlay-iframe";
	        iframe.src = url;
	        iframe.focus();
	        window.addEventListener("message", this._close(handler), false);
	        //this._isOpen = true;
	        return true;

	    },

	    _close: function(handler) {
	        var self = this;
	        //N.log('iFrame::_close');
	        return this._closeProxy = function(event) {

	            self._isOpen = false;
	            document.body.removeChild(document.getElementById("overlay-iframe"));
	            window.removeEventListener("message", self._closeProxy);
	            delete self._closeProxy;

	            var data;
	            data = event.data;

	            handler(event, data);
	        }
	    }
	    
		
	}
})();

document.addEventListener('DOMContentLoaded', function() {
	myTable.create();
	var tooltip = $('<div></div>')
	      .text('Your message here')
	      .css({
	            position: 'absolute',
	            display: 'none',
	            border: '1px solid black',
	            background: 'white',
	            color: 'black'
	      });
	tooltip.appendTo($('#price'));
	
	$('#dtm').mouseenter(function(){
	      tooltip
	            .css({
	                  top: parseInt($(this).position().top) - 20,
	                  left: $(this).position().left
	            })
	            .fadeIn('slow')
				.text('EPS Growth * Next Yrs EPS')
				.click(function(){
					tooltip.fadeOut('slow');
				});
				setTimeout(function(){
				      tooltip.fadeOut('slow');
				},5000)
	})
	
	$('#dtm2').mouseenter(function(){
	      tooltip
	            .css({
	                  top: parseInt($(this).position().top) - 20,
	                  left: $(this).position().left
	            })
	            .fadeIn('slow')
				.text('Next Yrs EPS * P/E TTM');
				setTimeout(function(){
				      tooltip.fadeOut('slow');
				},5000)
	})
	
	$('#pf').mouseenter(function(){
	      tooltip
	            .css({
	                  top: parseInt($(this).position().top) - 20,
	                  left: $(this).position().left
	            })
	            .fadeIn('slow')
				.text('Click and copy the last 5 year P/E to computed the prce target range. P/E * Next Yrs EPS');
				setTimeout(function(){
				      tooltip.fadeOut('slow');
				},5000)
	})
	
	
/*
	.mouseleave(function(){
	      tooltip.fadeOut('slow');
	});
*/
	
}, false);
