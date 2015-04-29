console.log("all_end.js processing");

//load all settings needed for each page.
chrome.storage.local.get("lender_id",function(res){
    console.log(res['lender_id']);
    if (is_not_set(res['lender_id'])){
        if (f_is_logged_in() && (window.location.protocol == "http:")){
            sp("You're logged in but I don't know who you are yet. Please go to your portfolio page for just a second.");
        }
    } else {
        //I know your lender id
        lender_id = res['lender_id'];
    }
});

//chrome.storage.local.set({"lender_id": null});

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


$("#siteNavLend").before('<li id="siteNavLive"><a id="siteNavLiveAnchor" href="/live?v=1" class="elem_track_click" data-elem="nav_live">Live</a></li>');
//this assumes the user already has a zip account, what happens when not true? is there a way to elegantly know?

$(".siteNav li a").animate({opacity: 1});
if ($("div.loggedInGreeting").length > 0) { //if logged in
    $("#siteNavZip").find("a").attr('href', 'https://zip.kiva.org/users/auth/kiva?kv_method=login');
}