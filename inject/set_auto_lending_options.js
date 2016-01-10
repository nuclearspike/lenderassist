var elem_enabled, intervalHandle

setTimeout(()=>{
    intervalHandle = setInterval(()=>{
        elem_enabled = $("#updateAutolendSettings-form").find("input[type=checkbox]:first")
        if (elem_enabled.length) {
            clearInterval(intervalHandle)
            assignPartners()
        }
    },500)
},500)


function assignPartners() {
    if (elem_enabled[0].checked) {
        sp("Setting your auto-lending features from Kiva Lens")
        var lbLink = $('a[data-kv-criteria=partners]')
        if (lbLink.length)
            lbLink[0].click()
        else
            sp("I cannot open the partner selection window. Please report this error.")

        setTimeout(()=> {
            setTimeout(()=> {
                get_cache('setAutoLendPartners').done(ids => {
                    if (ids.length) {
                        $(".lightboxTitleMisc").find("a.unCheckAllLink")[0].click()

                        ids.forEach(id=> {
                            var el = $(`input[value=${id}]`)[0];
                            if (!el) return;
                            el.checked = false;
                            el.click()
                        })
                        $(".closeLightboxButton.button")[0].click()
                        set_cache('setAutoLendPartners', []) //should check that it worked
                        $("#updateAutolendSettings-form").find("button[type=submit]")[0].click()
                    } else {
                        sp("Something went wrong. Could not find any partners to enable.")
                    }
                })
            }, 200)
        }, 200)
    } else {
        alert("Message from KivaLens/Kiva Lender Assistant: You do not currently have your auto-lending turned on. Cannot set partners. Aborting. Turn on Auto-Lending and save. Then click 'Reload' in your browser to continue.")
    }
}