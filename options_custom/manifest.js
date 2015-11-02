// SAMPLE
this.manifest = {
    "name": "Kiva Lender Assistant Extension",
    "icon": "/icons/icon48.png",
    "settings": [
        {   "tab": "Speech",
            "group": "Master Switch",
            "name": "speech_enabled",
            "type": "checkbox",
            "label": "Enable Speech. Disable this to prevent this extension from speaking to you."
        },


        {   "tab": "Speech",
            "group": "Hover-over Links",
            "name": "speech_enabled_hover_loan",
            "type": "checkbox",
            "label": "Loans (speak sector, name, location)"
        },
        {   "tab": "Speech",
            "group": "Hover-over Links",
            "name": "speech_enabled_hover_lender",
            "type": "checkbox",
            "label": "Lenders (speak location, loan count, how long they've been on Kiva)"
        },
        {   "tab": "Speech",
            "group": "Hover-over Links",
            "name": "speech_enabled_hover_team",
            "type": "checkbox",
            "label": "Teams (speak longevity, member count, loan count)"
        },
        {   "tab": "Speech",
            "group": "General",
            "name": "speech_enabled_live",
            "type": "checkbox",
            "label": "Read ticker on /Live Page and add comments about loans, lenders and teams if time."
        },


        {   "tab": "Speech",
            "group": "General",
            "name": "speech_enabled_analyze_lender",
            "type": "checkbox",
            "label": "Analyze lender on lender page (comment on top sectors and countries, loan count and invitations)"
        },
        {   "tab": "Speech",
            "group": "General",
            "name": "speech_enabled_analyze_team",
            "type": "checkbox",
            "label": "Analyze teams on team page (comment on size and impact of team and top sectors and countries)"
        },
        {   "tab": "Speech",
            "group": "General",
            "name": "speech_enabled_analyze_partner",
            "type": "checkbox",
            "label": "Analyze partner on partner page"
        },
        {
            "tab": "Speech",
            "group": "General",
            "name": "speech_enabled_startup",
            "type": "checkbox",
            "label": "Speak when extension starts up"
        },


        {   "tab": "Speech",
            "group": "Loan Details",
            "name": "speech_enabled_analyze_loan",
            "type": "checkbox",
            "label": "Analyze loan (All off when unchecked)"
        },
        {   "tab": "Speech",
            "group": "Loan Details",
            "name": "speech_enabled_analyze_loan_relate_to_portfolio",
            "type": "checkbox",
            "label": "Relate loan to your porfolio (recognize when it's one of your favorite countries, etc)"
        },
        {   "tab": "Speech",
            "group": "Loan Details",
            "name": "speech_enabled_analyze_loan_repayment_terms",
            "type": "checkbox",
            "label": "Comment on 'very short' and 'very long' repayment terms"
        },
        {
            "tab": "Speech",
            "group": "Loan Details",
            "name": "low_months_to_payback",
            "type": "slider",
            "label": "How many months is 'very short'?",
            "max": 12,
            "min": 3,
            "step": 1,
            "display": true
        },
        {
            "tab": "Speech",
            "group": "Loan Details",
            "name": "high_months_to_payback",
            "type": "slider",
            "label": "How many months is 'very long'?",
            "max": 48,
            "min": 8,
            "step": 1,
            "display": true
        },
        {   "tab": "Speech",
            "group": "Loan Details",
            "name": "speech_enabled_analyze_loan_attributes",
            "type": "checkbox",
            "label": "Mention: Expiring soon, recently posted, almost funded, and if no one else has loaned anything."
        },
        {   "tab": "Speech",
            "group": "Loan Details",
            "name": "speech_enabled_analyze_loan_partner",
            "type": "checkbox",
            "label": "Comment on partner risk and social performance badges"
        },




        {   "tab": "Other",
            "group": "Add-on",
            "name": "add_on_repayment_loan_card",
            "type": "checkbox",
            "label": "Add final repayment date, time to end of loan and sparklines to loan cards on /lend"
        },
        {
            "tab": "Other",
            "group": "Omnibar",
            "name": "add_on_omnibar",
            "type": "checkbox",
            "label": "When typing in Chrome's Location/Search bar (Omnibar) send queries like 'kiva cattle' to search for 'cattle' on Kiva's lend tab rather than to Google."
        },
        {
            "tab": "Other",
            "group": "Debug",
            "name": "debug_output_to_console",
            "type": "checkbox",
            "label": "Output debugging messages to console"
        }
    ],
    "alignment" : [
        [
            "high_months_to_payback",
            "low_months_to_payback"
        ]
    ]
};

//    {
//        "tab": i18n.get("information"),
//        "group": i18n.get("login"),
//        "name": "username",
//        "type": "text",
//        "label": i18n.get("username"),
//        "text": i18n.get("x-characters")
//    },
//    {
//        "tab": i18n.get("information"),
//        "group": i18n.get("login"),
//        "name": "password",
//        "type": "text",
//        "label": i18n.get("password"),
//        "text": i18n.get("x-characters-pw"),
//        "masked": true
//    },
//    {
//        "tab": i18n.get("information"),
//        "group": i18n.get("login"),
//        "name": "myDescription",
//        "type": "description",
//        "text": i18n.get("description")
//    },
//    {
//        "tab": i18n.get("information"),
//        "group": i18n.get("logout"),
//        "name": "myCheckbox",
//        "type": "checkbox",
//        "label": i18n.get("enable")
//    },
//    {
//        "tab": i18n.get("information"),
//        "group": i18n.get("logout"),
//        "name": "myButton",
//        "type": "button",
//        "label": i18n.get("disconnect"),
//        "text": i18n.get("logout")
//    },
//    {
//        "tab": "Details",
//        "group": "Sound",
//        "name": "noti_volume",
//        "type": "slider",
//        "label": "Notification volume:",
//        "max": 1,
//        "min": 0,
//        "step": 0.01,
//        "display": true,
//        "displayModifier": function (value) {
//            return (value * 100).floor() + "%";
//        }
//    },
//    {
//        "tab": "Details",
//        "group": "Sound",
//        "name": "sound_volume",
//        "type": "slider",
//        "label": "Sound volume:",
//        "max": 100,
//        "min": 0,
//        "step": 1,
//        "display": true,
//        "displayModifier": function (value) {
//            return value + "%";
//        }
//    },
//    {
//        "tab": "Details",
//        "group": "Food",
//        "name": "myPopupButton",
//        "type": "popupButton",
//        "label": "Soup 1 should be:",
//        "options": {
//            "groups": [
//                "Hot", "Cold",
//            ],
//            "values": [
//                {
//                    "value": "hot",
//                    "text": "Very hot",
//                    "group": "Hot",
//                },
//                {
//                    "value": "Medium",
//                    "group": 1,
//                },
//                {
//                    "value": "Cold",
//                    "group": 2,
//                },
//                ["Non-existing"]
//            ],
//        },
//    },
//    {
//        "tab": "Details",
//        "group": "Food",
//        "name": "myListBox",
//        "type": "listBox",
//        "label": "Soup 2 should be:",
//        "options": [
//            ["hot", "Hot and yummy"],
//            ["cold"]
//        ]
//    },
//    {
//        "tab": "Details",
//        "group": "Food",
//        "name": "myRadioButtons",
//        "type": "radioButtons",
//        "label": "Soup 3 should be:",
//        "options": [
//            ["hot", "Hot and yummy"],
//            ["cold"]
//        ]
//    }
//],
//"alignment": [
//    [
//        "username",
//        "password"
//    ],
//    [
//        "noti_volume",
//        "sound_volume"
//    ]
//]