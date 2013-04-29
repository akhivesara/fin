Scrapper = new Class.create({

    baseUrl : "http://query.yahooapis.com/v1/public/yql?format=json&diagnostics=true&" ,

    init: function() {

    },

    /**
     *
     * @param url  : Url to be scraped
     * @parFam callback : callback fn
     * @param xpath  : xpath to scrape , by default it returns all nodes. It should ALWAYS be string with single quote : '_some_xpath'
     * @param force : ensure cached response is not returned
     * Usage: new Scrapper().scrape("http://finance.yahoo.com/q?s=INVN",null,'//*[@id="yfi_quote_summary_data"]')
     */
    scrape : function(url , callback , xpath , force) {
        var u = this.buildScrapeUrl(url , xpath);
        yqlScrapperCall(u,callback,null,force)
    },

    buildScrapeUrl : function(url , xpath) {
        url = encodeURIComponent(url);
        xpath = xpath || "*";
        xpath = encodeURIComponent(xpath);
        //http://query.yahooapis.com/v1/public/yql?format=json&diagnostics=true&q=select * from html where url="http://finance.yahoo.com/q?s=INVN" and xpath='//*[@id="yfi_quote_summary_data"]'
        var u = this.baseUrl+"q="+encodeURIComponent("select * from html where url=") +"%22"+url+"%22 and "+encodeURIComponent('xpath=')+ "'"+xpath +"'";
        return u;

    }
})