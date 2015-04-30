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
        narrate(request.utterance, request.interrupt, request.callback);
    } else if (request.funct) {
        console.log(request);
        eval(request.funct)(request.params);
        sendResponse("Received message to call function.")
    } //else if (request.get_lender)
});

var last_utterances = [];

function narrate(utterance, interrupt, callback) {
    //utterance = '<?xml version="1.0"?>' + '<speak><emphasis>you are</emphasis>' + utterance + '</speak>';

    if (last_utterances.indexOf(utterance) > -1) {
        callback && callback("Skipped: " + utterance);
    }
    last_utterances.push(utterance);

    if (interrupt && chrome.tts.isSpeaking()){
        chrome.tts.stop();
    }
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
            callback && callback("Spoken: " + utterance);
        }
    );
    if (last_utterances.length > 20) {
        last_utterances.shift();
    }
}

//happens when the extension loads
//narrate(pick_random(["Let's make the world a better place.","Things are looking better every day!", "Isn't it time to check out Kiva again?"]));

narrate("Here we go again...");