cl("lend.js processing");
var id = window.location.pathname.match(/^\/lend\/(\d+)/)[1];

//basic analysis

//todo: turn 'concerns' into something that will eventually be set in the properties form by the user.
var concerns = {high_months_to_payback: 12, low_months_to_payback: 5};

function analyze_loan(loan){
    an_massage(loan);
    an_status(loan);
    if (loan.status != 'fundraising') {
        if (['issue', 'reviewed', 'inactive'].indexOf(loan.status) > -1) {
            sp("Well, that's weird. The API for Kiva is showing that this loan is still in the " + loan.status + " state. I'm not going to analyze this loan any further.");
        }
        return;
    }
    an_loan_attr(loan);

    an_repayment_term(loan);
    an_partner_risk(loan.partner);
    an_partner_stuff(loan.partner);
    an_lender(loan);
}

var countries_lookup = {};
var countries_all_c = {};
var countries_all = [];
var countries_active = [];

function an_lender(loan){
    if (lender_id == undefined) return; //we can't look up information on a lender

    var url = "http://www.kiva.org/ajax/getSuperGraphData?&sliceBy=country&include=all&measure=count&subject_id=" + lender_id + "&type=lender&granularity=cumulative";
    $.ajax({url: url,
        crossDomain: true,
        type: "GET",
        dataType: "json",
        cache: true
    }).success(function(result){
        //cl(result);
        if (result.data.length > 0) { //if user has ever done a loan
            //var country = result.lookup[result.data[0].name];
            for (i = 0; i < result.data.length; i++){
                countries_lookup[result.data[i].name] = result.lookup[result.data[i].name];
                countries_all.push(result.lookup[result.data[i].name]);
                countries_all_c[result.lookup[result.data[i].name]] = parseInt(result.data[i].value);
            }

            var cur_country_rank_all = countries_all.indexOf(loan.location.country);
            if (cur_country_rank_all > -1 && cur_country_rank_all < 10){
                //is in the top 10
                sp("It looks like " + loan.location.country + " is one of your favorite lending countries.")
            } else {
                //is not in the top 10
            }

            var url = "http://www.kiva.org/ajax/getSuperGraphData?&sliceBy=country&include=active&measure=count&subject_id=" + lender_id + "&type=lender&granularity=cumulative";
            $.ajax({url: url,
                crossDomain: true,
                type: "GET",
                dataType: "json",
                cache: true
            }).success(function(result){
                //cl(result);
                countries_active = [];
                countries_active_c = {};
                for (i = 0; i < result.data.length; i++){
                    countries_active.push(result.lookup[result.data[i].name]);
                    //store how many...
                    countries_active_c[result.lookup[result.data[i].name]] = parseInt(result.data[i].value);
                }
                cl(countries_active_c);

                var cur_country_rank_active = countries_active.indexOf(loan.location.country);
                if (cur_country_rank_all > -1){
                    var to_say;

                    if (countries_all_c[loan.location.country] > 1){
                        to_say = "You've made " + plural(countries_all_c[loan.location.country], "loan") +  " in " + loan.location.country + "  "
                    } else {
                        to_say = "You've made a loan to someone in " + loan.location.country + " before, "
                    }

                    if (cur_country_rank_active < 0){
                        sp(to_say + "but you have no active loans in that country. Maybe it's time to make another loan in " + loan.location.country);
                    } else {
                        if (countries_active_c[loan.location.country] == 1){
                            sp(to_say + "and you still have one loan paying back.");
                        } else {
                            sp(to_say + "and you have " + countries_active_c[loan.location.country] + " loans still paying back.");
                        }
                    }
                } else { //never before
                    sp("You've never lent to anyone in " + loan.location.country + " before. Maybe now is the time.");
                }

            });
        }
    }).fail(function(result){
        sp("Something went wrong!");
        cl(result);
    });
}

function an_wait_words(){
    var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
    sp(pick_random(wait_words), true);
}

function an_massage(loan){
    loan.final_payment = Date.parse(loan.terms.scheduled_payments[loan.terms.scheduled_payments.length - 1].due_date);
}

function an_status(loan){
    if (loan.status == 'funded'){
        sp("This loan has already been fully funded.");
        sp_once("loan_detail_look_at_similar", "Look at the top of the page to find similar loans")
    }
}

function h_make_date(date){
    return monthNames[date.getMonth()] + " " + date.getFullYear().toString();
}

function an_repayment_term(loan){
    months_to_go = (loan.final_payment - Date.now()) / month;

    frd = new Date(loan.final_payment);

    if (Math.ceil(months_to_go) <= concerns.low_months_to_payback ){
        sp("That's great! This loan should pay back in " + h_make_date(frd) + " which is only " + Math.ceil(months_to_go) + " months away.");
    }

    if (Math.floor(months_to_go) >= concerns.high_months_to_payback){
        sp("Note: The final repayment isn't until " + h_make_date(frd) + " which is " + Math.floor(months_to_go) + " months away.");
    }

    if (loan.terms.disbursal_date) {
        predisbursal_date = new Date(Date.parse(loan.terms.disbursal_date));
        //it should look at the repayment schedule before making this comment!
        if (Date.parse(loan.terms.scheduled_payments[0].date) < Date.now()){
        //    sp("Nice! The borrower has already received the money in " + h_make_date(predisbursal_date) + " which means your repayments will generally start sooner with a lump sum at the start.");
        }
    }
}

function an_loan_attr(loan){
    if (Date.now() - Date.parse(loan.posted_date) < hour * 3){
        sp("This loan just posted within the past few hours.");
    }
    if (loan.funded_amount == 0) { //due to lag of API, this could be wrong.
        sp("You can be the first person to lend to this borrower.")
    }
    if (Date.parse(loan.planned_expiration_date) - Date.now() < 3 * day){
        sp("This loan is expiring soon."); // Rally your teams to get this loan funded!
    }
    if ((loan.loan_amount - loan.funded_amount - loan.basket_amount) <= 75){ //or use "not much left on the loan!" when under $50/75?
        sp("This loan is almost fully funded.");
    }
}

function an_partner_risk(partner){
    var rate = parseFloat(partner.rating);
    if (rate == NaN) return; //happens for "Not Rated"
    if (rate >= 4.5) { //make user defined
        sp("Oh wow. " + partner.name + " is very highly rated, which means that the MFI has lower risk of failing.");
    }
    if (rate <= 2.5){ //make user defined
        sp("The field partner has a low rating, meaning it is higher risk.");
    }
}

function an_partner_stuff(partner) {
    if (partner.social_performance_strengths && partner.social_performance_strengths.length > 3) {
        sp("Nice! The field partner has a lot of social performance badges including " + partner.social_performance_strengths[get_rand_int(partner.social_performance_strengths.length)].name);
    }
}

an_wait_words();

//get_loan(id).then(get_partner_id_from_loan).done()

get_loan(id).done(short_talk_loan).done(function(loan){
    //todo: switch to get_partner
    $.ajax({url: "http://api.kivaws.org/v1/partners/"+ loan.partner_id +".json",
        crossDomain: true,
        type: "GET",
        cache: true
    }).success(function(result){
        loan.partner = result.partners[0];
        analyze_loan(loan)
        cl(loan);
    });
});