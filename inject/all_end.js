cl("all_end.js processing");

//load all settings needed for each page.
chrome.storage.local.get("lender_id", function(res){
    //cl(res['lender_id']);
    if (is_not_set(res['lender_id'])){
        if (f_is_logged_in()) {
            if (location.href.indexOf(".org/myLenderId") == -1) {
                $.ajax({url: "https://www.kiva.org/myLenderId"}).success(figure_lender_id);
            }
        } else {
            sp_once("has_advised_to_log_in", "If you log in, I'll be able to relate the loans you're looking at to the ones in your portfolio");
        }
    } else {
        //I know your lender id
        lender_id = res['lender_id'];
    }
});

chrome.storage.local.get("last_visit", function(res){
    var date_diff = Date.now() - res.last_visit;
    if (date_diff < hour){
        units = 0;
    } else if (date_diff < day) {
        units = Math.floor(date_diff / hour);
        uom = ' hours';
    } else if (date_diff < week) {
        units = Math.floor(date_diff / day);
        uom = ' days';
    } else if (date_diff < month) {
        units = Math.floor(date_diff / week);
        uom = ' weeks';
    } else {
        units = Math.floor(date_diff / month);
        uom = ' months';
    }
    if (units > 0) {
        sp("Welcome back. It's been " + units + uom + " since your last visit to Kiva."); //todo: will say "1 weeks/months"
    }
});

//todo: can we attach to the dom on start and look for the li to be created?
$("#siteNavLend").before('<li id="siteNavLive"><a id="siteNavLiveAnchor" href="/live?v=1" class="elem_track_click" data-elem="nav_live">Live</a></li>');
