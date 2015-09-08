cl("lend.js processing");
///LOAN PAGES
//basic analysis

var block_wait_words = true;

//todo: turn 'concerns' into something that will eventually be set in the properties form by the user.
var concerns = {high_months_to_payback: 12, low_months_to_payback: 5};

function analyze_loan(loan){
    an_massage(loan);
    an_status(loan);
    if (loan.status != 'fundraising') {
        if (['issue', 'reviewed', 'inactive'].indexOf(loan.status) > -1) {
            sp("Well, that's weird. The API for Kiva is showing that this loan is still in the " + loan.status + " state. I'm not going to analyze this loan any further.", loan);
        }
        return;
    }
    an_loan_attr(loan);
    an_repayment_term(loan);
    get_partner_from_loan(loan).done([an_partner_risk, an_partner_stuff]);
    an_lender(loan);
}

function an_lender(loan){
    if (lender_id == undefined) return; //we can't look up information on a lender

    combine_all_and_active_verse_data('lender', lender_id, 'country').done(function(data){
        cl(data);
        var cur_country_rank_all = data.all.ordered.indexOf(loan.location.country);
        if (cur_country_rank_all > -1 && cur_country_rank_all < 10){
            sp("It looks like " + loan.location.country + " is one of your favorite lending countries.", lender_id);
        }

        var cur_country_rank_active = data.active.ordered.indexOf(loan.location.country);
        if (cur_country_rank_all > -1){ //you've made a loan before.
            var to_say;

            if (data.all.totals[loan.location.country] > 1){
                to_say = "You've made " + plural(data.all.totals[loan.location.country], "loan") +  " in " + loan.location.country + "  "
            } else {
                to_say = "You've made a loan to someone in " + loan.location.country + " before, "
            }

            if (cur_country_rank_active < 0){
                sp(to_say + "but you have no active loans in that country. Maybe it's time to make another loan in " + loan.location.country, lender_id);
            } else {
                if (data.active.totals[loan.location.country] == 1){
                    sp(to_say + "and you still have one loan paying back.");
                } else {
                    sp(to_say + "and you have " + data.active.totals[loan.location.country] + " loans still paying back.", lender_id);
                }
            }
        } else { //never before
            sp("You've never lent to anyone in " + loan.location.country + " before. Maybe now is the time.", loan);
        }

    }).fail(function(){cl("failed;")});
}

function an_wait_words(){
    if (block_wait_words) return;
    var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
    sp_rand(wait_words); //not interrupting speech
}

function an_massage(loan){
    loan.final_payment = Date.parse(loan.terms.scheduled_payments[loan.terms.scheduled_payments.length - 1].due_date);
}

function an_status(loan){
    if (loan.status == 'funded'){
        sp("This loan has already been fully funded.", loan);
        sp_once("loan_detail_look_at_similar", "Look at the top of the page to find similar loans."); //
    }
}

function an_repayment_term(loan){
    if (loan.status != 'fundraising') return;
    var months_to_go = (loan.final_payment - Date.now()) / month;

    var frd = new Date(loan.final_payment);

    if (Math.ceil(months_to_go) <= concerns.low_months_to_payback ){
        sp("That's great! This loan should pay back in " + h_make_date(frd) + " which is only " + Math.ceil(months_to_go) + " months away.", loan);
    }

    if (Math.floor(months_to_go) >= concerns.high_months_to_payback){
        sp("Note: The final repayment isn't until " + h_make_date(frd) + " which is " + Math.floor(months_to_go) + " months away.", loan);
    }

    if (loan.terms.disbursal_date) { //should only be doing any of this IFF fundraising.
        var predisbursal_date = new Date(Date.parse(loan.terms.disbursal_date));
        //it should look at the repayment schedule before making this comment!
        var days_ago_pred = Math.floor((Date.now() - predisbursal_date) / day);
        sp("The money was pre-disbursed " + days_ago_pred + " days ago", loan);
        if (Date.parse(loan.terms.local_payments[0].date) < Date.now()){
            sp("And they've already started paying back", loan);
        //    sp("Nice! The borrower has already received the money in " + h_make_date(predisbursal_date) + " which means your repayments will generally start sooner with a lump sum at the start.", loan);
        }
    }
}

function an_loan_attr(loan){
    if (Date.now() - Date.parse(loan.posted_date) < hour * 3){
        sp("This only just posted within the past few hours.", loan);
    }
    if (loan.funded_amount == 0) { //due to lag of API, this could be wrong.
        sp("You can be the first person to lend to this borrower.", loan)
    }
    if (Date.parse(loan.planned_expiration_date) - Date.now() < 3 * day){
        sp("This loan is expiring soon.", loan); // Rally your teams to get this loan funded!
    }
    if ((loan.loan_amount - loan.funded_amount - loan.basket_amount) <= 75){ //or use "not much left on the loan!" when under $50/75?
        sp("This loan is almost fully funded.", loan);
    }
}

function an_partner_risk(partner){
    var rate = parseFloat(partner.rating);
    if (isNaN(rate)) return; //happens for "Not Rated"
    if (rate >= 4.5) { //make user defined
        sp("Oh wow. The MFI is very highly rated, which means that the MFI has lower risk of failing.", partner);
    }
    if (rate <= 2.5){ //make user defined
        sp("The field partner has a low risk rating, meaning it is higher risk.", partner);
    }
}

function an_partner_stuff(partner) {
    if (partner.social_performance_strengths && partner.social_performance_strengths.length > 3) {
        sp("Nice! The field partner has a lot of social performance badges including " + partner.social_performance_strengths[get_rand_int(partner.social_performance_strengths.length)].name, partner);
    }
}

api_object.done([short_talk_loan, analyze_loan, function(){block_wait_words = true}]);

an_wait_words();