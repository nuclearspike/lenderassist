cl("all_idle.js processing");
$(".siteNav li a").animate({opacity: 1});

function set_zip_button(){
    chrome.storage.local.get('zip_logged_in', function(res){
        zip_logged_in = res.zip_logged_in || false;

        $zip = $("#siteNavZip").find("a");

        if (f_is_logged_in() && !zip_logged_in) { //alter the zip button to go to the oauth login...
            $zip.attr('href', 'https://zip.kiva.org/users/auth/kiva?kv_method=login');
        } else if (zip_logged_in) {
            $zip.attr('href', 'https://zip.kiva.org/loans'); //don't do all the cross promo stuff. they have an account.
        }

        $zip.click(function(){
            chrome.storage.local.remove(['check_zip_logged_in','zip_logged_in']);
        });
    });
}

wire_intent('a[href*="kiva.org/team/"]', 'team_chatter', function($element) {
    url_to_api_object($element.attr("href")).done(short_talk_team);
});

wire_intent('a[href*="kiva.org/lender/"]', 'lender_chatter', function($element){
    url_to_api_object($element.attr("href")).done(short_talk_lender);
});

wire_intent('a[href*="kiva.org/lend/"]', 'lender_chatter', function($element){
    url_to_api_object($element.attr("href")).done(short_talk_loan);
});

$(document).on('click', 'a[href*="kiva.org/lender/"]', function(e){
    e.preventDefault();
    var $elem = $(e.target).closest('a');
    sp_rand(["Ok...", "Let's look at this lender...",]);
    var amp = ($elem.attr("href").indexOf('?') > -1) ? '&': '?';
    window.location.href = $elem.attr("href")+ amp + "super_graphs=1";
});

//http://api.kivaws.org/v1/teams/using_shortname/atheists.json

$(function(){
    do_if_awhile("check_zip_logged_in", 15 * minute, function(){
        $.ajax({
            type: 'GET',
            url: "https://zip.kiva.org/about",
            success: function(output) {
                var zip_logged_in = $(output).find("li.dropdown > a.user-menu").length > 0;
                cl("Zip Logged In: " + zip_logged_in);
                chrome.storage.local.set({"zip_logged_in": zip_logged_in}, set_zip_button); //todo: this needs to clear for sure if it's used to prevent the ajax call.
            },
            cache: false
        });
    }, set_zip_button);
});