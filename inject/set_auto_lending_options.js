'use strict'

const wait = ms => {
    var $d = $.Deferred()
    setTimeout(()=>{$d.resolve()},ms)
    return $d
}

//generic automation functions. some of this should be looking at node insertion events rather than just using timers.
const waitForElement = selector => {
    var $d = $.Deferred()
    var found = false

    function testForElement(selector) {
        found = $(selector).length > 0
        if (found) $d.resolve($(selector))
        return found
    }

    if (!testForElement(selector)) {
        var handle = setInterval(()=>{
            if (testForElement(selector)) clearInterval(handle)
        },200)
    }

    return $d
}

//generic function, can be moved.
function getQueryVariable(variable)
{
    var query = decodeURI(window.location.search.substring(1))
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return false
}

const clickElement = selector => {
    var lbLink = typeof selector == 'string'? $(selector) : selector
    if (lbLink.length) {
        lbLink[0].click() //open the partner selection window
        return true
    } else
        return false
}
const deselectAll = () => clickElement($(".lightboxTitleMisc").find("a.unCheckAllLink"))
const killLB = () => $("div.MyKiva_EditAutolendCriteriaView").remove()
const closeLightbox = () => {clickElement(".closeLightboxButton.button");killLB()}
const saveAutoLendSettings = () => clickElement($("#updateAutolendSettings-form").find("button[type=submit]"))

waitForElement("#updateAutolendSettings-form").done($el => {
    var $autoEnabled = $el.find("input[type=checkbox]:first")
    if ($autoEnabled.length && $autoEnabled[0].checked) {
        sp("Setting your auto-lending criteria from Kiva Lens")
        wait(20).then(assignPartners).then(wait.bind(null,500))
            .then(assignCountries).then(wait.bind(null,500))
            .then(assignSectors).then(wait.bind(null,500))
            .then(saveAutoLendSettings)
    } else {
        alert("Message from KivaLens/Kiva Lender Assistant: You do not currently have your auto-lending turned on. Cannot set partners. Aborting. Turn on Auto-Lending and save. Then click 'Reload' in your browser to continue.")
    }
})

// returns an array of anon objects containing the id, name and checked status of criteria.
function gatherNamesIds(){
    var results = []
    $('.MyKiva_EditAutolendCriteriaView .checkableControlSet').find('div').each((i,el)=>{
        var name = $(el).find("label").html()
        var cb = $(el).find('input')[0]
        results.push({checked: cb.checked, id: cb.value, name: name})
    })
    return results
}

function assignGeneric(singular, plural, url_param, byName) {
    var values = getQueryVariable(url_param)
    if (!values) return
    values = values.split(',')
    if (!values.length) return

    //open lightbox
    if (!clickElement(`a[data-kv-criteria=${plural}]`)){
      // should have actual error reporting to somewhere, not speech
        sp(`I cannot open the ${singular} selection window. Please report this error.`)
        return
    }

    var $lb = $("div.MyKiva_EditAutolendCriteriaView")
    var items = gatherNamesIds()
    var ids = byName ? items.where(i=>values.contains(i.name)).select(i=>i.id) : values

    var checked_ids = items.where(i=>i.checked).select(i=>i.id)
    var keep_check = ids.intersect(checked_ids) //which we want to keep.

    // if they are equal sizes, then nothing has changed. leave
    if (keep_check.length == ids.length) {
        sp(`Your list of ${plural} has not changed`)
        closeLightbox()
        return
    }

    var to_check = ids.where(id => !checked_ids.includes(id))
    var to_uncheck = checked_ids.where(id => !ids.includes(id))

    //reverse the ones that need switching.
    to_check.concat(to_uncheck).forEach(id => {
        var el = $lb.find(`input[value=${id}]`)[0]
        if (!el) return
        el.click()
    })

    if (to_check.length)
        sp(`${to_check.length} more ${to_check.length == 1 ? singular: plural} added`)

    if (to_uncheck.length)
        sp(`${to_uncheck.length} ${to_uncheck.length == 1 ? singular: plural} removed`)

    if (keep_check.length)
        sp(`${keep_check.length} ${keep_check.length == 1 ? singular: plural} remained unchanged.`)

    //close lightbox
    closeLightbox()
}

//function adjust
function assignPartners() {
    assignGeneric('partner', 'partners', 'partner_ids', false)
}

function assignCountries() {
    assignGeneric('country', 'countries', 'countries', true)
}

function assignSectors(){
    assignGeneric('sector', 'sectors', 'sectors', true)
}
