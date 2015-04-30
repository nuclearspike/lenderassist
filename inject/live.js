$(document).ready(function() {
    $("#siteNavAboutAnchor").parent().removeClass("urHere");
    $("#siteNavLiveAnchor").parent().addClass("urHere");
    $("#newLenders").html('0'); //starts out blank and looks like it's an error.
    var last_spoken_ticker = Date.now() - 10 * minute;
    setTimeout(function(){
        $("ul.ticker").on("DOMNodeInserted", function(e){
            var $new_li = $(e.target);
            if (!$new_li.hasClass("recent") && (Date.now() - last_spoken_ticker > 10 * second )) { //not the stuff it first loads //
                last_spoken_ticker = Date.now();
                sp($new_li.find("span").text());

                if (parseFloat($("#secondsBetweenLoans").text()) > 10.0){
                    if ($new_li.hasClass("loan-purchased")){

                        var $lender_link = $new_li.find('a[href^="lender/"]').first(); //brittle since this is not guaranteed to stay like this.
                        if ($lender_link.length > 0) {

                            var t_lender_id = $lender_link.attr("href").split('/')[1];
                            if (t_lender_id == null) return;
                            get_lender(t_lender_id).done(function (lender) {
                                ago = date_diff_to_words(Date.now() - new Date(Date.parse(lender.member_since)));
                                sp(lender.name + " has made " + plural(lender.loan_count, "loan") + " in " + ago.units + ago.uom);
                            })
                        }
                    }
                }
            }
        });
    }, 1000);
});
