console.log("background.js processing");

///OMNIBOX
chrome.omnibox.onInputChanged.addListener(
    function(text, suggest)
    {
        text = text.replace(" ", "");

        // Add suggestions to an array
        var suggestions = [];
        suggestions.push({content: 'http://www.kiva.org/lend', description: "Kiva Loan Search"});
        suggestions.push({content: 'https://www.kiva.org/portfolio', description: "Kiva Portfolio"});
        suggestions.push({content: 'https://www.kiva.org/portfolio/estimated-repayments', description: "Kiva Estimated Repayments"});

        // Set first suggestion as the default suggestion
        chrome.omnibox.setDefaultSuggestion({description:suggestions[0].description});

        // Remove the first suggestion from the array since we just suggested it
        suggestions.shift();

        // Suggest the remaining suggestions
        suggest(suggestions);
    }
);

chrome.omnibox.onInputEntered.addListener(
    function(text)
    {
        chrome.tabs.getSelected(null, function(tab)
        {
            var url;
            if ((text.substr(0, 7) == 'http://') || ((text.substr(0, 8) == 'https://'))) {
                url = text;
            } else {
                url = 'http://www.kiva.org/lend?queryString=' + text;
            }
            chrome.tabs.update(tab.id, {url: url});
        });
    }
);

//background message receiver
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.utterance) {
        narrate(request.utterance, function() { sendResponse("Narrate: OK"); });
    } else if (request.funct) {
        console.log(request);
        eval(request.funct)(request.params);
        sendResponse("Received message to call function.")
    }
});

function create_tab(options){
    console.log("!!! creating tab");
    chrome.tabs.create(options);
}

function create_lender_id_tab(){
    chrome.tabs.create({ url: "https://www.kiva.org/myLenderId?lender_assist_closeme" });
}

function narrate(utterance, callback) {
    //utterance = '<?xml version="1.0"?>' + '<speak><emphasis>you are</emphasis>' + utterance + '</speak>';
    chrome.tts.speak(
        utterance,
        {
            enqueue: true,
            onEvent: function(ttsEvent) {
                if(ttsEvent.type == "error") { console.error("TTS Error:", ttsEvent); }
            }
        },
        function() {
            if(chrome.runtime.lastError !== undefined) {
                console.error("Runtime error:", chrome.runtime.lastError.message);
            }
            callback && callback();
        }
    );
}

//this isn't working...
chrome.storage.local.get("lender_id", function(res){
    if (is_not_set(res.lender_id)){
        sp("Many of the features of this extension require that you have a Kiva account. Please log in so I know who you are.");
        create_lender_id_tab();
    }
});

//happens when the extension loads
narrate("Let's make the world a better place.");