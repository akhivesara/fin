var tableHelper = (function() {

    return {

        createFrame : function(tableId,data,opt) {
            var options = $.extend(
                {
                    data: data ,
                    stretchH : 'hybrid' ,
                    stretchV : 'hybrid',
                    minSpareRows: 10,
                    startCols: data ? data.length : 4
                },
                opt
            )
            return $("#"+tableId).handsontable(options);
        },

        fillBackgroundColor : function(tableId,row,col,color) {
            $("#"+tableId).handsontable('getCell',row,col).style['background-color'] = color;
        },

        fillSlot : function(tableId,row,col,value) {
            $("#"+tableId).handsontable('setDataAtCell', row, col, value);
        }
    }
})()
