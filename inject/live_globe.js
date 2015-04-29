$(document).ready(function() {
    $("div.outstandingText").after("<div class='view_select'><a href='/live?v=1'>Map</a> | Globe</div>");
    $("div.globe canvas:last-of-type").attr("width",650).attr("style",null); //crowds ticker (ticker spills onto it)
});