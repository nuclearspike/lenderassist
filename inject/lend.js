//LEND TAB
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
        $elem = $(elem);
        $elem.removeClass('lenderassist_needs_lookup');
        $elem.addClass('lenderassist_waiting');
        loan_ids.push($(elem).data('loan-id'));
    });
    //lookup all ids
    if (loan_ids.length == 0) return;
    get_loans(loan_ids).done(loans => {
        //for each loan returned, look for the
        //console.log(loans);
        $.each(loans, (i,loan)=>{
            //console.log(loan);
            //will only be one, possibly zero if page has changed since request was made.
            $(`.lenderassist_final_repay.lenderassist_waiting[data-loan-id=${loan.id}]`).each((i,elem)=>{
                //console.log(elem);
                receive_loan_data(loan, $(elem));
            })
        })
    })
}

function wire_loan_list($loan_cards){
    if_setting('add_on_repayment_loan_card').done(()=>{
        cache_tests_left = 1;
        $loan_cards.each(function(i,elem){
            wire_element_for_extra(elem);
        });
        cache_lookup_complete(); //hacky. this is to make sure all of the elems have been processed before it starts mass lookup
    })
}

//on page load, wire it up.
setTimeout(()=>{
    wire_loan_list($(".loanCards").find('.loanCard'));
},1000); //todo: this is bad. could miss if it takes longer, otherwise it waits too long.


//".loanCards"
//DON'T EXECUTE ON /LEND/1234

$(document).on("DOMNodeInserted", (e)=>{
    if (e.target.classList.contains('loanCards')) {
        wire_loan_list($(e.target).find('.loanCard'));
    }
});

function wire_element_for_extra(elem){
    var $elem = $(elem);

    //if we've already added it, don't add it again.
    if ($elem.find('.lenderassist_final_repay').length > 0){
        return;
    }
    //create the div to add
    var loan_id = url_to_parts($elem.find('.info_status h1 a').first().attr("href")).id;
    var $finalRepay = $(`<div class='lenderassist_final_repay lenderassist_needs_lookup' data-loan-id='${loan_id}'>Checking Repayment...</div>`);

    //add the block
    $elem.find('.details').first().append($finalRepay);
    cache_tests_left++;
    get_cache('loan_' + loan_id).done(loan => {
        //if we've already looked it up, just fill in the details immediately
        receive_loan_data(loan, $finalRepay);
    }).always(cache_lookup_complete);
}

function receive_loan_data(loan, $finalRepay){
    if (loan.terms.scheduled_payments.length > 0) {
        var last_payment = new Date(Date.parse(loan.terms.scheduled_payments[loan.terms.scheduled_payments.length - 1].due_date));
        var diff = roundedToFixed((last_payment - (new Date())) / (365 * 24 * 60 * 60 * 1000), 1);
        var spark_data = loan.terms.scheduled_payments.map(function(payment){return payment.amount});
        var spark = "<span class='sparkit'>"+ spark_data.join(',') +"</span>";
        $finalRepay.html('Final: ' + h_make_full_date(last_payment) + "<br/>" + diff + ' years<br/>' + spark);
        $finalRepay.find('span.sparkit').sparkline('html', {type: 'bar', barColor: 'blue', chartRangeMin: 0, barWidth: 2} );

    } else {
        $finalRepay.html('Unknown Final Date');
    }
    $finalRepay.removeClass('lenderassist_waiting');
    $finalRepay.removeClass('lenderassist_needs_lookup');
}
