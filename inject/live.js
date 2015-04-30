$(document).ready(function() {

    $("#siteNavAboutAnchor").parent().removeClass("urHere");
    $("#siteNavLiveAnchor").parent().addClass("urHere");
    $("#mostCommonBorrowerCountry").on("DOMSubtreeModified", function(e){
        sp($("#mostCommonBorrowerCountry").text() + " is the new top borrower country");
    });

    $("#mostCommonSector").on("DOMSubtreeModified", function(e){
        sp($("#mostCommonSector").text() + " just became the new top sector");
    });

    $("#mostCommonLenderCountry").on("DOMSubtreeModified", function(e){
        sp('More lenders have been from ' + $("#mostCommonLenderCountry").text() + " than anywhere else");
    });

    setTimeout(function(){
        if (parseFloat($("#secondsBetweenLoans").text()) > 30.0){
            sp("Wow. The site is very slow right now. Try visiting the Live page again during peak lending times.");
            sp("Generally that is during the day time in the United States. Also, on the seventeenth of each month starting about 1 PM Pacific Time, all of the repayments settle and auto-lending kicks in.");
            sp("It gets crazy!");
        }
    }, 5 * minute);

    $("#newLenders").html('0'); //starts out blank and looks like it's an error.
    var last_spoken_ticker = Date.now() - 10 * minute;
    setTimeout(function(){
        $("ul.ticker").on("DOMNodeInserted", function(e){
            var $new_li = $(e.target);
            var $lender_links = $new_li.find('a[href^="lender/"]'); //brittle since this is not guaranteed to stay like this.

            if ($lender_links.length > 0)
            {
                var len_href = $lender_links.first().attr('href');
                if (len_href.indexOf('www.kiva.org') == -1) {
                    //console.log(len_href);
                    //console.log(len_href.replace('lender/', 'http://www.kiva.org/lender/'));
                    $lender_links.attr('href', len_href.replace('lender/', 'http://www.kiva.org/lender/'));
                    //console.log($lender_links);
                }

            }
            if (!$new_li.hasClass("recent") && (Date.now() - last_spoken_ticker > 10 * second )) { //not the stuff it first loads //
                last_spoken_ticker = Date.now();
                sp($new_li.find("span").text());

                if (parseFloat($("#secondsBetweenLoans").text()) > 10.0){
                    if ($new_li.hasClass("loan-purchased")){

                        if ($lender_links.length > 0) {
                            var t_lender_id = $lender_links.first().attr("href").split('/')[4];
                            if (t_lender_id != null) {
                                get_lender(t_lender_id).done(function (lender) {
                                    ago = date_diff_to_words(Date.now() - new Date(Date.parse(lender.member_since)));
                                    sp(lender.name + " has made " + plural(lender.loan_count, "loan") + " in " + ago.units + ago.uom);
                                })
                            }
                        }
                    }
                }
            }
        });
    }, 1000);
});
