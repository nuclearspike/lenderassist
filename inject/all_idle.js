cl("all_idle.js processing");

$(".siteNav li a").animate({opacity: 1});

function set_zip_button(){
    chrome.storage.local.get('zip_logged_in', function(res){
        zip_logged_in = res.zip_logged_in || false;

        $zip = $("#siteNavZip").find("a");

        if (f_is_logged_in() && !zip_logged_in) { //alter the zip button to go to the oauth login... it'd be great if we could already know if zip was logged in.
            $zip.attr('href', 'https://zip.kiva.org/users/auth/kiva?kv_method=login');
        } else if (zip_logged_in) {
            $zip.attr('href', 'https://zip.kiva.org/my/lender'); //don't do all the cross promo stuff. they have an account.
        }

        $zip.click(function(){
            chrome.storage.local.remove(['check_zip_logged_in','zip_logged_in']);
        });
    });
}

var lenders = {};

function short_talk_lender(lender){
    if (Date.now() - lender.last_spoke < 10 * second){
        return;
    }
    speak = [];
    speak.push(lender.name);
    if (lender.whereabouts.length > 0) {
        speak.push("lives in " + lender.whereabouts + " and");
    }
    speak.push("has made " + plural(lender.loan_count,"loan"));
    ago = date_diff_to_words(Date.now() - new Date(Date.parse(lender.member_since)));
    speak.push("and has been lending for over " + ago.units + ago.uom);
    if (lender.invitee_count > 0){
        speak.push("and has invited " + plural(lender.invitee_count, "person", "people") + " who joined");
    }

    sp(speak.join(' '));
    lender.last_spoke = Date.now();
}

//every page gets this!?? //needs to be on() because on loan pages they load dynamically.
$(document).on('mouseover','a[href*="kiva.org/lender/"]',function(){
    var t_lender_id = $(this).attr("href").match(/\/lender\/(.*)/)[1];
    if (t_lender_id == null) return;
    if (lenders[t_lender_id]) {
        short_talk_lender(lenders[t_lender_id])
    } else {
        $.ajax({
            url: "http://api.kivaws.org/v1/lenders/" + t_lender_id + ".json",
            cache: true,
            success: function (result) {
                lenders[t_lender_id] = result.lenders[0];
                short_talk_lender(result.lenders[0]);
            }
        });
        }
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

})