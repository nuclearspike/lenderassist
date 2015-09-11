var live_page_loaded = Date.now();
var last_spoken_ticker = Date.now() - 10 * minute;

function test_change(id, to_say){
    if ($(id).hasClass("dataChanged")){
        var data = $(id).text();
        to_say = to_say.replace('{word}', data);
        if (speech_enabled_live) {sp(to_say);}
        $(id).removeClass("dataChanged");
    }
}

var speech_enabled_live = false;

if_setting(['speech_enabled','speech_enabled_live']).done(()=> speech_enabled_live = true);

$(document).ready(function() {
    $("#siteNavAboutAnchor").parent().removeClass("urHere");
    $("#siteNavLiveAnchor").parent().addClass("urHere");

    //wire to look for changes and tag them to be read.
    $("#mostCommonBorrowerCountry, #mostCommonSector, #mostCommonLenderCountry").on("DOMSubtreeModified", function(e) {
        if ($(e.target).text() != '(Undisclosed)') //
            $(e.target).addClass("dataChanged");
    });

    setInterval(function(){ //could set up a rand selection from array
        test_change("#mostCommonSector", pick_random(["{word} is trending", "{word} is the new top sector", "There have been a lot of loans in the {word} sector recently"]));
        test_change("#mostCommonBorrowerCountry", pick_random(["{word} is trending", "{word} is the new trending borrower country","Many loans have been going to borrowers in {word}"]));
        test_change("#mostCommonLenderCountry", pick_random(["{word} is trending", "There's been a lot of lending from {word} recently.","People in {word} have been lending a bunch"]));
    }, 60 * second);

    setTimeout(function(){
        if (parseFloat($("#secondsBetweenLoans").text()) > 30.0){
            var speak = "Wow. The site is very slow right now.";
            speak += "Try back during the day time in the United States. Also, on the seventeenth of each month starting about 1 PM Pacific Time, the repayments come back and auto-lending kicks in.";
            if (speech_enabled_live) {sp(speak,"page");}
        }
    }, 5 * minute);

    $("#newLenders").html('0'); //strangely starts out blank and looks like it's an error.

    setTimeout(function(){
        if (speech_enabled_live) {
            $("ul.ticker").on("DOMNodeInserted", function (e) {
                var $new_li = $(e.target);
                $new_li.data().added = Date.now();

                //LENDER LINKS
                var $lender_links = $new_li.find('a[href*="lender/"]'); //brittle since this is not guaranteed to stay like this.
                if ($lender_links.length > 0) {
                    var len_href = $lender_links.first().attr('href');
                    //fix the links to lender pages to have full domain in them so that hover-overs will automatically work.
                    if (len_href.indexOf('www.kiva.org') == -1) { //if it's later fixed on www, stop doing it.
                        $lender_links.attr('href', len_href.replace('lender/', 'http://www.kiva.org/lender/'));
                    }
                    var lender_url = $lender_links.attr('href');
                    $new_li.data().lender_id = lender_url.split('/')[4];
                }

                //TEAM LINKS
                var $team_links = $new_li.find('a[href*="team/"]'); //brittle since this is not guaranteed to stay like this.
                if ($team_links.length > 0) {
                    var team_url = $team_links.first().attr('href');
                    $new_li.data().team_id = team_url.split('/')[4];
                }

                //LOAN LINKS
                var $loan_links = $new_li.find('a[href*="lend/"]'); //brittle since this is not guaranteed to stay like this.
                if ($loan_links.length > 0) {
                    var loan_url = $loan_links.first().attr('href');
                    $new_li.data().loan_id = loan_url.split('/')[4];
                }

                if (!$new_li.hasClass("recent") && (Date.now() - last_spoken_ticker > 3 * second )) { //not the stuff it first loads //
                    read_li_text($new_li);
                }
            });
        }
    }, 1000);

    setInterval(function(){
        if (Date.now() - last_spoken_ticker > 5 * second) {
            var $top_li = $("ul.ticker li:first");
            if ($top_li.hasClass('.recent')) return;

            if (!$top_li.hasClass("lenderassist_read_text")){
                read_li_text($top_li);
            } else if (!$top_li.hasClass("lenderassist_color_commentary")) {
                add_color_commentary($top_li);
            } else if (!$top_li.hasClass("lenderassist_color_commentary_more")) {
                add_color_commentary_more($top_li);
            }
        }
    }, 5000);
});

function read_li_text($li){
    if (speech_enabled_live) {
        $li.addClass('lenderassist_read_text');
        var to_say = $li.find("span").text();
        to_say = to_say.replace(/\+\d+ more/gi, '').replace(/\s{1,}/gi, ' ').trim();
        to_say = to_say.replace("made a loan, which helps", pick_random(["is helping", "made a loan, which helps",
            "decided to help", "wants to help", "is lending money to help",
            "made a loan to help", "is making a difference by helping"]));
        last_spoken_ticker = Date.now();
        sp(to_say);
    }
}

function comment_on_lender($li){
    if ((speech_enabled_live) && ($li.data().lender_id != undefined)) {
        get_lender($li.data().lender_id).done(lender => { //would find cached version
            $li.data().lender = lender;
            ago = date_diff_to_words(Date.now() - new Date(Date.parse(lender.member_since)));
            last_spoken_ticker = Date.now();
            $li.data().commented_on_lender = true;
            sp(lender.name + " has made " + plural(lender.loan_count, "loan") + " since joining " + ago.units + ago.uom + " ago", lender);
            if (lender.loan_count > 100) {
                sp_top_3_lender_sectors(lender);
            }
        });
    }
}

function comment_on_team($li){
    if ((speech_enabled_live) && ($li.data().team_id != undefined)) {
        get_team($li.data().team_id).done(short_talk_team).done(team => {
            $li.data().team = team;
            last_spoken_ticker = Date.now();
            $li.data().commented_on_team = true;
        });
    }
}

function comment_on_loan($li){
    if ((speech_enabled_live) && ($li.data().loan_id != undefined)) {
        get_loan($li.data().loan_id).done(loan => {
            sp(loan.name + ' is in ' + loan.location.country, loan);
            $li.data().loan = loan;
            last_spoken_ticker = Date.now();
            $li.data().commented_on_loan = true;
        });
    }
}

function add_color_commentary($li){
    $li.addClass("lenderassist_color_commentary");
    if ($li.hasClass("loan-purchased")){
        comment_on_lender($li);
    } else if ($li.hasClass('lender-joinedTeam')){ //can have lender or team links.
        comment_on_team($li);
    }
}

function add_color_commentary_more($li){
    var track = $li.data();
    $li.addClass("lenderassist_color_commentary_more");

    if ($li.hasClass("loan-purchased") || $li.hasClass("lender-joinedTeam")) {
        if (!track.commented_on_loan && track.loan_id) {
            comment_on_loan($li);
        } else if (!track.commented_on_team && track.team_id) {
            comment_on_team($li);
        } else if (!track.commented_on_lender && track.lender_id) {
            comment_on_lender($li)
        }
    }
    console.log($li.data());
}

if (speech_enabled_live) {
    sp_rand(["Here's what's happening.", "Let's see what other lenders are doing", "You should have this page open in a tab before you complete your loan purchase so you can see your loans happen."]);
}