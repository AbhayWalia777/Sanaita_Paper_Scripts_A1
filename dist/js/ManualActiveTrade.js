﻿var allowedTradingUnit;
$(document).ready(function () {
    allowedTradingUnit = JSON.parse($("#TradingUnitAccess").val())
    $('.select2').select2();
    //let EntrydateInput = document.getElementById('Entrytime');
    //EntrydateInput.max = new Date().toISOString().split(".")[0];
    //let ExitdateInput = document.getElementById('Exittime');
    //ExitdateInput.max = new Date().toISOString().split(".")[0];
    let EntrydateInput = document.getElementById('Entrytime');
    let ExitdateInput = document.getElementById('Exittime');

    // Get the current date and set the time to the end of the day (23:59)
    let endOfDay = new Date();
    endOfDay.setHours(23, 59, 0, 0); // Set to the last minute of the day

    // Format the date to `yyyy-MM-ddTHH:mm` for the datetime-local input in local timezone
    let year = endOfDay.getFullYear();
    let month = String(endOfDay.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    let date = String(endOfDay.getDate()).padStart(2, '0');
    let hours = String(endOfDay.getHours()).padStart(2, '0');
    let minutes = String(endOfDay.getMinutes()).padStart(2, '0');

    // Combine the values
    let formattedEndOfDay = `${year}-${month}-${date}T${hours}:${minutes}`;
    console.log(formattedEndOfDay); // For debugging

    // Set the max attributes
    EntrydateInput.max = formattedEndOfDay;
    ExitdateInput.max = formattedEndOfDay;


});

$('.addScriptBtn').on('click', function () {
    if ($("#WatchList option:selected").val() != "") {
        $("#addScriptModal").modal('show');
    }
    else {
        toastr.error("Please Select Watchlist");
    }
});

$("#txtScript").autocomplete({
    source: function (request, response) {
        var _ScriptExchange = $('#ScriptExchange').val();
        var _ScriptSegment = "";
        var _ScriptExpiry = "";
        var _ScriptStrike = "";
        $.ajax({
            url: "/Watchlist/GetScriptWithioutFilter",
            type: "GET",
            dataType: "json",
            data: { Search: request.term },
            success: function (data) {
                response($.map(data, function (item) {
                    return { label: item.ScriptTradingSymbol, value: item.ScriptTradingSymbol };
                }));
            }
        });
    },
    messages: {
        noResults: "", results: ""
    },
    minLength: 2,
    select: function (event, ui) {
        $(this).val(ui.item.value);
        var script_Trading_Symbol = $("#txtScript").val();
        $.ajax({
            url: "/Watchlist/GetScriptLotSize",
            type: "GET",
            dataType: "json",
            data: { ScriptTradingSymbol: script_Trading_Symbol, ScriptExchange: "" },
            success: function (data) {
                $("#txtSize").val(data.Lot);
                $("#ScriptExchange").val(data.ScriptExchange);
            }
        });

    }
});
$('#saveScript').on('click', function () {
    var selectedWatchlist = $("#WatchList").val();
    if (selectedWatchlist != null && selectedWatchlist != "") {
        var Watchlistname = $("#WatchList option:selected").text();
        var txtUser = null; //it will fetch logged in user
        var Lot = $("#LotSizeDiv #txtLot").val();
        var size = $("#LotSizeDiv #txtSize").val();
        var ScriptTradingSymbol = $("#txtScript").val();
        var _ScriptExchange = $('#ScriptExchange').val();
        if (ScriptTradingSymbol != null && ScriptTradingSymbol != '' && ScriptTradingSymbol != undefined &&
            _ScriptExchange != null && _ScriptExchange != '') {
            var request = $.ajax({
                url: "/Watchlist/SaveWatchList",
                type: "POST",
                data: { ScriptTradingSymbol: ScriptTradingSymbol, intWID: selectedWatchlist, Watchlistname: Watchlistname, ScriptExchange: _ScriptExchange, txtUser: txtUser, Lot: Lot, Size: size },
                dataType: 'json',
                traditional: true,
                success: function (data) {
                    var results = JSON.parse(data);
                    if (results.IsError && results.ErrorMessage == "MaxLimit") {
                        toastr.error("Max 50 Scripts Allowed");
                    }
                    else if (results.IsExist) {
                        toastr.error("Duplicate Record");
                    }
                    else if (results.IsError) {
                        toastr.error("Something Went Wrong");
                    }
                    else if (!results.IsError && results.ScriptCode != '' && results.ScriptCode != null) {
                        toastr.success("Script Added Successfully");
                        bindScript();
                    }
                    $("#addScriptModal").modal('hide');
                    $("#txtScript").val("");
                }
            });
        }

    }
    else {
        toastr.error("Please Select Watchlist");
        $('#modalWatchList').focus();
    }
});
function bindScript() {
    if ($("#WatchList option:selected").val() != "") {
        $.ajax({
            url: '/Trade/GetScriptByWatchlistForManualTrade?WID=' + $("#WatchList option:selected").val(),
            type: 'Get',
            success: function (Resp) {
                var data = JSON.parse(Resp);

                $('#ScriptCode').html('');
                $('#ScriptCode').append($("<option></option>").val("").html("-Select-"));
                var list = $('#ScriptCode');
                $.each(data, function (i, item) {
                    $('#ScriptCode').append($("<option></option>").val(item.ScriptCode).html(item.ScriptTradingSymbol + "/ " + item.Scriptsegment));
                });
            }
        });
    }
}
$("#WatchList").on('change', function () {
    if ($("#WatchList option:selected").val() != "") {
        $.ajax({
            url: '/Trade/GetScriptByWatchlistForManualTrade?WID=' + $("#WatchList option:selected").val(),
            type: 'Get',
            success: function (Resp) {
                var data = JSON.parse(Resp);

                $('#ScriptCode').html('');
                $('#ScriptCode').append($("<option></option>").val("").html("-Select-"));
                var list = $('#ScriptCode');
                $.each(data, function (i, item) {
                    $('#ScriptCode').append($("<option></option>").val(item.ScriptCode).html(item.ScriptTradingSymbol + "/ " + item.Scriptsegment));
                });
            }
        });
    }
});
$("#ScriptCode").on('change', function () {
    if ($("#ScriptCode option:selected").val() != "" && $("#ProductType option:selected").val() != "" && $("#WatchList option:selected").val() != "") {
        $.ajax({
            url: '/Trade/GetScriptDataByScriptCode?WID=' + $("#WatchList option:selected").val() + '&ScriptCode=' + $("#ScriptCode option:selected").val() + '&ProductType=' + $("#ProductType option:selected").val(),
            type: 'Get',
            success: function (Resp) {
                var data = JSON.parse(Resp);
                $("#Lastprice").val(data.Lastprice);
                $("#ScriptExchange").val(data.ScriptExchange);
                $("#Size").val(data.Size);
                $('#dropTradingUnit').html('');
                var instumentType = data.ScriptInstrumentType;
                if (allowedTradingUnit != null) {
                    if (allowedTradingUnit.length > 0) {
                        var data = allowedTradingUnit.filter(opt => opt.ScriptExchange == data.ScriptExchange);
                        var units = [];
                        if (instumentType == "FUT" || instumentType == "CE" || instumentType == "PE") {
                            if (instumentType == "FUT") {
                                if (data[0].Future_Trading_Unit_Type == null || data[0].Future_Trading_Unit_Type == '' || data[0].Future_Trading_Unit_Type == undefined) {
                                    units.push(1);
                                } else {
                                    units = data[0].Future_Trading_Unit_Type.split(",");
                                }
                            }
                            else {
                                if (data[0].Options_Trading_Unit_Type == null || data[0].Options_Trading_Unit_Type == '' || data[0].Options_Trading_Unit_Type == undefined) {
                                    units.push(1);
                                } else {
                                    units = data[0].Options_Trading_Unit_Type.split(",");
                                }
                            }
                        } else {
                            if (data[0].Options_Trading_Unit_Type == null || data[0].Options_Trading_Unit_Type == '' || data[0].Options_Trading_Unit_Type == undefined) {
                                units.push(1);
                            }
                            else {
                                units = data[0].Equity_Trading_Unit_Type.split(",");
                            }
                        }
                        $.each(units, function (i, item) {
                            if (item == "0")
                                item = "1";
                            $('#dropTradingUnit').append($("<option></option>").val(parseInt(item)).html(item == "1" ? "Lot" : "Qty"));
                        });

                    } else {
                        $('#dropTradingUnit').append($("<option></option>").val(parseInt(1)).html("Lot"));
                    }
                }
                else {
                    $('#dropTradingUnit').append($("<option></option>").val(parseInt(1)).html("Lot"));
                }
            }
        });
    } else {
        toastr.error('Mandatory fields missing!!');
    }
});
$(".refresh").on('click', function () {
    if ($("#ScriptCode option:selected").val() != "" && $("#ProductType option:selected").val() != "" && $("#WatchList option:selected").val() != "") {
        $.ajax({
            url: '/Trade/GetScriptDataByScriptCode?WID=' + $("#WatchList option:selected").val() + '&ScriptCode=' + $("#ScriptCode option:selected").val() + '&ProductType=' + $("#ProductType option:selected").val(),
            type: 'Get',
            success: function (Resp) {
                var data = JSON.parse(Resp);
                $("#Lastprice").val(data.Lastprice);
            }
        });
    }
    else {
        toastr.error('Mandatory fields missing!!');
    }
});
$("#Entryprice").on('keyup', function () {
    if ($("#BuyOrSell").val() != "") {
        var _profitLoss = 0;
        var _Qty = parseFloat($("#Qty").val());
        var _Size = parseFloat($("#Size").val());
        var _ScriptExchange = parseFloat($("#ScriptExchange").val());
        var _EntryPrice = parseFloat($("#Entryprice").val());
        var _ExitPrice = parseFloat($("#Exitprice").val());

        if ($('#dropTradingUnit').val() != "UNIT") {
            _Qty = _Size * _Qty;
        }
        if ($("#BuyOrSell").val() == "Buy") {
            _profitLoss = _Qty * (_ExitPrice - _EntryPrice);
        }
        else {
            _profitLoss = _Qty * (_EntryPrice - _ExitPrice);
        }
        $("#Profitorloss").val(_profitLoss.toFixed(4));
    }
    else {
        toastr.error("Please Fill The position");
    }
});
$("#Exitprice").on('keyup', function () {
    if ($("#BuyOrSell").val() != "") {
        var _profitLoss = 0;
        var _Qty = parseFloat($("#Qty").val());
        var _Size = parseFloat($("#Size").val());
        var _ScriptExchange = $("#ScriptExchange").val();
        var _EntryPrice = parseFloat($("#Entryprice").val());
        var _ExitPrice = parseFloat($("#Exitprice").val());

        if ($('#TRADING_UNIT_TYPE').val() != "UNIT") {
            _Qty = _Size * _Qty;
        }
        if ($("#BuyOrSell").val() == "Buy") {
            _profitLoss = _Qty * (_ExitPrice - _EntryPrice);
        }
        else {
            _profitLoss = _Qty * (_EntryPrice - _ExitPrice);
        }
        $("#Profitorloss").val(_profitLoss.toFixed(4));
    }
    else {
        toastr.error("Please Fill The position");
    }
});
$('.createOrderBtn').on('click', function () {
    $('.createOrderBtn').text('Creating Order...');
    $('.createOrderBtn').attr("disabled", "disabled");


    if ($("#Watchlist").val() != '' && $("#ProductType").val() != '' && $("#ScriptCode").val() != '' && $("#BuyOrSell").val() != '' && $("#Qty").val() != ''
        && $("#Entryprice").val() != '' && $("#Profitorloss").val() != '' && $("#Status").val() != '' && $("#UserIds").val() != '') {

        var userIds = "";
        userIds = $('#UserIds').val().join(",");


        var request = $.ajax({
            url: "/Trade/InsertManualActiveOrder",
            type: "POST",
            data: {
                WID: parseInt($("#WatchList option:selected").val()), ScriptCode: $("#ScriptCode").val(),
                ProductType: $("#ProductType").val(), BuyOrSell: $("#BuyOrSell").val(), Qty: $("#Qty").val(),
                Entryprice: $("#Entryprice").val(),
                Exitprice: $("#Exitprice").val(), Profitorloss: $("#Profitorloss").val(), Status: $("#Status").val(),
                Users: userIds, Entrytime: $("#Entrytime").val(), Exittime: $("#Exittime").val(), TRADING_UNIT_TYPE: $('#dropTradingUnit').val()
            },
            success: function (data) {
                if (data > 0) {
                    $("#Watchlist").val("");
                    $("#ProductType").val("");
                    $("#BuyOrSell").val("");
                    $("#Qty").val("");
                    $("#ScriptCode").val("");
                    $("#Entryprice").val("");
                    $("#Exitprice").val("");
                    $("#Status").val("");
                    $("#Profitorloss").val("");
                    $("#Entrytime").val("");
                    $("#Exittime").val("");
                    toastr.success('Order Placed Successfully');

                }
                else {
                    toastr.error('Something Went Wrong With The Order');
                }
            }
        });

    }
    else {
        toastr.error("Fill All The Details.");
    }

    $('.createOrderBtn').text('Create Order');
    $('.createOrderBtn').removeAttr("disabled");
});