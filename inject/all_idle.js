cl("all_idle.js processing");
$(".siteNav li a").animate({opacity: 1});

function set_zip_button(){
    chrome.storage.local.get('zip_logged_in', function(res){
        zip_logged_in = res.zip_logged_in || false;

        $zip = $("#siteNavZip").find("a"); //nav on WWW

        if (f_is_logged_in() && !zip_logged_in) { //WWW in|ZIP not. alter the zip button to go to the oauth login...
            $zip.attr('href', 'https://zip.kiva.org/users/auth/kiva?kv_method=login');
        } else if (zip_logged_in) { //if ZIP in then just hop to loans page
            $zip.attr('href', 'https://zip.kiva.org/loans'); //don't do all the cross promo stuff. they have an account.
        }

        $zip.click(function(){
            //clear these so that injected pages on zip do a full check when on the site.
            chrome.storage.local.remove(['check_zip_logged_in','zip_logged_in']);
        });
    });
}



if_setting('speech_enabled').done(function(settings){
    if (settings.speech_enabled_hover_team) {
        wire_intent('a[href*="kiva.org/team/"]', 'team_chatter', function ($element) {
            url_to_api_object($element.attr("href")).done(short_talk_team);
        });
    }
    if (settings.speech_enabled_hover_lender) {
        wire_intent('a[href*="kiva.org/lender/"]', 'lender_chatter', function ($element) {
            url_to_api_object($element.attr("href")).done(short_talk_lender);
        });
    }
    if (settings.speech_enabled_hover_loan) {
        wire_intent('a[href*="kiva.org/lend/"]', 'loan_chatter', function ($element) {
            url_to_api_object($element.attr("href")).done(short_talk_loan);
        });
    }
});



$(document).on('click', 'a[href*="kiva.org/lender/"]', function(e){
    e.preventDefault();
    var $elem = $(e.target).closest('a');
    sp_rand(["Ok...", "Let's look at this lender..."]);
    var amp = ($elem.attr("href").indexOf('?') > -1) ? '&': '?';
    window.location.href = $elem.attr("href")+ amp + "super_graphs=1";
});

$(document).on('click', 'a[href*="kiva.org/lend/"]', function(e){
    var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
    sp_rand(wait_words);
});

$(function(){
    do_if_awhile("check_zip_logged_in", 15 * minute, function(){
        $.ajax({
            type: 'GET',
            url: "https://zip.kiva.org/about",
            success: function(output) { //BRITTLE.
                var zip_logged_in = $(output).find("li.dropdown > a.user-menu").length > 0;
                cl("Zip Logged In: " + zip_logged_in);
                chrome.storage.local.set({"zip_logged_in": zip_logged_in}, set_zip_button); //todo: this needs to clear for sure if it's used to prevent the ajax call.
            },
            cache: false
        });
    }, set_zip_button);
});