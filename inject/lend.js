"use strict";
/////////////////////////////////////////
// LEND TAB
/////////////////////////////////////////

var cache_tests_left = 1; //
function cache_lookup_complete() {
  cache_tests_left--;
  if (cache_tests_left == 0) {
    perform_mass_loan_lookup();
    cache_tests_left = 0; //shouldn't happen
  }
}

function perform_mass_loan_lookup() {
  var loan_ids = [];
  //collect ids to look up
  $(".lenderassist_additional.lenderassist_needs_lookup").each((i, elem) => {
    var $elem = $(elem);
    $elem.removeClass('lenderassist_needs_lookup').addClass('lenderassist_waiting');
    loan_ids.push($elem.data('loan-id'));
  });
  //lookup all ids
  if (loan_ids.length == 0) return;
  cl("looking up: ", loan_ids)
  get_loans(loan_ids).done(loans => {
    loan_ids.forEach(id => {
      $(`.lenderassist_additional.lenderassist_waiting[data-loan-id=${id}]`).each((i, elem) => {
        receive_loan_data(loans.first(l => l.id == id), $(elem));
      })
    })
  })
}

var show_partner, show_repayments;

function wire_loan_list() {
  console.log('wire_loan_list');
  get_settings().done(settings => {
    show_partner = settings.add_on_always_show_partner_on_lend_tab;
    show_repayments = settings.add_on_repayment_loan_card;

    if (show_partner || show_repayments) {
      cache_tests_left = 1;
      const isListView = $('.list-view-header:visible').length > 0;
      $(".loancards-list li .loan-card").each((i, elem) => wire_element_for_extra_old(elem, isListView));
      $(".loancards-list li .loan-card-2").each((i, elem) => wire_element_for_extra(elem, isListView));
      cache_lookup_complete(); //hacky. this is to make sure all of the elems have been processed before it starts mass lookup
    }
  })
}

function wire_element_for_extra_old(elem, isListView){
  var $elem = $(elem);

  console.log('wire for extra', $elem);
  //if we've already added it, don't add it again.
  if ($elem.find('.lenderassist_additional').length > 0){
    return;
  }

  //create the div to add
  var loan_id = url_to_parts($elem.find('.borrower-image-wrap a').first().attr("href")).id;
  var $finalRepay = show_repayments ? `<div class='lenderassist_final_repay'>Checking Repayment...</div>` : '';
  var $partnerName = show_partner && !isListView ? `<div class='lenderassist_partner'>Looking up Partner...</div>` : '';
  var $klaAdditional =  $(`<div class='lenderassist_additional lenderassist_needs_lookup' data-loan-id='${loan_id}'>${$finalRepay} ${$partnerName}</div>`);

  //add the block
  if (isListView) { //LIST VIEW
    $elem.find('.borrower-footer-wrap').first().after($klaAdditional);
  } else { //CARD VIEW
    $elem.find('.borrower-details-wrap').first().before($klaAdditional);
  }
  cache_tests_left++;
  get_cache('loan_graph_' + loan_id).done(loan => {
    //if we've already looked it up, just fill in the details immediately
    cl("found cache: ", loan)
    receive_loan_data(loan, $klaAdditional);
  }).always(cache_lookup_complete);
}

function wire_element_for_extra(elem, isListView) {
  var $elem = $(elem);

  console.log('wire for extra', $elem);
  //if we've already added it, don't add it again.
  if ($elem.find('.lenderassist_additional').length > 0) {
    return;
  }

  // $elem.height(null);

  //create the div to add
  var loan_id = url_to_parts($elem.find('.loan-card-2-image-wrap a').first().attr("href")).id;
  var $finalRepay = show_repayments ? `<div class='lenderassist_final_repay'>Checking Repayment...</div>` : '';
  var $partnerName = show_partner && !isListView ? `<div class='lenderassist_partner'>Looking up Partner...</div>` : '';
  if (show_partner) {
    $elem.addClass('partner-name')
  }
  if (show_repayments) {
    $elem.addClass('spark-lines')
  }
  var $klaAdditional = $(`<div class='lenderassist_additional lenderassist_needs_lookup' data-loan-id='${loan_id}'>${$finalRepay} ${$partnerName}</div>`);

  // //add the block
  if (isListView) { //LIST VIEW
    $elem.find('.borrower-loan-length span').first().after($klaAdditional);
  } else { //CARD VIEW
    $elem.find('.matching-line').first().after($klaAdditional);
  }
  cache_tests_left++;
  get_cache('loan_graph_' + loan_id).done(loan => {
    //if we've already looked it up, just fill in the details immediately
    cl("found cache: ", loan)
    receive_loan_data(loan, $klaAdditional);
  }).always(cache_lookup_complete);
}

function receive_loan_data(loan, $klaAdditional) {
  if (show_repayments) {
    var $finalRepay = $klaAdditional.find(".lenderassist_final_repay")
    if (!loan) { //happens for Zip loans for now...
      $finalRepay.html('Unknown Final Date');
    } else if (loan.repayments && loan.repayments.length > 0) {
      var last_payment = new Date(loan.final_repayment);
      var diff = roundedToFixed((last_payment - (new Date())) / (30 * 24 * 60 * 60 * 1000), 1);
      var spark_data = loan.repayments.select(r => r.amount)
      var spark = "<span class='sparkit'>" + spark_data.join(',') + "</span>";
      $finalRepay.html(`Final: ${last_payment.toString('MMM d, yyyy')} (${diff} months ${loan.terms.repayment_interval})<br/>` + spark);
      $finalRepay.find('span.sparkit').sparkline('html', {
        type: 'bar',
        barColor: 'blue',
        chartRangeMin: 0,
        barWidth: 2
      });
    } else {
      $finalRepay.html('Unknown Final Date');
    }
  }

  if (show_partner) {
    var $partnerName = $klaAdditional.find(".lenderassist_partner")
    if (!loan) {
      $partnerName.html('');
    } else if (loan.partner && loan.partner.name) {
      $partnerName.html(loan.partner.name)
    } else {
      $partnerName.html("No Partner (Direct)")
    }
  }

  $klaAdditional.removeClass('lenderassist_waiting');
  $klaAdditional.removeClass('lenderassist_needs_lookup');
}

/////////////////////////////////////////
// LOAN PAGE
/////////////////////////////////////////

var block_wait_words = true;

function analyze_loan(loan) {
  if_setting(['speech_enabled', 'speech_enabled_analyze_loan']).done(settings => {
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
    if (settings.speech_enabled_analyze_loan_relate_to_portfolio) {
      an_lender(loan);
    }
  });
}

function an_lender(loan) {
  if (lender_id == undefined) return; //we can't look up information on a lender

  combine_all_and_active_verse_data('lender', lender_id, 'country').done(data => {
    cl(data);
    var cur_country_rank_all = data.all.ordered.indexOf(loan.location.country);
    if (cur_country_rank_all > -1 && cur_country_rank_all < 10) {
      sp(`It looks like ${loan.location.country} is one of your favorite lending countries.`, lender_id);
    }

    var cur_country_rank_active = data.active.ordered.indexOf(loan.location.country);
    if (cur_country_rank_all > -1) { //you've made a loan before.
      var to_say;

      if (data.all.totals[loan.location.country] > 1) {
        to_say = `You've made ${plural(data.all.totals[loan.location.country], "loan")} in ${loan.location.country} `
      } else {
        to_say = `You've made a loan to someone in ${loan.location.country} before, `
      }

      if (cur_country_rank_active < 0) {
        sp(to_say + "but you have no active loans in that country. Maybe it's time to make another loan in " + loan.location.country, lender_id);
      } else {
        if (data.active.totals[loan.location.country] == 1) {
          sp(to_say + "and you still have one loan paying back.");
        } else {
          sp(to_say + `and you have ${data.active.totals[loan.location.country]} loans still paying back.`, lender_id);
        }
      }
    } else { //never before
      sp(`You've never lent to anyone in ${loan.location.country} before. Maybe now is the time.`, loan);
    }

  }).fail(cl.bind(null, "failed;"))
}

function an_wait_words() {
  if (block_wait_words) return;
  var wait_words = ["Hum, just a second", "Let me look at this.", "Interesting...", "Look at this one.", "", "One second.", "Hold on...", "Wow.", "Okay.", "Ooo.", "Just a moment.", "What do you think about this one?", "Here we go."];
  sp_rand(wait_words); //not interrupting speech
}

function an_massage(loan) {
  // massage the data
  var last_payment = loan.terms.scheduled_payments.last()
  loan.final_payment = last_payment ? new Date(last_payment.due_date) : null
}

function an_status(loan) {
  if (loan.status == 'funded') {
    sp("This loan has already been fully funded.", loan);
    sp_once("loan_detail_look_at_similar", "Look at the top of the page to find similar loans."); //
  }
}

function an_repayment_term(loan, low, high) {
  if (loan.status != 'fundraising') return;
  var months_to_go = (loan.final_payment - new Date()) / month

  var frd = loan.final_payment;

  if (Math.ceil(months_to_go) <= low) {
    sp(`That's great! This loan should pay back in ${h_make_date(frd)} which is only ${Math.ceil(months_to_go)} months away.`, loan);
  }

  if (Math.floor(months_to_go) >= high) {
    sp(`Note: The final repayment isn't until ${h_make_date(frd)} which is ${Math.floor(months_to_go)}  months away.`, loan);
  }

  if (loan.terms.disbursal_date) {
    var predisbursal_date = new Date(loan.terms.disbursal_date);
    //it should look at the repayment schedule before making this comment!
    var days_ago_pred = Math.floor((Date.now() - predisbursal_date) / day);
    if (days_ago_pred > 0) {
      sp(`The money was pre-disbursed ${days_ago_pred} days ago`, loan);
    }
  }
}

function an_loan_attr(loan) {
  if (new Date() - new Date(loan.posted_date) < 3 * hour) {
    sp("This only just posted within the past few hours.", loan);
  }
  if (loan.funded_amount == 0) { //due to lag of API, this could be wrong.
    sp("You can be the first person to lend to this borrower.", loan)
  }
  if (new Date(loan.planned_expiration_date) - new Date() < 3 * day) {
    sp("This loan is expiring soon.", loan); // Rally your teams to get this loan funded!
  }
  if ((loan.loan_amount - loan.funded_amount - loan.basket_amount) <= 75) { //or use "not much left on the loan!" when under $50/75?
    sp("This loan is almost fully funded.", loan);
  }
}

function an_partner_risk(partner) {
  var rate = parseFloat(partner.rating);
  if (isNaN(rate)) {
    sp('The MFI is not rated.');
    return;
  } //happens for "Not Rated"
  if (rate >= 4.5) { //make user defined
    sp("Oh wow. The MFI is very highly rated, which means that the MFI has lower risk of failing.", partner);
  }
  if (rate <= 2.5) { //make user defined
    sp("The field partner's risk rating indicates it is higher risk.", partner);
  }
}

function an_partner_stuff(partner) {
  if (partner.social_performance_strengths && partner.social_performance_strengths.length > 3) {
    sp("Nice! The field partner has a lot of social performance badges including " + partner.social_performance_strengths[get_rand_int(partner.social_performance_strengths.length)].name, partner);
  }
}

function addKLToMenu() {
  var loanFromURL = url_to_parts(location.href).id
  if (loanFromURL)
    $('#my-kiva-dropdown').find('li').first().after($(`<li><a href="http://www.kivalens.org/#/search/loan/${loanFromURL}" target="_blank" class="elem_track_click" data-elem="sec_messages" id="loggedInMenuKivaLensLoan" style="opacity: 1;">View Loan on KivaLens.org</a></li>`))
}

/////////////////////////////////////////
function treatAsLendTab() {
  //on page load, wire it up.
  setTimeout(() => {
    wire_loan_list();
  }, 2000); //todo: this is bad. could miss if it takes longer, otherwise it waits too long.

  $(document).on("DOMNodeInserted", (e) => {
    if (e.target.classList.contains('loancards-list')) {
      wire_loan_list();
    }
  });
}

function addGraphs(loan) {
  const config = loanData => {
    return {
      chart: {
        alignTicks: false,
        type: 'bar',
        animation: false,
        backgroundColor: "#EFEFEF"
      },
      title: {text: null},
      xAxis: {
        categories: loanData.repayments.map(r => r.display),
        title: {text: null}
      },
      yAxis: [{
        min: 0,
        dataLabels: {enabled: false},
        labels: {overflow: 'justify'},
        title: {text: 'USD'}
      },
        {
          min: 0,
          max: 100,
          dataLabels: {enabled: false},
          labels: {overflow: 'justify'},
          title: {text: 'Percent'}
        }],
      tooltip: {
        valueDecimals: 2
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true,
            valueDecimals: 2,
            format: '${y:.2f} USD'
          }
        },
        area: {
          marker: {enabled: false},
          dataLabels: {
            enabled: false,
            valueDecimals: 0,
            format: '{y:.0f}%'
          }
        }
      },
      legend: {enabled: false},
      credits: {enabled: false},
      series: [{
        type: 'column',
        animation: false,
        zIndex: 6,
        name: 'Repayment',
        data: loanData.repayments.map(r => r.amount),
      }, {
        type: 'area',
        animation: false,
        yAxis: 1,
        zIndex: 5,
        name: 'Percentage',
        data: loanData.repayments.map(r => r.percent),
      }]
    }
  }

  if (!loan || !loan.repayments) return
  var height = Math.max(400, Math.min(loan.repayments.length * 50, 1000))
  var container = $(`<div style='z-index:1000; height:${height}px'/>`)
  var repayments = $("section.repayment-schedule")
  repayments.append(container)
  container.highcharts(config(loan))

  var graphs = $(`<div>Interval: ${loan.terms.repayment_interval}</div>
            <div>${Math.round(loan.half_back_actual)}% back by: ${loan.half_back}</div>
            <div>${Math.round(loan.three_fourths_back_actual)}% back by: ${loan.three_fourths_back}</div>
            <div>Final Repayment: ${loan.final_repayment}</div>`)
  repayments.append(graphs)

  cl("REPAY: ", loan)

}

function addAtheistTeamScore(loan) {
  console.log('addAtheistTeamScore:loan', loan);
  if (!loan.partner || !loan.partner.atheistScore) return;

  function generateEntry(title, data, lightboxText, id) {
    return $(`<div id="partner-atheist-${id}" class="datum">
						                <a class="black-underlined" data-reveal-id="partner-atheist-${id}-lightbox">${title}</a>:
						                <strong>
						                    ${data}
						                </strong>
						            </div>
						            <div id="partner-atheist-${id}-lightbox" class="reveal-modal" data-reveal="" aria-hidden="true" role="dialog">
						                    <div class="row">
						                        <div class="columns small-12">
						                            <a class="close-reveal-modal" aria-label="Close">
						                                <svg class="icon icon-x">
						                                    <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-x"></use>
						                                </svg>
						                            </a>
						                            <div class="lightbox-content white">
						                                <h1 class="white">${title}</h1>
						                                <p class="featured white"></p><div>${lightboxText}<br/><p/><p/><p>
						                                This data was added to the page by the Kiva Lender Assistant Chrome Extension. It was pulled from the Atheist Team's <a href="https://docs.google.com/spreadsheets/d/1KP7ULBAyavnohP4h8n2J2yaXNpIRnyIXdjJj_AwtwK0/edit#gid=1">Google spreadsheet</a> by <a href="http://www.kivalens.org">KivaLens' server</a> on a regular basis.
						                                If you have any questions regarding any of this research, please contact the <a href="https://www.kiva.org/team/a_atheists_agnostics_skeptics_freethinkers_secular_humanists_and_the_nonreligious">Atheist Team</a> on Kiva, do not contact Kiva's Customer Service, Kiva is not involved.</p></div><p></p>
						                            </div>
						                        </div>
						                    </div>
						                </div>`)
  }

  const $atheistScore = [generateEntry('Secular Rating', loan.partner.atheistScore.secularRating, `A rating from 1 to 4 where 4 is the highest, indicating a purely secular organization and a 1 is a very religious organization. If you would like to filter by this data, use <a href="http://www.kivalens.org">KivaLens</a> and set the option on the Partner tab.`, 'secular'),
    generateEntry('Comments on Rating', loan.partner.atheistScore.commentsOnSecularRating, "The reviewer's explanation of how they arrived at the score.", 'secular-comment'),
    generateEntry('Social Rating', loan.partner.atheistScore.socialRating, `A rating from 1 to 4 where 4 is the highest, indicating a partner that engages in helping their community with the proceeds from the loans.  If you would like to filter by this data, use <a href="http://www.kivalens.org">KivaLens</a> and set the option on the Partner tab.`, 'social'),
    generateEntry('Comments on Rating', loan.partner.atheistScore.commentsOnSocialRating, "The reviewer's explanation of how they arrived at the score.", 'social-comment'),
    generateEntry('Religious Affiliation', loan.partner.atheistScore.religiousAffiliation, "Based on details from the partner's website, what, if any, religious affiliation do they have.", 'religious-affiliation'),
    generateEntry('Review Comments', loan.partner.atheistScore.reviewComments, "Comments about the review.", 'review-comments')
  ];

  $('div.field-partner-data').append($atheistScore);
}

function treatAsLoanPage(id) {
  $(() => {
    /*
    if_setting("add_on_always_show_partner_on_loan").done(()=> {
        $("#ac-field-partner-details-body-right").attr("aria-hidden", false);
        $(".field-partner-details .ac-container .ac-dropdown-icon").remove();
        $("#ac-trustee-info-body-right").attr("aria-hidden", false);
        $(".trustee-details .ac-container .ac-dropdown-icon").remove();
    });
    */
    api_object.done(loan => {
      if (loan.status == "fundraising") {
        var expiration = new Date(loan.planned_expiration_date);
        $(".loan-total").after($(`<div>Expires: ${expiration.toString("MMM d, yyyy h:mm tt")} </div>`))
      }
      var posted = new Date(loan.posted_date);
      $(".loan-total").after($(`<div>Posted: ${posted.toString("MMM d, yyyy h:mm tt")} </div>`))
    }).fail(function() {return true})

    get_loan_detail(id).done(loan => {
      if_setting("display_atheist_scores").done(() => {
        addAtheistTeamScore(loan)
      })
      if_setting("add_on_always_show_repayments_on_loan").done(() => {
        addGraphs(loan) ///loan
      })
    })

    addKLToMenu() //adds "view loan on KL"
  })

  if_setting(['speech_enabled', 'speech_enabled_analyze_loan']).done(() =>
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
    treatAsLoanPage(id)
}