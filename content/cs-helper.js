function getCurrentUSerName() {
    var currentUserName = '';
    var pathname = window.location.pathname.toString();
    var result = pathname.split('/');
    if (result.indexOf("groups") > 0) {
        if ($('div[aria-label="Account Controls and Settings"]').length > 0) {
            currentUserName = $('div[aria-label="Account Controls and Settings"]').find('div[data-visualcompletion="ignore"]').parent('a:not([aria-label="Notifications"])').find('span:eq(0)').text();
            //console.log(currentUserName);
        }
        return currentUserName;
    }
}

var currentGroupId =  '';
var alphaGroupId = '';

function getFacebookGroupIds(){
    var pathname = window.location.pathname.toString(); 
    var result = pathname.split('/');
    
    if(result.indexOf("groups") > 0){
        //currentGroupId = result[(result.indexOf("groups")+1)];
        groupId = result[(result.indexOf("groups")+1)];

        console.log(groupId);
        var newurl = new URL(window.location.href);
        var currenthost = newurl.origin;
        console.log(currenthost+"/groups/"+groupId)
        if(groupId){
            $.ajax({
                type: "GET",
                url: currenthost+"/groups/"+groupId,
                success: function(data, txtStatus, request) {

                    var groupMetaUrl = $(data).filter("meta[property='al:android:url']").attr('content');
                    currentGroupId = groupMetaUrl.split('/group/')[1]; 
                    alphaGroupId = $(data).filter("meta[property='og:url']").attr('content');
                    alphaGroupId = alphaGroupId.split('/groups/')[1];
                    alphaGroupId = alphaGroupId.split('/')[0];
                    console.log(alphaGroupId); 
                    console.log(currentGroupId); 
                } 
            })
        }        
    }   
}

getFacebookGroupIds();

function getFbGroupSettings() {
    var pathname = window.location.pathname.toString(); 
    var result = pathname.split('/');
    if(result.indexOf("groups") > 0){
        //currentGroupId = result[(result.indexOf("groups")+1)];
        groupId = result[(result.indexOf("groups")+1)];
        console.log(groupId);
        var newurl = new URL(window.location.href);
        var currenthost = newurl.origin;
        console.log(currenthost);
        if(groupId){
            chrome.storage.local.get(["groupConfig","user","autoresponderList"], function(result) {
                if (typeof result.user != "undefined" ) {
                    globalAutoresponder = result.user.global_autoresponder_status;
                }
                if (typeof result.groupConfig != "undefined" ) {
                    groupSettingsExist = false;
                    if(result.groupConfig.length > 0 ){
                        var tempCurrentGroupDetails = []; 
                        result.groupConfig.forEach(function(item,i){
                                console.log('db numeric id : '+item.numeric_group_id);
                                console.log('get dom alpha : '+ alphaGroupId);
                                console.log('get dom numeric : '+currentGroupId);
                            if(item.numeric_group_id == currentGroupId || item.numeric_group_id == alphaGroupId){
                                var isNewLayout = true;
                            
                                if($('#bluebarRoot').length > 0){
                                    isNewLayout = false;
                                }

                                var sendAllFields = false; 

                                foundArIndex = result.autoresponderList.findIndex((ar)=>{return ar.id == item.autoresponder_id })
                                
                                if (foundArIndex > -1) {
                                    sendAllFields = result.autoresponderList[foundArIndex].get_all_fields
                                }
                                tempCurrentGroupDetails.push({
                                                            groupId:item.group_id,
                                                            groupFbId:item.fb_group_id,
                                                            groupNumericFbId:item.numeric_group_id,
                                                            google_sheet_url:item.google_sheet_url,
                                                            autoresponder_id:item.autoresponder_id,
                                                            autoresponder_url:item.api_url,
                                                            autoresponder_key:item.api_key,
                                                            autoresponder_status:item.autoresponder_status, 
                                                            email_index:item.email_index,
                                                            decline_message:item.decline_message, 
                                                            decline_message_status:item.decline_message_status,
                                                            decline_random_status: item.decline_random_status,
                                                            decline_message_two: item.decline_message_two,
                                                            decline_message_three: item.decline_message_three,
                                                            decline_interval: item.decline_interval,
                                                            decline_start_time: item.decline_start_time,
                                                            decline_limit: item.decline_limit,

                                                            welcome_message_one:item.welcome_message_one, 
                                                            welcome_message_status:item.welcome_message_status,
                                                            welcome_random_status: item.welcome_random_status,
                                                            welcome_message_two: item.welcome_message_two,
                                                            welcome_message_three: item.welcome_message_three,
                                                            welcome_message_four: item.welcome_message_four,
                                                            welcome_message_five: item.welcome_message_five,

                                                            welcome_interval: item.welcome_interval,
                                                            welcome_start_time: item.welcome_start_time,
                                                            welcome_limit: item.welcome_limit,

                                                            tag_message_one:item.tag_message_one, 
                                                            tag_message_two: item.tag_message_two,
                                                            tag_message_three: item.tag_message_three,
                                                            tag_message_four: item.tag_message_four,
                                                            tag_message_five: item.tag_message_five,
                                                            tag_status:item.tag_status,
                                                            tag_random_status: item.tag_random_status,
                                                            tag_post_url: item.welcome_post_id,
                                                            tag_all: item.tag_all,
                                                            with_text: item.with_text,
                                                            chatsilo_tag_status: item.chatsilo_tag_status,
                                                            chatsilo_tag_ids: item.chatsilo_tag_ids,
                                                            isNewLayout: isNewLayout,
                                                            message_only_status: item.message_only_status,
                                                            message_only_one: item.message_only_one,
                                                            question_one:item.question_one,
                                                            question_two:item.question_two,
                                                            question_three:item.question_three,
                                                            sendAllFields:sendAllFields
                                                        });
                                groupSettingsExist = true;
                            }                           
                        }); 
                        currentGroupDetails = tempCurrentGroupDetails; 
                    }           
                } 
            });
        }
    }
}
setInterval(function() {
    getFbGroupSettings();
}, 4000)
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (typeof changes.groupConfig != "undefined") {
        getFbGroupSettings();
    } else if (typeof changes.selectedLanuage != "undefined") {
        replaceTextByLang();
    }
});

function triggerWelcomeSendMessage(bulkMsgText) {
    if (sendWelcomeMessageActual) {
        var findSendBtnForWelcome = setInterval(() => {
            if ($('textarea').length > 0) {
                clearInterval(findSendBtnForWelcome);
                $('textarea').val(bulkMsgText);
                setTimeout(() => {
                    if ($('button[name="Send"]').length > 0) {
                        console.log('if');
                        sendCloseMessage()
                        console.log($('button[name="Send"]').length);
                        $('button[name="Send"]').mclick();
                    } else if ($('input[name="Send"]').length > 0) {
                        sendCloseMessage();
                        console.log('else');
                        console.log($('input[name="Send"]').length);
                        //$('input[name="Send"]').addClass('shivam');
                        $('input[name="Send"]').mclick();
                    }
                }, 500);
            }
        }, 100)
    }
}

function sendCloseMessage() {
    chrome.runtime.sendMessage({
        type: "welcomeMessageSendCloseTab"
    });
}

function triggerTagging(commentText) {
    console.log(commentText);
    console.log($('textarea').length);
    if (commentText != '') {
        $('textarea').val(commentText);
    }
    setTimeout(() => {
        if ($('input[name="post"]').length > 0) {
            console.log($('input[name="post"]').length);
            $('input[name="post"]').mclick();
        } else if ($('button[name="post"]').length > 0) {
            console.log($('button[name="post"]').length);
            $('button[name="post"]').mclick();
        }
    }, 300);
    setTimeout(() => {
        chrome.runtime.sendMessage({
            type: "welcomeMessageSendCloseTab"
        });
    }, 1000);
}

function triggerDeclineSendMessage(bulkMsgText) {
    var tttttt = setInterval(() => {
        selector = 'div[aria-label="New message"] div._5rpu[contenteditable="true"] span br';
        if ($(selector).length > 0) {
            clearInterval(tttttt);
            var evt = new Event('input', {
                bubbles: true
            });
            var input = document.querySelector(selector);
            input.innerHTML = bulkMsgText;
            input.dispatchEvent(evt);
            $(selector).after('<span data-text="true">' + bulkMsgText + '</span>');
            chrome.runtime.sendMessage({
                type: "declineMsgPlacedAndTriggerClick"
            });
            setTimeout(() => {
                var loc = window.location.href;
                loc = loc.split("/t/");
                location.replace(loc[0] + '/t/' + loc[1]);
            }, 500)
        }
    }, 2000)
}

function replaceTextByLang() {
    chrome.storage.local.get(["selectedLanuage"], function(result) {
        ///////////global group setting page ////////////////
        selected_lang_locale = result.selectedLanuage;
    });
}

function sendWelcomeMessageToOne(memberId, requesterFullName, sQ1, a1, sQ2, a2, sQ3, a3) {
    var threadId = memberId;
    requesterName = requesterFullName.split(' ');
    requesterFirstName = requesterName[0];
    requesterLastName = requesterName[requesterName.length - 1];
    var groupName = '';
    if ($('#pagelet_bluebar').length == 0) {
        groupName = getGroupName();
    } else {
        groupName = $("h1#seo_h1_tag a").text()
    }
    var randomMessageTextArray = [];
    var welcomeMessageText = '';
    if (currentGroupDetails[0].welcome_message_one != null && currentGroupDetails[0].welcome_message_one.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_one);
    }
    if (currentGroupDetails[0].welcome_message_two != null && currentGroupDetails[0].welcome_message_two.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_two);
    }
    if (currentGroupDetails[0].welcome_message_three != null && currentGroupDetails[0].welcome_message_three.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_three);
    }
    if (currentGroupDetails[0].welcome_message_four != null && currentGroupDetails[0].welcome_message_four.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_four);
    }
    if (currentGroupDetails[0].welcome_message_five != null && currentGroupDetails[0].welcome_message_five.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_five);
    }
    if (currentGroupDetails[0].welcome_random_status == 1) {
        welcomeMessageText = randomMessageTextArray[Math.floor(Math.random() * randomMessageTextArray.length)];
    } else {
        if (currentGroupDetails[0].welcome_message_one != null && currentGroupDetails[0].welcome_message_one.length > 0) {
            welcomeMessageText = currentGroupDetails[0].welcome_message_one;
        }
    }
    if (welcomeMessageText.indexOf('[first_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[first_name]/g, requesterFirstName);
    }
    if (welcomeMessageText.indexOf('[last_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[last_name]/g, requesterLastName);
    }
    if (welcomeMessageText.indexOf('[full_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[full_name]/g, requesterFullName);
    }
    if (welcomeMessageText.indexOf('[group_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[group_name]/g, groupName);
    }
    if (welcomeMessageText.indexOf('[group_url]') > -1) {
        cur_FB_Group_Url = 'http://facebook.com/groups/' + currentGroupDetails[0].groupFbId;
        welcomeMessageText = welcomeMessageText.replace(/\[group_url]/g, cur_FB_Group_Url);
    }
    if (welcomeMessageText.indexOf('[q1]') > -1 || welcomeMessageText.indexOf('[q2]') > -1 || welcomeMessageText.indexOf('[q3]') > -1) {
        welcomeMessageText = replaceQuestions(welcomeMessageText);
    }
    if (welcomeMessageText.indexOf('[a1]') > -1 || welcomeMessageText.indexOf('[a2]') > -1 || welcomeMessageText.indexOf('[a3]') > -1) {
        welcomeMessageText = replaceAnswers(welcomeMessageText, sQ1, a1, sQ2, a2, sQ3, a3);
    }
    console.log(welcomeMessageText);

    chrome.runtime.sendMessage({
        'type': 'sendWelcomeMessage',
        threadId: threadId,
        welcomeMessageText: welcomeMessageText
    })
}

function sendWelcomeMessageThreadOne(oneMember) {
    var threadIdArray = oneMember[1].split('/');
    var threadId = threadIdArray[threadIdArray.length - 1];
    requesterFullName = '';
    requesterName = '';
    requesterFirstName = '';
    requesterLastName = '';
    var groupName = '';
    requesterFullName = oneMember[2]
    requesterName = requesterFullName.split(' ');
    requesterFirstName = requesterName[0];
    requesterLastName = requesterName[requesterName.length - 1];
    if ($('#pagelet_bluebar').length == 0) {
        groupName = getGroupName();
    } else {
        groupName = $("h1#seo_h1_tag a").text()
    }
    var randomMessageTextArray = [];
    var welcomeMessageText = '';
    if (currentGroupDetails[0].welcome_message_one != null && currentGroupDetails[0].welcome_message_one.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_one);
    }
    if (currentGroupDetails[0].welcome_message_two != null && currentGroupDetails[0].welcome_message_two.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_two);
    }
    if (currentGroupDetails[0].welcome_message_three != null && currentGroupDetails[0].welcome_message_three.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_three);
    }
    if (currentGroupDetails[0].welcome_message_four != null && currentGroupDetails[0].welcome_message_four.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_four);
    }
    if (currentGroupDetails[0].welcome_message_five != null && currentGroupDetails[0].welcome_message_five.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].welcome_message_five);
    }
    if (currentGroupDetails[0].welcome_random_status == 1) {
        welcomeMessageText = randomMessageTextArray[Math.floor(Math.random() * randomMessageTextArray.length)];
    } else {
        if (currentGroupDetails[0].welcome_message_one != null && currentGroupDetails[0].welcome_message_one.length > 0) {
            welcomeMessageText = currentGroupDetails[0].welcome_message_one;
        }
    }
    if (welcomeMessageText.indexOf('[first_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[first_name]/g, requesterFirstName);
    }
    if (welcomeMessageText.indexOf('[last_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[last_name]/g, requesterLastName);
    }
    if (welcomeMessageText.indexOf('[full_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[full_name]/g, requesterFullName);
    }
    if (welcomeMessageText.indexOf('[group_name]') > -1) {
        welcomeMessageText = welcomeMessageText.replace(/\[group_name]/g, groupName);
    }
    if (welcomeMessageText.indexOf('[group_url]') > -1) {
        cur_FB_Group_Url = 'http://facebook.com/groups/' + currentGroupDetails[0].groupFbId;
        welcomeMessageText = welcomeMessageText.replace(/\[group_url]/g, cur_FB_Group_Url);
    }
    if (welcomeMessageText.indexOf('[q1]') > -1 || welcomeMessageText.indexOf('[q2]') > -1 || welcomeMessageText.indexOf('[q3]') > -1) {
        welcomeMessageText = replaceQuestions(welcomeMessageText);
    }
    if (welcomeMessageText.indexOf('[a1]') > -1 || welcomeMessageText.indexOf('[a2]') > -1 || welcomeMessageText.indexOf('[a3]') > -1) {
        welcomeMessageText = replaceAnswers(welcomeMessageText, oneMember[6], oneMember[7], oneMember[8], oneMember[9], oneMember[10], oneMember[11]);
    }
    chrome.runtime.sendMessage({
        'type': 'sendWelcomeMessage',
        threadId: threadId,
        welcomeMessageText: welcomeMessageText
    })
}

function tagToWelcomePost(oneMember, forSingleApprove = false) {
    console.log('in tagToWelcomePost');
    var threadId = false;
    if (forSingleApprove) {
        threadId = forSingleApprove;
    } else {
        var threadIdArray = oneMember[1].split('/');
        threadId = threadIdArray[threadIdArray.length - 1];
    }
    var welcomePostUrlInDb = currentGroupDetails[0].tag_post_url;
    var targetPostIdIndex = 1;
    if (welcomePostUrlInDb.charAt(welcomePostUrlInDb.length - 1) == '/') {
        targetPostIdIndex = 2;
    }
    var welcomePostUrlArray = currentGroupDetails[0].tag_post_url.split('/')
    welcomePostUrl = welcomePostUrlArray[welcomePostUrlArray.length - targetPostIdIndex];
    welcomePostUrl = welcomePostUrl.replace("/", "");
    welcomePostUrl = 'https://d.facebook.com/mbasic/comment/advanced/?target_id=' + welcomePostUrl + '&pap&at=compose&photo_comments&ids=' + threadId + '&is_from_friend_selector=1&_rdr';
    console.log(welcomePostUrl);
    var welcomeMessageText = '';
    console.log(currentGroupDetails[0].with_text);
    if (currentGroupDetails[0].with_text == 0) {
        welcomeMessageText = getCommentMessage();
    }
    console.log(welcomeMessageText);
    chrome.runtime.sendMessage({
        'type': 'commentTagging',
        welcomePostUrl: welcomePostUrl,
        commentText: welcomeMessageText
    });
}

function getCommentMessage() {
    var welcomeMessageText = '';
    var randomMessageTextArray = [];
    console.log(currentGroupDetails[0]);
    if (currentGroupDetails[0].tag_message_one != null && currentGroupDetails[0].tag_message_one.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].tag_message_one);
    }
    if (currentGroupDetails[0].tag_message_two != null && currentGroupDetails[0].tag_message_two.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].tag_message_two);
    }
    if (currentGroupDetails[0].tag_message_three != null && currentGroupDetails[0].tag_message_three.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].tag_message_three);
    }
    if (currentGroupDetails[0].tag_message_four != null && currentGroupDetails[0].tag_message_four.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].tag_message_four);
    }
    if (currentGroupDetails[0].tag_message_five != null && currentGroupDetails[0].tag_message_five.length > 0) {
        randomMessageTextArray.push(currentGroupDetails[0].tag_message_five);
    }
    if (currentGroupDetails[0].tag_random_status == 1) {
        welcomeMessageText = randomMessageTextArray[Math.floor(Math.random() * randomMessageTextArray.length)];
    } else {
        if (currentGroupDetails[0].tag_message_one != null && currentGroupDetails[0].tag_message_one.length > 0) {
            welcomeMessageText = currentGroupDetails[0].tag_message_one;
        }
    }
    console.log(welcomeMessageText);
    return welcomeMessageText;
}

function integrateBtn() {
    dotCount = $('._6a.uiPopover._5pbi._cmw._b1e:not(.cA_event_attached)').length;
    $('._6a.uiPopover._5pbi._cmw._b1e:not(.cA_event_attached)').click(function() {
        if (CommentAllyInterval) {
            clearInterval(CommentAllyInterval);
        }
        CommentAllyInterval = setInterval(addCommentAllyLink, 500);

        function addCommentAllyLink() {
            if ($("._6a.uiPopover._5pbi._cmw._b1e.openToggler.selected").length) {
                var post_id = 0;
                var optionBox = $('.uiContextualLayerPositioner.uiLayer').not('.hidden_elem');
                var alreadyInsert = $(optionBox.children().children().children().children().children()[0]).hasClass('groupleads-menu-item');
                var canDelete = optionBox.find('a[data-feed-option-name="FeedDeleteOption"]');
                var canDelete2 = optionBox.find('a[ajaxify^="/ajax/groups/mall/delete"]');
                var list = optionBox.find('li');
                if (!list.length) {
                    //console.log('loading..');
                    //not fully loaded
                    return;
                }
                var attrTag = optionBox.find('a[data-feed-option-name="FeedFollowOption"]');
                if (!attrTag.length) {
                    attrTag = optionBox.find('a[ajaxify^="/ajax/litestand/follow_group_post"]');
                }
                var uri = attrTag.attr('ajaxify');
                var decodedUri = decodeURI(uri);
                var url = new URL('https://www.facebook.com/' + decodedUri);
                var urlMessageId = url.searchParams.get('message_id');
                var current_popup = $('._54nf').parent().parent().parent().parent().parent();
                if (current_popup.not('.hidden_elem') && !alreadyInsert && urlMessageId) {
                    var html = `<li class="groupleads-menu-item __MenuItem">
                                <a href="javascript:void(0)" class="_54nc"><img class="_2yaw img" aria-hidden="true" src="` + chrome.extension.getURL("icon32.png") + `" alt="" style=" max-height: 13px;max-width: 13px;"> <span>Copy Post Url</span></a>
                              </li>`;
                    optionBox.find('._54nf').prepend(html);
                    $('.groupleads-menu-item').on("click", function() {
                        $(this).find('span').text("Copied!!");
                        copyToClipboard("https://www.facebook.com/" + urlMessageId);
                        setTimeout(() => {
                            $(this).find('span').text("Copy Post Url (GroupLeads)");
                        }, 2000);
                    });
                    clearInterval(CommentAllyInterval);
                }
            }
        }
    })
    $('._6a.uiPopover._5pbi._cmw._b1e').addClass('cA_event_attached');
}

function copyToClipboard(postId) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(postId).select();
    document.execCommand("copy");
    $temp.remove();
}

function getGroupName() {
    var groupTitleName = '';
    var groupTitleNameNew = '';
    if ($.trim($(document).find("title").text()).indexOf('|') > -1) {
        groupTitleName = $.trim($(document).find("title").text()).split('|');
        groupTitleName = groupTitleNameNew = $.trim(groupTitleName[0]); //'(1) Basic English and Grammar';
    } else {
        groupTitleName = groupTitleNameNew = $.trim($(document).find("title").text());
    }
    var tmpGroupTitleArray = groupTitleName.split(' ');
    if (/[(0-9)]/.test(tmpGroupTitleArray[0])) { // Basic English and Grammar (11111)
        tmpGroupTitleArray.splice(0, 1);
        newGroupName = tmpGroupTitleArray.join(' ');
        return $.trim(newGroupName);
    } else {
        return groupTitleNameNew;
    }
}

function readQuestions(groupIdSync, fbGroupIdSync) {
    setTimeout(() => {
        if ($('div[role="main"]').find('div[aria-label="Delete"]').length) {
            $('div[role="main"]').find('div[aria-label="Delete"]').parent().parent().prev().prev().find('span').addClass('gl-questions')
            var question_one = $.trim($('.gl-questions:eq(0)').text());
            var question_two = '';
            var question_three = '';
            if ($('.gl-questions:eq(1)').length) {
                question_two = $.trim($('.gl-questions:eq(1)').text());
            }
            if ($('.gl-questions:eq(2)').length) {
                question_three = $.trim($('.gl-questions:eq(2)').text());
            }
            var tempSync = {};
            tempSync.groupId = groupIdSync
            tempSync.fbGroupIdSync = fbGroupIdSync
            tempSync.question_one = question_one
            tempSync.question_two = question_two
            tempSync.question_three = question_three
            chrome.runtime.sendMessage({
                'type': 'saveSyncQuestions',
                tempSync: tempSync
            });
        } else {
            window.close()
        }
    }, 3000)
}

function replaceQuestions(welcomeMessageGeneralText) {
    if (welcomeMessageGeneralText.indexOf('[q1]') > -1) {
        var q1 = currentGroupDetails[0].question_one;
        if (q1 != null && q1 != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q1]/g, q1);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q1]/g, '');
        }
    }
    if (welcomeMessageGeneralText.indexOf('[q2]') > -1) {
        var q2 = currentGroupDetails[0].question_two;
        if (q2 != null && q2 != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q2]/g, q2);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q2]/g, '');
        }
    }
    if (welcomeMessageGeneralText.indexOf('[q3]') > -1) {
        var q3 = currentGroupDetails[0].question_three;
        if (q3 != null && q3 != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q3]/g, q3);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[q3]/g, '');
        }
    }
    return welcomeMessageGeneralText;
}

function replaceAnswers(welcomeMessageGeneralText, sQ1, a1, sQ2, a2, sQ3, a3) {
    var answerOne = '';
    var answerTwo = '';
    var answerThree = '';
    if (currentGroupDetails[0].question_one == sQ1) {
        answerOne = a1;
    }
    if (currentGroupDetails[0].question_one == sQ2) {
        answerOne = a2;
    }
    if (currentGroupDetails[0].question_one == sQ3) {
        answerOne = a3;
    }
    if (currentGroupDetails[0].question_two == sQ1) {
        answerTwo = a1;
    }
    if (currentGroupDetails[0].question_two == sQ2) {
        answerTwo = a2;
    }
    if (currentGroupDetails[0].question_two == sQ3) {
        answerTwo = a3;
    }
    if (currentGroupDetails[0].question_three == sQ1) {
        answerThree = a1;
    }
    if (currentGroupDetails[0].question_three == sQ2) {
        answerThree = a2;
    }
    if (currentGroupDetails[0].question_three == sQ3) {
        answerThree = a3;
    }
    if (welcomeMessageGeneralText.indexOf('[a1]') > -1) {
        if (answerOne != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a1]/g, answerOne);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a1]/g, '');
        }
    }
    if (welcomeMessageGeneralText.indexOf('[a2]') > -1) {
        if (answerTwo != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a2]/g, answerTwo);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a2]/g, '');
        }
    }
    if (welcomeMessageGeneralText.indexOf('[a3]') > -1) {
        if (answerThree != '') {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a3]/g, answerThree);
        } else {
            welcomeMessageGeneralText = welcomeMessageGeneralText.replace(/\[a3]/g, '');
        }
    }
    return welcomeMessageGeneralText;
}

function showHideTab(showTab) {
    $('.gr-card-body .gr-tab').hide();
    $('.gr-contents').show();
    $('.gr-card-body .' + showTab).show();
}

function getMemmberRequestDetails(request) {
    let profile_id = getMemberProfileId(request)
    member = new Array();
    member.push(getGroupName());
    member.push(tabLocation.protocol + '//' + tabLocation.host + '/' + profile_id);
    full_name = $.trim($(request).find('a:eq(1)').text()).split(' ');
    member.push(full_name.join(" "));
    member.push(full_name[0]);
    member.push(full_name[full_name.length - 1]);
    joinedFbOn = $("div[data-testid='" + profile_id + "'] span:containsI(Joined Facebook)").text().replace('Joined Facebook', '');
    member.push(joinedFbOn);
    countAnswers = 0;
    $(request).find("ul li").each(function(sqn) {
        member.push($(this).find('span:eq(0)').text());
        member.push($(this).find('span:eq(1)').text());
        countAnswers++;
    });
    if (countAnswers < 3) {
        for (var i = 1; i <= (3 - countAnswers); i++) {
            member.push('');
            member.push('');
        }
    }
    d = new Date();
    member.push(d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear());
    var livesIn = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Lives in)").find('a').text();
    if (livesIn == '') {
        livesIn = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(From )").find('a').text();
    }
    member.push(livesIn);
    var workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Worked at)").text();
    if (workedAt == '') {
        workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Works at)").text();
    }
    if (workedAt == '') {
        workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Founder at)").text();
    }
    if (workedAt == '') {
        workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Owner at)").text();
    }
    if (workedAt == '') {
        workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(Studied at)").text();
    }
    member.push(workedAt);
    var addedBy = '';
    if (addedBy == '') { // Invited by 
        addedBy = $.trim($(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] span:containsI(Invited by) a").text());
    }
    var addedByTimeStamp = '';
    if (addedByTimeStamp == '') {
        addedByTimeStamp = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] span:containsI(Invited by)").text();
    }
    if (addedBy.length > 0) {
        addedByTimeStamp = addedByTimeStamp.split(addedBy);
        addedByTimeStamp = addedByTimeStamp[addedByTimeStamp.length - 1];
        member.push(addedBy);
        member.push(addedByTimeStamp);
    } else {
        member.push(addedBy);
        member.push(addedByTimeStamp);
    }
    var commonGroup = 0;
    var commonGroupText = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + profile_id + "'] " + memberRequestMetaDataContainer + " span:containsI(in Common)").text().split('·');
    if (commonGroupText.length > 0 && commonGroupText[0].indexOf('in Common') > -1) {
        commonGroup = commonGroupText[0].replace(/[^0-9]/g, '');
    } else if (commonGroupText.length > 0 && commonGroupText[0].indexOf('in common') > -1) {
        commonGroup = commonGroupText[0].replace(/[^0-9]/g, '');
    }
    member.push(commonGroup);
    var currentUserName = getCurrentUSerName();
    member.push(currentUserName);
    console.log(member);
    return member;
}

function getMemberProfileId(memberRequestItem) {
    let profile_id = ''
    tempProfileIdNewFB = $.trim($(memberRequestItem).find('a:eq(1)').attr('href'));
    //console.log(tempProfileIdNewFB);
    if (tempProfileIdNewFB.indexOf('/user/') > -1) {
        //console.log('if');
        profile_id = tempProfileIdNewFB.split('/user/')[1];
        profile_id = profile_id.replace('/', '');
    } else if (tempProfileIdNewFB.indexOf('profile.php?id=') > -1) {
        //console.log('else if');
        profile_id = tempProfileIdNewFB.split('profile.php?id=')[1];
    } else {
        //console.log('else');
        tempArray = $.trim($(memberRequestItem).find('a:eq(1)').attr('href')).split('/');
        //console.log(tempArray);
        if (tempArray == '') {
            tempProfileId = $.trim($(memberRequestItem).find('a').attr('href'));
            if (tempProfileId.indexOf('/user/') > -1) {
                profile_id = tempProfileId.split('/user/')[1];
                profile_id = profile_id.split('/?')[0];
            }
        } else {
            profile_id = tempArray[tempArray.length - 1];
            //console.log(profile_id);
            if (profile_id == '') {
                profile_id = tempArray[tempArray.length - 2];
            } else if (profile_id.indexOf('fbid=') > -1) {
                //console.log('else in')
                profile_id = profile_id.split('=')[1];
                profile_id = profile_id.split('&')[0];
            }
        }
    }
    //console.log(profile_id);
    return profile_id;
}

function validateJoinWhen(facebookJoindedDate, beforeMonths) {
    facebookJoindedDate = facebookJoindedDate.replace(",", "");
    var d = new Date();
    d.setMonth(d.getMonth() - beforeMonths);
    joindedBefore = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate()
    if (Date.parse(facebookJoindedDate) <= Date.parse(joindedBefore)) {
        return true;
    } else {
        return false;
    }
}

function validateJoinWhenForNew(whenJoinedDate, selectedTimeFilter) {
    var foundMonths = 0;
    if (whenJoinedDate.indexOf('weeks ago') > -1) {
        var foundWeeks = whenJoinedDate.replace(/[^0-9]/g, '');
        foundWeeks = parseInt(foundWeeks);
        foundMonths = parseInt(foundWeeks / 4);
    } else if (whenJoinedDate.indexOf('month ago') > -1) {
        var foundm = whenJoinedDate.replace(/[^0-9]/g, '');
        foundMonths = parseInt(foundm);
    } else if (whenJoinedDate.indexOf('months ago') > -1) {
        var foundm = whenJoinedDate.replace(/[^0-9]/g, '');
        foundMonths = parseInt(foundm);
    } else if (whenJoinedDate.indexOf('a year ago') > -1) {
        foundMonths = 1 * 12;
    } else if (whenJoinedDate.indexOf('year ago') > -1) {
        var foundY = whenJoinedDate.replace(/[^0-9]/g, '');
        foundMonths = parseInt(foundY) * 12;
    } else if (whenJoinedDate.indexOf('years ago') > -1) {
        var foundYrs = whenJoinedDate.replace(/[^0-9]/g, '');
        foundMonths = parseInt(foundYrs) * 12;
    }
    if (selectedTimeFilter <= foundMonths) {
        return true;
    } else {
        return false;
    }
}