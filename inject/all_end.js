cl("all_end.js processing");

chrome.runtime.sendMessage({funct: 'create_lender_id_tab'}, function(result){
    cl("received result")
    cl(result);
});

//load all settings needed for each page.
chrome.storage.local.get("lender_id", function(res){
    cl(res['lender_id']);
    if (is_not_set(res['lender_id'])){
        cl("lender_id not set");
        if (f_is_logged_in() && (window.location.protocol == "http:")){
            cl("!!! sending message tab"); //todo: not working!
            chrome.runtime.sendMessage({funct: 'create_lender_id_tab'}, function(result){
                cl("received result");
                cl(result);
            });
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


$("#siteNavLend").before('<li id="siteNavLive"><a id="siteNavLiveAnchor" href="/live?v=1" class="elem_track_click" data-elem="nav_live">Live</a></li>');

//this assumes the user already has a zip account, what happens when not true? is there a way to elegantly know?

$(".siteNav li a").animate({opacity: 1});
if (f_is_logged_in()) { //alter the zip button to go to the oauth login... it'd be great if we could already know if zip was logged in.
    $("#siteNavZip").find("a").attr('href', 'https://zip.kiva.org/users/auth/kiva?kv_method=login');
}
