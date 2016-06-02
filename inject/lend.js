"use strict";
/////////////////////////////////////////
// LEND TAB
/////////////////////////////////////////

var cache_tests_left = 1; //
function cache_lookup_complete(){
    cache_tests_left--;
    if (cache_tests_left == 0){
        perform_mass_loan_lookup();
        cache_tests_left = 0; //shouldn't happen
    }
}

function perform_mass_loan_lookup(){
    var loan_ids = [];
    //collect ids to look up
    $(".lenderassist_final_repay.lenderassist_needs_lookup").each((i,elem) => {
        var $elem = $(elem);
        $elem.removeClass('lenderassist_needs_lookup').addClass('lenderassist_waiting');
        loan_ids.push($elem.data('loan-id'));
    });
    //lookup all ids
    if (loan_ids.length == 0) return;
    get_loans(loan_ids).done(loans => {
        $.each(loans, (i,loan)=>{
            //will only be one, possibly zero if page has changed since request was made.
            $(`.lenderassist_final_repay.lenderassist_waiting[data-loan-id=${loan.id}]`).each((i,elem)=>{
                receive_loan_data(loan, $(elem));
            })
        })
    })
}

function wire_loan_list($loan_cards){
    if_setting('add_on_repayment_loan_card').done(()=>{
        cache_tests_left = 1;
        $(".loancards-list li .loan-card").each(function(i,elem){
            wire_element_for_extra(elem);
        });
        cache_lookup_complete(); //hacky. this is to make sure all of the elems have been processed before it starts mass lookup
    })
}


function wire_element_for_extra(elem){
    var $elem = $(elem);

    //if we've already added it, don't add it again.
    if ($elem.find('.lenderassist_final_repay').length > 0){
        return;
    }
    //create the div to add
    var loan_id = url_to_parts($elem.find('.borrower-img-wrap').first().attr("href")).id;
    var $finalRepay = $(`<div class='lenderassist_final_repay lenderassist_needs_lookup' data-loan-id='${loan_id}'>Checking Repayment...</div>`);

    //add the block
    $elem.find('.borrower-details-wrap').first().before($finalRepay);
    cache_tests_left++;
    get_cache('loan_' + loan_id).done(loan => {
        //if we've already looked it up, just fill in the details immediately
        receive_loan_data(loan, $finalRepay);
    }).always(cache_lookup_complete);
}

function receive_loan_data(loan, $finalRepay){
    if (loan.terms.scheduled_payments && loan.terms.scheduled_payments.length > 0) {
        var last_payment = new Date(loan.terms.scheduled_payments[loan.terms.scheduled_payments.length - 1].due_date);
        var diff = roundedToFixed((last_payment - (new Date())) / (365 * 24 * 60 * 60 * 1000), 1);
        var payments = loan.terms.scheduled_payments.select(function(payment){
            return {due_date: new Date(payment.due_date).toString("MMM-yyyy"), amount: payment.amount}
        }) //todo: can be reduced
        var spark_data  = payments.groupBy(function(p){return p.due_date}).select(function(g){ return g.sum(function(r){return r.amount}) })
        var spark = "<span class='sparkit'>"+ spark_data.join(',') +"</span>";
        $finalRepay.html('Final: ' + last_payment.toString('MMM d, yyyy') + " (" + diff + ' years)<br/>' + spark);
        $finalRepay.find('span.sparkit').sparkline('html', {type: 'bar', barColor: 'blue', chartRangeMin: 0, barWidth: 2} );

    } else {
        $finalRepay.html('Unknown Final Date');
    }
    $finalRepay.removeClass('lenderassist_waiting');
    $finalRepay.removeClass('lenderassist_needs_lookup');
}

/////////////////////////////////////////
// LOAN PAGE
/////////////////////////////////////////

var block_wait_words = true;

function analyze_loan(loan){
    if_setting(['speech_enabled','speech_enabled_analyze_loan']).done(settings => {
        an_massage(loan);
        an_status(loan);
        if (loan.status != 'fundraising') {
            if (['issue', 'reviewed', 'inactive'].indexOf(loan.status) > -1) {
                sp(`Well, that's weird. The API for Kiva is showing that this loan is still in the ${loan.status} state. I'm not going to analyze this loan any further.`, loan);
            }
            return;
        }
        if (settings.speech_enabled_analyze_loan_attributes) {
            an_loan_attr(loan);
        }
        if (settings.speech_enabled_analyze_loan_repayment_terms) {
            an_repayment_term(loan, settings.low_months_to_payback, settings.high_months_to_payback);
        }
        if (settings.speech_enabled_analyze_loan_partner) {
            get_partner_from_loan(loan).done([an_partner_risk, an_partner_stuff]);
        }
        if (settings.speech_enabled_analyze_loan_relate_to_portfolio){
            an_lender(loan);
        }
    });
}

function an_lender(loan){
    if (lender_id == undefined) return; //we can't look up information on a lender

    combine_all_and_active_verse_data('lender', lender_id, 'country').done(data => {
        cl(data);
        var cur_country_rank_all = data.all.ordered.indexOf(loan.location.country);
        if (cur_country_rank_all > -1 && cur_country_rank_all < 10){
            sp(`It looks like ${loan.location.country} is one of your favorite lending countries.`, lender_id);
        }

        var cur_country_rank_active = data.active.ordered.indexOf(loan.location.country);
        if (cur_country_rank_all > -1){ //you've made a loan before.
            var to_say;

            if (data.all.totals[loan.location.country] > 1){
                to_say = `You've made ${plural(data.all.totals[loan.location.country], "loan")} in ${loan.location.country} `
            } else {
                to_say = `You've made a loan to someone in ${loan.location.country} before, `
            }

            if (cur_country_rank_active < 0){
                sp(to_say + "but you have no active loans in that country. Maybe it's time to make another loan in " + loan.location.country, lender_id);
            } else {
                if (data.active.totals[loan.location.country] == 1){
                    sp(to_say + "and you still have one loan paying back.");
                } else {
                    sp(to_say + `and you have ${data.active.totals[loan.location.country]} loans still paying back.`, lender_id);
                }
            }
        } else { //never before
            sp(`You've never lent to anyone in ${loan.location.country} before. Maybe now is the time.`, loan);
        }

    }).fail(cl.bind(null,"failed;"))
}

function an_wait_words(){
    if (block_wait_words) return;
    var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
    sp_rand(wait_words); //not interrupting speech
}

function an_massage(loan){
    loan.final_payment = new Date(loan.terms.scheduled_payments.last().due_date)
}

function an_status(loan){
    if (loan.status == 'funded'){
        sp("This loan has already been fully funded.", loan);
        sp_once("loan_detail_look_at_similar", "Look at the top of the page to find similar loans."); //
    }
}

function an_repayment_term(loan, low, high){
    if (loan.status != 'fundraising') return;
    var months_to_go = (loan.final_payment - new Date()) / month

    var frd = loan.final_payment;

    if (Math.ceil(months_to_go) <= low ){
        sp(`That's great! This loan should pay back in ${h_make_date(frd)} which is only ${Math.ceil(months_to_go)} months away.`, loan);
    }

    if (Math.floor(months_to_go) >= high){
        sp(`Note: The final repayment isn't until ${h_make_date(frd)} which is ${Math.floor(months_to_go)}  months away.`, loan);
    }

    if (loan.terms.disbursal_date) {
        var predisbursal_date = new Date(loan.terms.disbursal_date);
        //it should look at the repayment schedule before making this comment!
        var days_ago_pred = Math.floor((Date.now() - predisbursal_date) / day);
        if (days_ago_pred > 0) {
            sp(`The money was pre-disbursed ${days_ago_pred} days ago`, loan);
            //if (new Date(loan.terms.local_payments[0].date) < new Date()) {
            //    sp("And they've already started paying back", loan)
            //}
        }
    }
}

function an_loan_attr(loan){
    if (new Date() - new Date(loan.posted_date) < 3 * hour){
        sp("This only just posted within the past few hours.", loan);
    }
    if (loan.funded_amount == 0) { //due to lag of API, this could be wrong.
        sp("You can be the first person to lend to this borrower.", loan)
    }
    if (new Date(loan.planned_expiration_date) - new Date() < 3 * day){
        sp("This loan is expiring soon.", loan); // Rally your teams to get this loan funded!
    }
    if ((loan.loan_amount - loan.funded_amount - loan.basket_amount) <= 75){ //or use "not much left on the loan!" when under $50/75?
        sp("This loan is almost fully funded.", loan);
    }
}

function an_partner_risk(partner){
    var rate = parseFloat(partner.rating);
    if (isNaN(rate)) {
        sp('The MFI is not rated.');
        return;
    } //happens for "Not Rated"
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

function addKLToMenu(){
    var loanFromURL = url_to_parts(location.href).id
    if (loanFromURL)
        $('#my-kiva-dropdown').find('li').first().after($(`<li><a href="http://www.kivalens.org/#/search/loan/${loanFromURL}" target="_blank" class="elem_track_click" data-elem="sec_messages" id="loggedInMenuKivaLensLoan" style="opacity: 1;">View Loan on KivaLens.org</a></li>`))
}

/////////////////////////////////////////
function treatAsLendTab(){
    //on page load, wire it up.
    setTimeout(()=>{
        wire_loan_list();
    },1000); //todo: this is bad. could miss if it takes longer, otherwise it waits too long.

    //".loanCards"
    //DON'T EXECUTE ON /LEND/1234

    $(document).on("DOMNodeInserted", (e)=>{
        if (e.target.classList.contains('loancards-list')) {
            wire_loan_list();
        }
    });
}

function treatAsLoanPage() {
    $(()=> addKLToMenu())

    if_setting(['speech_enabled','speech_enabled_analyze_loan']).done(()=>
        api_object.done([short_talk_loan, analyze_loan, function () {
            block_wait_words = true
        }])
    );
    an_wait_words();
}

var id = url_to_parts(location.href).id

if (isNaN(id)) {
    treatAsLendTab()
} else {
    treatAsLoanPage()
}