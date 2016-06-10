"use strict";
cl("all_idle.js processing");

if_setting('speech_enabled').done(settings => {
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
    var id = url_to_parts(e.target.href).id
    if (!isNaN(id)) {
        var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
        sp_rand(wait_words);
    }
});

function AddButtonToBanner(id, text, url) {
    var newButton  = $(`<div id=top-${id}-button" class="show-for-large-up large-4 columns"><a class="header-button" href="${url}">${text}</a></div>`)
    $("div.top-nav .header-row div.small-1-8th").before(newButton)
}

function addToDOM(){
    if_setting('custom_button_master').done(settings => {
        if (settings.custom_button_all_teams)
            AddButtonToBanner("teams", "Teams", "https://www.kiva.org/teams");
        if (settings.custom_button_my_teams)
            AddButtonToBanner("my-teams", "My Teams", "https://www.kiva.org/teams/my-teams");
        if (settings.custom_button_live)
            AddButtonToBanner("live", "Live", "https://www.kiva.org/live");
        if (settings.custom_button_kivalens)
            AddButtonToBanner("kivalens", "KivaLens", "https://www.kivalens.org/#/search");

        ([1,2,3]).forEach(i => {
            var caption = settings[`custom_button_${i}_caption`]
            var url = settings[`custom_button_${i}_url`]
            if (caption && (caption.trim() != "") && /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i.test(url)){
                AddButtonToBanner(`custom_button_${i}_url`, caption, url)
            }
        })
    })


    if (lender_id)
        $('#my-kiva-dropdown').find('li').first().after($(`<li><a href="/lender/${lender_id}?super_graphs=1" class="elem_track_click" data-elem="sec_messages" id="loggedInMenuLenderPage" style="opacity: 1;">My Lender Page</a></li>`))
    $('#my-kiva-dropdown').find('li').first().after($(`<li><a href="http://www.kivalens.org/#/search"  target="_blank"  class="elem_track_click" data-elem="sec_messages" id="loggedInMenuKivaLens" style="opacity: 1;">Go to KivaLens.org</a></li>`))
}

$(addToDOM);