cl("lender.js processing");
if_setting(['speech_enabled','speech_enabled_analyze_lender']).done(()=>
    api_object.done([short_talk_lender, sp_top_3_lender_stats, get_lender_teams])
);

function add3DWallLink(){
    var lenderId = url_to_parts(location.href).id
    $('dl.profileStats').prepend(`<dt>3D Loan Wall</dt><dd><a href="http://www.kivalens.org/#/portfolio?kivaid=${lenderId}" target="_blank" >View</a>`)
}

$(()=>{
    add3DWallLink()
    var invitees_arr = []
    $("ul.lenderCards .lenderCard a.thumb").each((i,e)=>{
        invitees_arr.push(url_to_parts(e.href).id)
    })
    if (invitees_arr.length) {
        get_lenders(invitees_arr.take(50)).done(invitees => {
            api_object.done(lender => {
                var i_loans = invitees.sum(i => i.loan_count)
                var i_invitees = invitees.sum(i => i.invitee_count)
                var max_amount = ''
                if ($("a[href*='show_all_invitees=']").length) max_amount = ' (up to the first 50) '
                $("ul.lenderCards").prepend(`<p>${lender.name}'s invitees ${max_amount} have made ${i_loans} loans and invited ${i_invitees} more lenders.</p>`)
            })
        })
    }
})