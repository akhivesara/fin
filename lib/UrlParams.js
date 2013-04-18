urlParams = (function() {

    var paramValues = [];
    var storeUrlParams = (function() {
        var hash;
        var q = document.URL.split('?')[1];
        if(q != undefined){
            q = q.split('&');
            for(var i = 0; i < q.length; i++){
                hash = q[i].split('=');
                paramValues.push(hash[1]);
                paramValues[hash[0]] = hash[1];
            }
        }
    })();

    return {
        /**
         * Query for url param
         * Ussge urlParams.get('query1')
         * @param param
         * @return {*}
         */
        get : function(param) {
            return paramValues[param];
        }
    }

})();

