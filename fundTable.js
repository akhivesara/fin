var fund = (function(){

    var	_table = null ,
        _data = [
            //["No", "Fund", "Shares" , "Value" , "Activity" , "Port"]
            ["","","","","",""]
        ];

    return {

        clear : function() {
            $("#fundTable").handsontable('clear');
            $("#fundTable").handsontable('destroy');
        },

        create:function() {
            var that =this;
            tableHelper.createFrame('fundTable',_data,{
                cells: function (row, col, prop) {
                    var cellProperties = {};
                    if (col === 0 ) {
                        cellProperties.readOnly = true; //make cell read-only if it is first row or the text reads 'readOnly'
                    }
                    if (col === 1) {
                        cellProperties.type = {
                            renderer: that.descriptionRenderer
                        }
                    }
                    return cellProperties;
                },
                colHeaders: true,
                colHeaders: function (col) {
                    switch (col) {
                        case 0:
                            return "<b>No</b>";
                        case 1:
                            return "<b>Fund</b>";
                        case 2:
                            return "<b>Shares</b>";
                        case 3:
                            return "<b>Value</b>";
                        case 4:
                            //    return "<b>Day\'s Gain</b>";
                            //case 5:
                            return "<b>Activity</b>";
                        case 5:
                            return "<b>Port</b>";
                    }
                },

                xcolumns: [
                    {data: "No"},
                    {data: "Hedge Fund", type: {renderer: this.descriptionRenderer}},
                    {data: "Shares"},
                    {data: "Value"},
                    {data: "Activity"},
                    {data: "Port"}

                ]
            });
        },
        strip_tags :function(input, allowed) {
            // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
            allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
            var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
                commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
            return input.replace(commentsAndPhpTags, '').replace(tags, function ($0, $1) {
                return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
            });
        },
        descriptionRenderer : function (instance, td, row, col, prop, value, cellProperties) {
            var escaped = Handsontable.helper.stringify(value);
            escaped = fund.strip_tags(escaped, '<a>'); //be sure you only allow certain HTML tags to avoid XSS threats (you should also remove unwanted HTML attributes)
            td.innerHTML = escaped;
            return td;
        },

        fillTableRow : function(rowData) {
            var rowIdx = +rowData['No.'].split('.)')[0];
            tableHelper.fillSlot('fundTable',rowIdx,0,rowData['No.']);
            var f = rowData['Hedge Fund'].fund;
            var u = rowData['Hedge Fund'].link;
            tableHelper.fillSlot('fundTable',rowIdx,1,"<a href='"+u+"' target='_blank'>"+f+"</a>");
            tableHelper.fillSlot('fundTable',rowIdx,2,rowData['Shares']);
            tableHelper.fillSlot('fundTable',rowIdx,3,rowData['Value (x$1000)']);
            tableHelper.fillSlot('fundTable',rowIdx,4,rowData['Activity']);
            tableHelper.fillSlot('fundTable',rowIdx,5,rowData['% Port']);
        },

        fillTable : function(ticker) {
            this.create();
            this.clear();
            this.create();
            var that = this;
            myTable.getInsiderMonkey(ticker,false, function(data,url) {
                $('#fundHeader').attr('data-url',url);
                document.getElementById('fundHeader').onclick = function() {
                    var url = this.getAttribute('data-url');
                    open_in_new_tab(url);
                };
                data.forEach(function(rowData){
                    that.fillTableRow(rowData);
                })
            })
        }
    }
})();
