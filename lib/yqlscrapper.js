// Depends on jquery
function yqlScrapperCall (url , callback , scope , dontCache) {
	var storedData;
	scope = scope || this;
    callback = callback || NOOP;
    /*if (!dontCache) {
	storedData = amplify.store(url);
    }*/
	if (!storedData) {
		$.getJSON(url, {}, 
			function(json) {
	        	if (typeof json === "object" && json.query && json.query.results) {
	            	// we have a json object with an array of company info, cache it, and display suggestions
					var results = json.query.results;
					//console.log('yqlScrapperCall');
					console.log(results);
					// store in l
/*
					if (!dontCache) {
						amplify.store(url,results);	
					}
*/
					callback.call(scope,results);
				}
			}
		);
	} else {
		callback.call(scope,storedData);		
	}
}

function scrapeIndustryLink (ticker , callback) {
	//data.table.tr.td.table.tr.td[0].p[0].a.href		
	var ticker = ticker || $.trim( Y.autoSuggest.$searchbox.val());
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fin%3Fs%3D"+ticker+"%2BIndustry%22%20and%20xpath%3D'%2F%2F*%5B%40id%3D%22yfncsumtab%22%5D'&format=json&diagnostics=true";
	this.yqlScrapperCall(url,function(results) {
		//debugger;
		var industry , sector;
		//console.log(results);
		if (results.table.tr.td.form.table.tr.td[0].big) {
			//console.log(results.table.tr.td.form.table.tr.td[0].big);
			//portfolio._myportfolio.data[ticker]['industry'] = results.table.tr.td.form.table.tr.td[0].big.strong.split(': ')[1];
			industry = results.table.tr.td.form.table.tr.td[0].big.strong.split(': ')[1];
		} 
		if (safeLookup(results.table, 'tr.td.table.tr.td.0.table.1.tr.td.table.tr.0.td.a.content')) {
			sector = results.table.tr.td.table.tr.td[0].table[1].tr.td.table.tr[0].td.a.content;
			//console.log(results.table.tr.td.table.tr.td[0].p.content);
		}
		callback(industry,sector);
	});		
}

function scrapePrice (ticker , callback , callbackObj) {
	//console.log('scrapePrice called');
	var url = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22http%3A%2F%2Ffinance.yahoo.com%2Fq%2Fks%3Fs%3D"+ticker+"%2BKey%2BStatistics%22%20and%20xpath%3D'%2F%2F*%5B%40class%3D%22yfi_rt_quote_summary_rt_top%22%5D%2Fp'&format=json&diagnostics=true";
	this.yqlScrapperCall(url, function(results) {
		var change , price , d_change , u_change , price_aft , d_change_aft , u_change_aft , change_aft , priceElement = $('#price') ;
		//console.log(results);
		//this.current.price = results.p.span;
		price = _findValue(results.p.span,'time_rtq_ticker','class','span.content');		
		//console.log(price);
		d_change = this._findValue(results.p.span,'down_r time_rtq_content','class','span.1.content');
		if (d_change !=undefined) {
			d_change = d_change.match(/\((\d+\.\d+)%\)/)[1];
			if (d_change !=undefined) {
				d_change = -1* +d_change;				
			}
		}
		//console.log('d_change = '+d_change);			
		u_change = _findValue(results.p.span,'up_g time_rtq_content','class','span.1.content');	
		if (u_change !=undefined) {
			u_change = u_change.match(/\((\d+\.\d+)%\)/)[1];
		}
		
//		console.log('u_change = '+u_change);	
		if (d_change !=undefined ) {
			change = d_change;
		} else {
			change = u_change;
		}

        price_aft = this._findValue(results.p.span,'yfs_rtq_quote','class','span.content');

        d_change_aft = this._findValue(results.p.span,'down_r time_rtq_content','class','span.1.content');
        if (d_change_aft !=undefined) {
            d_change_aft = d_change_aft.match(/\((\d+\.\d+)%\)/)[1];
            if (d_change_aft !=undefined) {
                d_change_aft = -1* +d_change_aft;
            }
        }

        u_change_aft = _findValue(results.p.span,'up_g','class','span.1.content');
        if (u_change_aft !=undefined) {
            u_change_aft = u_change_aft.match(/\((\d+\.\d+)%\)/)[1];
        }

        if (d_change_aft !=undefined ) {
            change_aft = d_change_aft;
        } else {
            change_aft = u_change_aft;
        }


        //console.log('change = '+change);
		callback(price,change,price_aft,change_aft);
	});
}
/**
 *
 * @param dataTable : Array to look up in
 * @param entryToLookFor    : Key to match
 * @param keySelector   :  selector to lookup to match the  entryToLookFor
 * @param valueSelector : selector to lookup for the matched key
 * @return {*|XML|void}
 * @private
 */
function _findValue(dataTable,entryToLookFor, keySelector,valueSelector) {
	var _table =dataTable ,
		i = 0 , 
		entry , k , v;
	for (;i< _table.length;i++) {
		entry = _table[i];
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
		if (v && k && k.indexOf && k.indexOf(entryToLookFor)!=-1) {
			return v.replace(',','');
		}					
	}
}




