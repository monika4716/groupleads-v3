var port = chrome.runtime.connect({
    'name': 'formfiller'
})
port.postMessage({
    'type': 'get-form-data'
})

var currentGroupDetails = new Array();
var groupData = new Array();
var groupSettingsExist = false;
var tabLocation = '';
var globalAutoresponder = '';
var autoApproveProcess = true;
var selected_lang_locale = null;
var sendWelcomeMessage = false;
var declineAllOnly = false;
var isTaggingOn = false;
var tagDelayToTagInMin = 1;
var tagDelayToTag = tagDelayToTagInMin * 60000;
var limitToTagMembersInOnePost = 50;
var isNewFB = false;
var CommentAllyInterval = false;
var loadRequestLimit = 50;
var isLoadFiftyCase = false;
var totalPendingAllRequests = 0;
var limitToTagInOnePost = 25;
// Add native 'click' and 'change' events to be triggered using jQuery
jQuery.fn.extend({
    'mclick': function() {
        var click_event = document.createEvent('MouseEvents')
        click_event.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        return $(this).each(function() {
            $(this)[0].dispatchEvent(click_event)
        })
    },
    'vchange': function() {
        var change_event = document.createEvent('HTMLEvents')
        change_event.initEvent('change', false, true)
        return $(this).each(function() {
            $(this)[0].dispatchEvent(change_event)
        })
    },
    'vclick': function() {
        var click_event = document.createEvent('HTMLEvents')
        click_event.initEvent('click', false, true)
        return $(this).each(function() {
            $(this)[0].dispatchEvent(click_event)
        })
    }
})
$.extend($.expr[":"], {
    "containsI": function(elem, i, match, array) {
        return (elem.textContent || elem.innerText || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
    }
});
var overlayHtml = `<div id="overlay-gr">
					   <div id="groupleads_model">
					      <a href="javascript:void(0)" class="close">X</a><br/><img src="` + fbLoaderImage + `"><br>
					      <div class="bar-line">
					         <hr>
					      </div>
					      <span class="gr-card-body">
					         <h4 class="gr-msg">Loading all requests...</h4>
					         
					         <div class="gr-contents">
					         	
					         	 <div class="gr-tab loading-tab custom-body-1 progress">
						            <div class="row progress1"></div>
						            <div class="row progress2"></div>
						         </div>

						         <div class="gr-tab sending-message-counter-tab custom-body-2 row level-1">
					               <div class="gr-counters">
					                  <div class="row level-2">
					                     <h2 class="gr-msg-counter h2-text-color">0</h2>
					                     Counter
					                  </div>
					                  <div class="row level-2">
					                     <h2 class="gr-msg-total h2-text-color">0</h2>
					                     Total
					                  </div>
					               </div>
					         	</div>

					         	<div class="gr-tab tagging-wait-tab custom-body-2 row level-1">
					               <div class="gr-counters">
					                  <div class="row level-2">
					                     <h2 class="gr-wait-min h2-text-color">1</h2>
					                     Minute
					                  </div>
					               </div>
					         	</div>

					         	<div class="gr-tab tagging-counter-tab custom-body-2 row level-1">
					               <div class="gr-counters">
							           <div class="row level-2">
							             <h2 class="gr-tag-counter h2-text-color">0</h2>
							             Counter
							          </div>
							          <div class="row level-2">
							             <h2 class="gr-tag-total h2-text-color">0</h2>
							             Total
							          </div>
					               </div>
					         	</div>

					         	<div class="gr-tab complete-tab custom-body-2 row level-1">
					               <img class="complete-image" src="` + grCompleteImage + `"><br>
					               <h2>Complete</h2>
					         	</div>


					         </div>
					      </span>
					   </div>
					</div>`;
var RightSiteBarSelector = '#member_requests_pagelet';
var MemberRequestSelector = '.div.l9j0dhe7.stjgntxs.ni8dbmo4.ap1mbyyd.dhix69tm.wkznzc2l.ibutc8p7.l82x9zwi.uo3d90p7.cwj9ozl2';
var tabTitleSelector = "span:containsI('Matching Request')";
//var tabTitleSelector = "span:containsI('Member Requests')";
var memberRequestMetaDataContainer = "div.qzhwtbm6.knvmm38d";
var MemberRequestSelectorForFriendsDetails = '.orn4t191'; // define selector for getting multal friend. finrend in group
function initialize_events() {
    //To bind the RightSiteBarSelector with approve_one button for event fired, when user come from fb page to group page //	
    console.log(RightSiteBarSelector);
    $(document).on('click', RightSiteBarSelector + " button.approve_one:not(.groupleads-auto-approve)", function() {
        console.log('inside send message')
        if (currentGroupDetails[0].google_sheet_url == "") {
            console.log('if')
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.invalid_google_sheet_url
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else if (globalAutoresponder == 1) {
            console.log('else if 0');
            memberId = $(this).attr('data-testid');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': memberId
            });
        } else if (currentGroupDetails[0].autoresponder_status == 1) {
            console.log('else if 1');
            memberId = $(this).attr('data-testid');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': memberId
            });
        } else if (currentGroupDetails[0].autoresponder_id == null || currentGroupDetails[0].autoresponder_id == "") {
            console.log('else if 2');
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.select_autoresponder
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else if ((currentGroupDetails[0].autoresponder_key == null || currentGroupDetails[0].autoresponder_key == "") && (currentGroupDetails[0].autoresponder_url == null || currentGroupDetails[0].autoresponder_url == "")) {
            console.log('else if 3');
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.blank_credentials
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else {
            console.log('else');
            //$('#overlay-gr').show();
            memberId = $(this).attr('data-testid');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': memberId
            });
        }
    })
    $(document).on('click', RightSiteBarSelector + " button.decline_one", function() {
        console.log('click on button decline_one')
        var threadId = 0;
        if ($('#pagelet_bluebar').length == 0) {
            threadId = $(this).closest('div.member-request-li').attr('data-testid');
        } else {
            threadId = $(this).closest('div.member-request-li').attr('data-testid');
        }
        if (currentGroupDetails[0].google_sheet_url == "") {
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.invalid_google_sheet_url
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else {
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheetfordecline',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': threadId,
                'autodecline': false
            });
        }
    });
    $(document).on('click', RightSiteBarSelector + " button.gl-message-only", function() {
        var threadId = 0;
        requesterFullName = '';
        requesterName = '';
        requesterFirstName = '';
        requesterLastName = '';
        var groupName = '';
        if ($('#pagelet_bluebar').length == 0) {
            threadId = $(this).closest('div.member-request-li').attr('data-testid');
            requesterFullName = $.trim($(this).closest('div.member-request-li').find('a:eq(1)').text());
            requesterName = requesterFullName.split(' ');
            requesterFirstName = requesterName[0];
            requesterLastName = requesterName[requesterName.length - 1];
            groupName = getGroupName();
        } else {
            threadId = $(this).closest('[data-testid]').attr('data-testid');
            requesterFullName = $.trim($(this).closest('[data-testid]').find('a:eq(1)').text());
            requesterName = requesterFullName.split(' ');
            requesterFirstName = requesterName[0];
            requesterLastName = requesterName[requesterName.length - 1];
            groupName = getGroupName();
        }
        var randomMessageTextArray = [];
        var declineMessageText = '';
        if (currentGroupDetails[0].message_only_one != null && currentGroupDetails[0].message_only_one.length > 0) {
            declineMessageText = currentGroupDetails[0].message_only_one;
        }
        if (declineMessageText.indexOf('[first_name]') > -1) {
            declineMessageText = declineMessageText.replace(/\[first_name]/g, requesterFirstName);
        }
        if (declineMessageText.indexOf('[last_name]') > -1) {
            declineMessageText = declineMessageText.replace(/\[last_name]/g, requesterLastName);
        }
        if (declineMessageText.indexOf('[full_name]') > -1) {
            declineMessageText = declineMessageText.replace(/\[full_name]/g, requesterFullName);
        }
        if (declineMessageText.indexOf('[group_name]') > -1) {
            declineMessageText = declineMessageText.replace(/\[group_name]/g, groupName);
        }
        if (declineMessageText.indexOf('[group_url]') > -1) {
            cur_FB_Group_Url = 'http://facebook.com/groups/' + currentGroupDetails[0].groupFbId;
            declineMessageText = declineMessageText.replace(/\[group_url]/g, cur_FB_Group_Url);
        }
        if (declineMessageText.indexOf('[q1]') > -1 || declineMessageText.indexOf('[q2]') > -1 || declineMessageText.indexOf('[q3]') > -1) {
            declineMessageText = replaceQuestions(declineMessageText);
        }
        var selected = new Array();
        groupData.forEach(function(item, i) {
            if (item[1].indexOf(threadId) > -1) {
                selected.push(item);
            }
        })
        declineMessageText = replaceAnswers(declineMessageText, selected[0][6], selected[0][7], selected[0][8], selected[0][9], selected[0][10], selected[0][11]);
        console.log(declineMessageText);
        console.log(threadId);
        chrome.runtime.sendMessage({
            'type': 'sendWelcomeMessage',
            threadId: threadId,
            welcomeMessageText: declineMessageText
        })
    });
    $(document).on('click', RightSiteBarSelector + " button.groupleads_custom_decline_all", function() {
        $("#overlay-gr").show();
        tmessage = selected_lang_locale.content_script_message.loading_requests
        $("#groupleads_model .gr-msg").text(tmessage);
        $("#groupleads_model .gr-contents").hide();
        requestCountArray = 0;
        let tabTitle = getTabTitleText()
        requestCountArray = tabTitle.replace(/[^0-9]/g, '');
        console.log(requestCountArray);
        loadAllDeclineRequests(requestCountArray);
    });
    $(document).on('click', RightSiteBarSelector + " button.groupleads_custom_approve_all", function() {
        console.log('groupleads_custom_approve_all');
        if (currentGroupDetails[0].google_sheet_url == "" || currentGroupDetails[0].google_sheet_url == null) {
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.invalid_google_sheet_url
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else if (globalAutoresponder == 1) {
            console.log('else if 0');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': null
            });
        } else if (currentGroupDetails[0].autoresponder_status == 1) {
            console.log('else if 1');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': null
            });
        } else if (currentGroupDetails[0].autoresponder_id == null || currentGroupDetails[0].autoresponder_id == "") {
            console.log('else if 2');
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.select_autoresponder
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else if ((currentGroupDetails[0].autoresponder_key == null || currentGroupDetails[0].autoresponder_key == "") && (currentGroupDetails[0].autoresponder_url == null || currentGroupDetails[0].autoresponder_url == "")) {
            console.log('else if 3');
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.blank_credentials
            $("#groupleads_model .gr-msg").text(tmessage);
            $("#groupleads_model .gr-contents").hide();
        } else {
            console.log('else');
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'verifyGoogleSheet',
                'google_sheet_url': currentGroupDetails[0].google_sheet_url,
                'memberId': null
            });
        }
    });
    /******* facebook confirmation box *************/
    /*---------------for new layout Approve All----------------------*/
    $(document).on('click', RightSiteBarSelector + " button[name='approve_all'], " + RightSiteBarSelector + " div[aria-label='Approve all']", function() {
        //console.log('confirmation box');
        chrome.storage.local.get(["user"], function(result) {
            if (window.location.href.indexOf('participant_requests') > -1) { ///new layout
                //console.log('herer2')
                if (typeof result.user != "undefined" && result.user != "") {
                    setTimeout(() => {
                        if ($("div[role='dialog'][aria-label='Approve all requests?']").length > 0) {
                            $("div[role='dialog'][aria-label='Approve all requests?'] div[aria-label='Approve all']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all requests?'] div[aria-label='Approve all']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        } else {
                            //console.log('else case');
                            $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        }
                        setTimeout(function() {
                            //console.log('herer1')
                            $("button.newFBCustomBtn").mclick();
                        }, 1000);
                    }, 5000)
                } else {
                    $("div[aria-label='Confirm']").show();
                    $("button.newFBCustomBtn").remove();
                }
            } else {
                //console.log('if');
                if (typeof result.user != "undefined" && result.user != "") {
                    setTimeout(() => {
                        if ($("div[role='dialog'][aria-label='Approve All Member Requests?']").length > 0) {
                            $("div[role='dialog'][aria-label='Approve All Member Requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve All Member Requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        } else {
                            $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        }
                        setTimeout(function() {
                            $("button.newFBCustomBtn").mclick();
                        }, 1000);
                    }, 5000)
                } else {
                    $("div[aria-label='Confirm']").show();
                    $("button.newFBCustomBtn").remove();
                }
            }
        });
    });
    /*---------------for old layout Approve All----------------------*/
    $(document).on('click', RightSiteBarSelector + " button[name='approve_all'], " + RightSiteBarSelector + " div[aria-label='Approve All']", function() {
        //console.log('confirmation box');
        chrome.storage.local.get(["user"], function(result) {
            if (window.location.href.indexOf('participant_requests') > -1) { ///new layout
                //console.log('herer2')
                if (typeof result.user != "undefined" && result.user != "") {
                    setTimeout(() => {
                        if ($("div[role='dialog'][aria-label='Approve all requests?']").length > 0) {
                            $("div[role='dialog'][aria-label='Approve all requests?'] div[aria-label='Approve all']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all requests?'] div[aria-label='Approve all']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        } else {
                            //console.log('else case');
                            $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        }
                        setTimeout(function() {
                            //console.log('herer1')
                            $("button.newFBCustomBtn").mclick();
                        }, 1000);
                    }, 5000)
                } else {
                    $("div[aria-label='Confirm']").show();
                    $("button.newFBCustomBtn").remove();
                }
            } else {
                //console.log('if');
                if (typeof result.user != "undefined" && result.user != "") {
                    setTimeout(() => {
                        if ($("div[role='dialog'][aria-label='Approve All Member Requests?']").length > 0) {
                            $("div[role='dialog'][aria-label='Approve All Member Requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve All Member Requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        } else {
                            $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']").addClass('gl-fb-confirm').hide();
                            if ($('.newFBCustomBtn').length == 0) {
                                $("div[role='dialog'][aria-label='Approve all member requests?'] div[aria-label='Confirm']:eq(0)").before('<button class="newFBCustomBtn" role="button" type="button" value="1">Confirm</button>');
                            }
                        }
                        setTimeout(function() {
                            $("button.newFBCustomBtn").mclick();
                        }, 1000);
                    }, 5000)
                } else {
                    $("div[aria-label='Confirm']").show();
                    $("button.newFBCustomBtn").remove();
                }
            }
        });
    });
    /******* end facebook confirmation box *************/
    $(document).on('click', "button.newFBCustomBtn", function() { ///confirmnew
        //console.log('button.newFBCustomBtn');
        $("#overlay-gr").show();
        tmessage = selected_lang_locale.content_script_message.uploading_message
        $("#groupleads_model .gr-msg").text(tmessage);
        $("#groupleads_model .gr-contents").hide();
        var groupAllMembers = [];
        var groupName = getGroupName();
        $(RightSiteBarSelector + " " + MemberRequestSelector).each(function(index) {
            if($(this).attr('data-testid')!= ''){
                temp = getMemberProfileId(this)
                let member = getMemmberRequestDetails(this)
                groupAllMembers.push(member);
            }
        });
        //console.log('test 5');
        //console.log(groupAllMembers);
        if (groupAllMembers.length > 0) {
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'callGoogleSheet',
                'fbGroupData': groupAllMembers,
                'currentGroupDetails': currentGroupDetails
            });
            if (actualFBApprove) {
                if ($("div[aria-label='Approve All Member Requests?']").length > 0) {
                    $("div[aria-label='Approve All Member Requests?'] div[aria-label='Confirm']:eq(0)").mclick();
                } else {
                    $("div[aria-label='Approve all member requests?'] div[aria-label='Confirm']").mclick();
                }
                if (window.location.href.indexOf('participant_requests') > -1) {
                    $("div[aria-label='Approve all requests?'] div[aria-label='Approve all']:eq(0)").mclick();
                }
            }
            if (sendWelcomeMessage) {
                //$("#groupleads_model span").text('Sending welcome messages');
                $("#groupleads_model .gr-msg").text('Sending welcome messages');
                $("#groupleads_model .gr-contents").hide();
                sendWelcomeMessageOneByOneToAll(groupAllMembers, 1);
            } else if (isTaggingOn) {
                $("#groupleads_model .gr-msg").text('Tagging to welcome post starts in');
                $('#groupleads_model .gr-wait-min').html(tagDelayToTagInMin);
                showHideTab('tagging-wait-tab');
                $('#groupleads_model .close').hide();
                var tagDelayToTagtemp = 0;
                if (!sendWelcomeMessage) {
                    tagDelayToTagtemp = tagDelayToTag
                } else if (groupAllMembers.length < 15) {
                    tagDelayToTagtemp = tagDelayToTag
                }
                var groupAllMembersTemp = groupAllMembers;
                setTimeout(() => {
                    $("#groupleads_model .gr-msg").text('Tagging to welcome post');
                    if ($('#pagelet_bluebar').length == 0) {
                        chrome.runtime.sendMessage({
                            type: "getNumericFbIds",
                            data: groupAllMembersTemp
                        });
                    } else {
                        taggingOneByOneToAll(groupAllMembersTemp);
                    }
                    $('#groupleads_model .close').show();
                }, tagDelayToTagtemp); /////////ppppppp
            } else {
                setTimeout(function() {
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    $('#groupleads_model .gr-msg').html('');
                    if (isLoadFiftyCase) {
                        tmessage = loadRequestLimit + ' out of ' + totalPendingAllRequests + ' completed'
                        $("#groupleads_model .gr-msg").text(tmessage);
                    }
                    showHideTab('complete-tab');
                    setTimeout(function() {
                        $("#overlay-gr").hide();
                    }, 3000);
                }, 2000);
            }
            groupAllMembers = [];
        }
    });
    $(document).on('click', "._59s7 .uiOverlayFooter button.custom", function() { //NOT DONE
        $("#overlay-gr").show();
        tmessage = selected_lang_locale.content_script_message.uploading_message
        $("#groupleads_model span").text(tmessage);
        var groupAllMembers = new Array();
        var groupName = $("h1#seo_h1_tag a").text();
        $(RightSiteBarSelector + " div._3k4n._4-u3 ul.uiList._4kg._4kt._6-h._6-j ").children().each(function(index) {
            temp = $(this).find('a[uid]').attr('uid');
            //console.log(temp);
            member = new Array();
            member.push(groupName);
            member.push(tabLocation.protocol + '//' + tabLocation.host + '/' + temp);
            full_name = $(this).find("a[uid='" + temp + "']").text().split(' ');
            member.push(full_name.join(" "));
            member.push(full_name[0]);
            member.push(full_name[full_name.length - 1]);
            joinedFbOn = $(this).find("li:containsI(Joined Facebook on)").find('span').text();
            member.push(joinedFbOn);
            countAnswers = 0;
            $(this).find("ul.uiList._4kg._6-i._6-h._6-j li").each(function(sqn) {
                member.push($(this).find('div').text());
                member.push($(this).find('text').text());
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
            var livesIn = $("li[data-testid='" + temp + "'] ul li:containsI(Lives in)").find('a').text();
            if (livesIn == '') {
                livesIn = $("li[data-testid='" + temp + "'] ul li:containsI(From )").find('a').text();
            }
            member.push(livesIn);
            var workedAt = $("li[data-testid='" + temp + "'] ul li:containsI(Worked at )").text();
            if (workedAt == '') {
                workedAt = $("li[data-testid='" + temp + "'] ul li:containsI(Works at )").text();
            }
            if (workedAt == '') {
                workedAt = $("li[data-testid='" + temp + "'] ul li:containsI(Founder at )").text();
            }
            if (workedAt == '') {
                workedAt = $("li[data-testid='" + temp + "'] ul li:containsI(Owner at)").text();
            }
            if (workedAt == '') {
                workedAt = $("li[data-testid='" + temp + "'] ul li:containsI(studied at)").text();
            }
            member.push(workedAt);
            var addedBy = '';
            if (addedBy == '') {
                addedBy = $.trim($("li[data-testid='" + temp + "'] span:containsI(Invited by)").text());
            }
            var addedByTimeStamp = '';
            if (addedByTimeStamp == '') {
                addedByTimeStamp = $("li[data-testid='" + temp + "']  span:containsI(Invited by) abbr").text();
            }
            if (addedBy.length > 0) {
                addedBy = addedBy.split('Invited by');
                addedBy = addedBy[1];
                addedBy = addedBy.replace(addedByTimeStamp, '');
                member.push(addedBy);
                member.push(addedByTimeStamp);
            } else {
                member.push(addedBy);
                member.push(addedByTimeStamp);
            }
            groupAllMembers.push(member);
        });
        //console.log('test1');
        //console.log(groupAllMembers);
        if (groupAllMembers.length > 0) {
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'callGoogleSheet',
                'fbGroupData': groupAllMembers,
                'currentGroupDetails': currentGroupDetails
            });
            if (actualFBApprove) {
                $("._59s7 .uiOverlayFooter button[action='confirm']").trigger('click');
            }
            if (sendWelcomeMessage) {
                $("#groupleads_model span").text('Sending welcome messages');
                sendWelcomeMessageOneByOneToAll(groupAllMembers, 1);
            } else if (isTaggingOn) {
                $("#groupleads_model span").text('Tagging to welcome post will start in ' + tagDelayToTagInMin + ' minutes');
                $('#groupleads_model .close').hide();
                var tagDelayToTagtemp = 0;
                if (!sendWelcomeMessage) {
                    tagDelayToTagtemp = tagDelayToTag
                } else if (groupAllMembers.length < 15) {
                    tagDelayToTagtemp = tagDelayToTag
                }
                var groupAllMembersTemp = groupAllMembers;
                setTimeout(() => {
                    $("#groupleads_model span").text('Tagging to welcome post');
                    taggingOneByOneToAll(groupAllMembersTemp); //// it is for old layout
                }, tagDelayToTagtemp);
            } else {
                setTimeout(function() {
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    $("#groupleads_model .gr-msg").text(tmessage);
                    $("#groupleads_model .gr-contents").hide(); //////pending4556
                    setTimeout(function() {
                        $("#overlay-gr").hide();
                    }, 3000);
                }, 2000);
            }
            groupAllMembers = [];
            //////////////pending ///
        }
    });
}

function initialize_rightsidebarevent() {
    var rightsiderbarinterval = setInterval(() => {
        if ($('#member_requests_pagelet').length > 0) {
            RightSiteBarSelector = '#member_requests_pagelet';
            //console.log('if');
        } else if ($('div[aria-label="Group Content"]').length > 0) {
            //console.log('else if 0');
            RightSiteBarSelector = 'div[aria-label="Group Content"]';
        } else if ($('div[aria-label="Group content"]').length > 0) {
            //console.log('else if 1');
            RightSiteBarSelector = 'div[aria-label="Group content"]';
        }
        if (RightSiteBarSelector == 'div[aria-label="Group content"]') {
            //console.log('first Group content');
            initialize_events();
            clearInterval(rightsiderbarinterval);
        } else if (RightSiteBarSelector == 'div[aria-label="Group Content"]') {
            //console.log('second Group Content');
            initialize_events();
            clearInterval(rightsiderbarinterval);
        }
    }, 2000);
}

function setHTMLSelectors() {
    if ($("div.l9j0dhe7.stjgntxs.ni8dbmo4.ap1mbyyd.dhix69tm.wkznzc2l.ibutc8p7.l82x9zwi.uo3d90p7.cwj9ozl2").length > 0) {
        MemberRequestSelector = 'div.l9j0dhe7.stjgntxs.ni8dbmo4.ap1mbyyd.dhix69tm.wkznzc2l.ibutc8p7.l82x9zwi.uo3d90p7.cwj9ozl2 > div';
    } else if ($("div.sjgh65i0").length > 0) {
        MemberRequestSelector = 'div.sjgh65i0';
    }
    if ($('#member_requests_pagelet').length > 0) {
        //console.log('if');
        RightSiteBarSelector = '#member_requests_pagelet';
    } else if ($('div[aria-label="Group Content"]').length > 0) {
        //console.log('else if');
        RightSiteBarSelector = 'div[aria-label="Group Content"]';
    } else if ($('div[aria-label="Group content"]').length > 0) {
        //console.log('else in');
        RightSiteBarSelector = 'div[aria-label="Group content"]';
    }
    //console.log(RightSiteBarSelector);
    if ($(RightSiteBarSelector + " span:containsI('Matching Request')").length > 0) {
        tabTitleSelector = "span:containsI('Matching Request')";
        //console.log('if');
    } else if ($(RightSiteBarSelector + " span:containsI('Member Requests')").length > 0) {
        tabTitleSelector = "span:containsI('Member Requests')";
        //console.log('if 3');
    } else if ($(RightSiteBarSelector + " span:containsI('Member Request')").length > 0) {
        tabTitleSelector = "span:containsI('Member Request')";
        //console.log('if 1');
    } else if ($(RightSiteBarSelector + " span:containsI('Participant Request')").length > 0) {
        tabTitleSelector = "span:containsI('Participant Request')";
        //console.log('if 2');
    }
    //console.log(tabTitleSelector);
}

function getTabTitleText() {
    return $(RightSiteBarSelector + " " + tabTitleSelector).text().toUpperCase();
}



setInterval(()=>{
    console.log()
    if (window.location.origin.indexOf('facebook') > -1 && window.location.href.indexOf('/groups/') > -1 ) {
        chrome.runtime.sendMessage({type:"activateMsg",from:"contenscript"})
    }
},3000);

$(function() {
    setHTMLSelectors();
    initialize_events();
    initialize_rightsidebarevent();
    if (window.location.origin.indexOf('facebook') > -1 && window.location.href.indexOf('/compose/?id') > -1) {
        console.log('getMessageText');
        chrome.runtime.sendMessage({
            'type': 'getMessageText'
        });
    }
    setInterval(function() {
        $("div[aria-label='Query error']").find("div[aria-label='OK']").mclick();
        $('div[aria-label="Query Error"]').find('div[aria-label="OK"]').mclick();
    }, 2000);
    replaceTextByLang();
    groupData = [];
    var scrappingListProcessing = true;
    var membersRequetsTab = setInterval(function() {
        setHTMLSelectors();
        if (scrappingListProcessing) {
            tabLocation = window.location;
            pathName = window.location.pathname;
            if (window.location.pathname.indexOf('participant_requests') > -1) {
                console.log('old layout');
                $("body").addClass('gl-new-layout');
                chrome.storage.local.get(["user"], function(result) {
                    if (typeof result.user != "undefined" && result.user != "" && groupSettingsExist) {
                        if ($(MemberRequestSelector).length > 0) {
                            if ($("#groupleads_model").length > 0) {} else {
                                $("body").append(overlayHtml);
                            }
                            //Matching requests
                            tabTitle = getTabTitleText();
                            if (tabTitle.length > 0) {
                                var groupName = getGroupName();
                                console.log('custom1')
                                if ($(".groupleads_custom_approve_all").length < 1) {
                                    console.log('custom2')
                                    //console.log('if')
                                    $("div[aria-label='Approve all']").hide();
                                    $("div[aria-label='Approve all']").before('<button name="custom_approve_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_approve_all" type="button" >Custom Approve All</button>');
                                    $("div[aria-label='Decline all']").hide();
                                    $("div[aria-label='Decline all']").before('<button name="decline_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_decline_all" type="submit" value="1">Decline All and send message</button>');
                                } else {
                                    console.log('custom3')
                                    //console.log('else 0')
                                    $("div[aria-label='Approve all']").hide();
                                    $("button[name='custom_approve_all']").show();
                                }
                                if ($(".gl-approve-on-selection").length == 0) {
                                    $('body').append('<span class="gl-approve-on-selection">Approve selected</span>');
                                }
                                //console.log($(RightSiteBarSelector+" "+MemberRequestSelector+":not('.gl-processed')").length);
                                $(RightSiteBarSelector + " " + MemberRequestSelector + ":not('.gl-processed')").each(function(index) {
                                    //console.log('in');
                                    if ($(this).find('div[aria-label="Approve"]').length > 0) {
                                        scrappingListProcessing = false;
                                        $(this).addClass('member-request-li');
                                        $(this).addClass('gl-processed');
                                        temp = getMemberProfileId(this);
                                        //console.log(temp);
                                        $(this).attr('data-testid', temp);
                                        if ($(this).find("button.approve_one").length > 0) {
                                            $(this).find("div[aria-label='Approve']").hide();
                                            $('button.approve_one').show();
                                        } else {
                                            /**************** Custom Approve One Member Button ************/
                                            $(this).find("div[aria-label='Approve']").hide();
                                            $(this).find("div[aria-label='Approve']").before('<input class="gl-select-approve" type="checkbox"><button name="approve" class="_4jy0 _4jy3 _517h _51sy _42ft approve_one" data-testid="' + temp + '" type="button" value="1">Approve</button>');
                                            /**************** Custom Decline One Member Button ************/
                                            //$(this).find("div[aria-label='Decline']").hide();
                                            $(this).find("div[aria-label='Decline']").before('<button name="decline" class="_4jy0 _4jy3 _517h _51sy _42ft decline_one" type="submit" value="1">Decline</button>');
                                            //$(this).find("div[aria-label='Decline']").before('<button name="decline" class="_4jy0 _4jy3 _517h _51sy _42ft decline_one" type="submit" value="1">Decline and send message 1</button>');								
                                            $(this).find("[aria-label='More']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                            //$(this).find("[aria-label='More']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                            $(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                            //$(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                            //$(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                            //$(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                        }
                                        let member = getMemmberRequestDetails(this);
                                        groupData.push(member);
                                    }
                                });
                                scrappingListProcessing = true;
                                //console.log(groupData);
                            }
                        }
                    } else {
                        $('div.gl-processed').removeClass('gl-processed');
                        $("div[aria-label='Approve all']").show();
                        $("#member_requests_pagelet button[name='custom_approve_all']").hide();
                        $(".approve_one").hide();
                        $('div[aria-label="Approve"]').show();
                        $(".decline_one").hide();
                        $("div[aria-label='Deline']").show();
                    }
                })
            } else { ////////// new version of facebook
                //console.log('new version of facebook')
                $("body").addClass('gl-new-layout');
                chrome.storage.local.get(["user"], function(result) {
                    if (typeof result.user != "undefined" && result.user != "" && groupSettingsExist) {
                        if ($(MemberRequestSelector).length > 0) {
                            if ($("#groupleads_model").length > 0) {} else {
                                //	$("body").append('<div id="overlay-gr"><div id="groupleads_model"><a href="javascript:void(0)" class="close">X</a><br/><img src="'+fbLoaderImage+'"><br><span class="gr-card-body" ></span></div></div>');
                                $("body").append(overlayHtml);
                            }
                            //Matching requests
                            tabTitle = getTabTitleText()
                            // console.log(tabTitle);
                            if (tabTitle.length > 0) {
                                var groupName = getGroupName();
                                //console.log('custom4')
                                if ($(".groupleads_custom_approve_all").length < 1) {
                                    //console.log('in')
                                    //console.log('custom5')
                                    if ($("div[aria-label='Approve all']").length == 0) {
                                        $("div[aria-label='Approve All']").hide();
                                        $("div[aria-label='Approve All']").before('<button name="custom_approve_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_approve_all" type="button" >Custom Approve All</button>');
                                    } else {
                                        $("div[aria-label='Approve all']").hide();
                                        $("div[aria-label='Approve all']").before('<button name="custom_approve_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_approve_all" type="button" >Custom Approve All</button>');
                                    }
                                    $("div[aria-label='Decline all']").hide();
                                    $("div[aria-label='Decline all']").before('<button name="decline_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_decline_all" type="submit" value="1">Decline All</button>');
                                    //$("div[aria-label='Decline All']").before('<button name="decline_all" class="_4jy0 _4jy3 _517h _51sy _42ft groupleads_custom_decline_all" type="submit" value="1">Decline All and send message</button>');	
                                } else {
                                    //console.log('in 1')
                                    //console.log('custom6')
                                    $("div[aria-label='Approve all']").hide();
                                    $("button[name='custom_approve_all']").show();
                                }
                                if ($(".gl-approve-on-selection").length == 0) {
                                    $('body').append('<span class="gl-approve-on-selection">Approve selected</span>');
                                }
                                //console.log($(RightSiteBarSelector+" "+MemberRequestSelector+":not('.gl-processed')").length)
                                $(RightSiteBarSelector + " " + MemberRequestSelector + ":not('.gl-processed')").each(function(index) {
                                    scrappingListProcessing = false;
                                    $(this).addClass('member-request-li');
                                    $(this).addClass('gl-processed');
                                    temp = getMemberProfileId(this);
                                    $(this).attr('data-testid', temp);
                                    if ($(this).find("button.approve_one").length > 0) {
                                        // console.log('if')
                                        $(this).find("div[aria-label='Approve']").hide();
                                        $('button.approve_one').show();
                                    } else {
                                        //	console.log('decline else');
                                        /**************** Custom Approve One Member Button ************/
                                        $(this).find("div[aria-label='Approve']").hide();
                                        $(this).find("div[aria-label='Approve']").before('<input class="gl-select-approve" type="checkbox"><button name="approve" class="_4jy0 _4jy3 _517h _51sy _42ft approve_one" data-testid="' + temp + '" type="button" value="1">Approve</button>');
                                        /**************** Custom Decline One Member Button ************/
                                        //$(this).find("div[aria-label='Decline']").hide();
                                        $(this).find("div[aria-label='Decline']").before('<button name="decline" class="_4jy0 _4jy3 _517h _51sy _42ft decline_one" type="submit" value="1">Decline</button>');
                                        /*$(this).find("div[aria-label='Decline']").before('<button name="decline" class="_4jy0 _4jy3 _517h _51sy _42ft decline_one" type="submit" value="1">Decline and send message 2</button>');*/
                                        $(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                        $(this).find("[aria-label='More request options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                        //$(this).find("[aria-label='More Request Options']").after('<button class="gl-message-only fb-new">Send message only</button>');
                                    }
                                    let member = getMemmberRequestDetails(this)
                                    groupData.push(member);
                                });
                                scrappingListProcessing = true;
                            }
                            //console.log(groupData);
                        }
                    } else {
                        $('div.gl-processed').removeClass('gl-processed');
                        $("div[aria-label='Approve all']").show();
                        $("#member_requests_pagelet button[name='custom_approve_all']").hide();
                        $(".approve_one").hide();
                        $('div[aria-label="Approve"]').show();
                        $(".decline_one").hide();
                        $("div[aria-label='Deline']").show();
                    }
                })
            }
        }
    }, 1500);
    $(document).on('click', ".gl-select-approve", function() {
        if ($(this).is(':checked')) {
            $(this).closest('.member-request-li').addClass('gl-approve-custom-limit');
        } else {
            $(this).closest('.member-request-li').removeClass('gl-approve-custom-limit');
        }
        var glTotalSelected = $('.gl-select-approve:checked').length
        $('.gl-approve-on-selection').text('Approve selected: ' + glTotalSelected);
        if (!glTotalSelected) {
            $('.gl-approve-on-selection').text('Approve selected');
        }
    });
    $(document).on('click', ".gl-approve-on-selection", function() {
        console.log('button clicked')
        if ($('.gl-select-approve:checked').length > 0) {
            console.log('button length found')
            approveRequestOnSelectionBase();
        } else {
            alert('Please select at least one request.')
        }
    });
    $(document).on('click', "#groupleads_model a", function() {
        $("#overlay-gr").hide();
        window.location.reload();
    });
})
var totalDeclineMessageToSend = 0;
var totalDeclineOnlyCounter = 0;

function loadAllDeclineRequests(totalRequests = 0) {
    showHideTab('loading-tab');
    loadedRequests = 0;
    loadedRequests = $("div[aria-label='Approve']").length;
    console.log(loadedRequests);
    console.log(totalRequests);
    if (loadedRequests < totalRequests) {
        console.log('loadAllDeclineRequests if');
        var perWidth = (loadedRequests / totalRequests) * 100;
        console.log(perWidth);
        $('.gr-card-body .progress1').css('width', perWidth + '%');
        $("html, body").animate({
            scrollTop: $(document).height()
        }, 1000);
        setTimeout(function() {
            loadAllDeclineRequests(totalRequests);
        }, 5000);
    } else {
        console.log('loadAllDeclineRequests else');
        $('.gr-card-body .loading-tab').hide();
        totalDeclineMessageToSend = loadedRequests;
        totalDeclineOnlyCounter = loadedRequests;
        if (currentGroupDetails[0].decline_interval == 0) {
            currentGroupDetails[0].decline_limit = parseInt(totalDeclineMessageToSend);
            currentGroupDetails[0].decline_interval = 1;
        }
        console.log(loadedRequests);
        startDeclineAllOneByOne(loadedRequests);
    }
}
var totalRequestsThreadsCounter = 0;
var totalRequestsThreadsDeclineOnlyCounter = 0;
// WORKED ON THIS FUNCTION 25-10-21
function startDeclineAllOneByOne(totalRequestsThreads) { // WORKED BY SOFTWARE PROGRAMMER DATE 25-10-21
    processThreadDealy = 0;
    callAgainFlag = true;
    declineAllOnly = false;
    for (var i = 1; i <= totalRequestsThreads; i++) {
        if (currentGroupDetails[0].decline_message_status == 1) {
            //console.log('if');
            if (i <= currentGroupDetails[0].decline_limit || currentGroupDetails[0].decline_limit == 0) {
                //console.log('if 1');
                setTimeout(() => {
                    declineAllOnly = true;
                    totalRequestsThreadsDeclineOnlyCounter++;
                    $("#groupleads_model .gr-msg").html('Sending message <br> Counter: ' + totalRequestsThreadsDeclineOnlyCounter + '<br>Total: ' + totalDeclineOnlyCounter);
                    if ($("#groupleads_model").find(".tab-switch-note").length == 0) {
                        $("#groupleads_model span.gr-card-body").after("<label class='tab-switch-note' style='display: block; margin-top: 14px;color: #df2329;font-size: 14px;'>Don’t switch tab until Decline all is completed.</label>")
                    }
                    console.log($(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').length)
                    var find_first_decline = $(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').length;
                    if (window.location.pathname.indexOf('participant_requests') > -1) {
                        if (find_first_decline > 0) {
                            $(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').mclick();
                        } else {
                            $(RightSiteBarSelector + " " + MemberRequestSelector).find('div:eq(1)').first().find('button.decline_one').mclick();
                        }
                    } else {
                        if (find_first_decline > 0) {
                            $(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').mclick();
                        } else {
                            $(RightSiteBarSelector + " " + MemberRequestSelector).first().next().find('button.decline_one').mclick();
                        }
                    }
                    /*$(RightSiteBarSelector+" "+MemberRequestSelector).first().find('button.decline_one').mclick();	*/
                    if (totalRequestsThreadsCounter == totalDeclineMessageToSend) {
                        //console.log('if');
                        $("#overlay-gr").show();
                        $("#groupleads_model").find(".tab-switch-note").remove();
                        $("#groupleads_model .gr-msg").text('');
                        showHideTab('complete-tab');
                    } else if (totalRequestsThreadsDeclineOnlyCounter == totalDeclineOnlyCounter) {
                        //console.log('else');
                        $("#overlay-gr").show();
                        $("#groupleads_model").find(".tab-switch-note").remove();
                        $("#groupleads_model .gr-msg").text('');
                        showHideTab('complete-tab');
                    }
                    $('.tagging-wait-tab').hide();
                }, processThreadDealy * 60000)
            } else { // IF USER ADD LIMIT IN SETTINGS
                //console.log(currentGroupDetails);
                if (currentGroupDetails[0].decline_start_time == 0) { // HAS LIMIT BUT TO PAUSE START TIME
                    console.log('if 2');
                    setTimeout(() => {
                        $("#overlay-gr").show();
                        $("#groupleads_model").find(".tab-switch-note").remove();
                        $("#groupleads_model .gr-msg").text('Limit reached');
                        showHideTab('complete-tab');
                    }, (processThreadDealy * 60000) + 200);
                    return false;
                } else { // HAS LIMIT AND ALSO PAUSE START TIME
                    console.log('else 2');
                    callAgainFlag = false;
                    console.log('Limit reached will be resume in')
                    setTimeout(() => {
                        startDeclineAllOneByOne(totalRequestsThreads - currentGroupDetails[0].decline_limit);
                    }, (processThreadDealy + parseInt(currentGroupDetails[0].decline_start_time)) * 60000);
                    setTimeout(() => {
                        $("#groupleads_model .gr-msg").text('Limit reached will be resume in');
                        $('#groupleads_model .gr-wait-min').html(currentGroupDetails[0].decline_start_time);
                        showHideTab('tagging-wait-tab')
                    }, (processThreadDealy * 60000) + 200);
                    return false;
                }
            }
            processThreadDealy = processThreadDealy + parseInt(currentGroupDetails[0].decline_interval);
        } else { // CODE ONLY FOR DECLINE (WITHOUT MESSAGE)
            //console.log('decline else');
            setTimeout(() => {
                declineAllOnly = true;
                totalRequestsThreadsDeclineOnlyCounter++;
                $("#groupleads_model .gr-msg").html('Decline All <br> Counter: ' + totalRequestsThreadsDeclineOnlyCounter + '<br>Total: ' + totalDeclineOnlyCounter);
                if ($("#groupleads_model").find(".tab-switch-note").length == 0) {
                    $("#groupleads_model span.gr-card-body").after("<label class='tab-switch-note' style='display: block; margin-top: 14px;color: #df2329;font-size: 14px;'>Don’t switch tab until Decline all is completed.</label>")
                }
                //console.log($(RightSiteBarSelector+" "+MemberRequestSelector).first().find('button.decline_one'));
                //$(RightSiteBarSelector+" "+MemberRequestSelector).first().find('button.decline_one').mclick();
                var find_first_decline = $(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').length;
                if (find_first_decline > 0) {
                    $(RightSiteBarSelector + " " + MemberRequestSelector).first().find('button.decline_one').mclick();
                } else {
                    $(RightSiteBarSelector + " " + MemberRequestSelector).find('div:eq(1)').find('button.decline_one').mclick();
                }
                if (totalRequestsThreadsDeclineOnlyCounter == totalDeclineOnlyCounter || totalRequestsThreadsCounter == totalDeclineMessageToSend) {
                    $("#overlay-gr").show();
                    $("#groupleads_model").find(".tab-switch-note").remove();
                    $("#groupleads_model .gr-msg").text('');
                    showHideTab('complete-tab');
                }
            }, i * 3000)
        }
    }
}

function loadAllRequests(totalRequests = 0) {
    showHideTab('loading-tab');
    var loadedRequests = 0;
    loadedRequests = $(RightSiteBarSelector + " div[aria-label='Approve']").length;
    //console.log(loadedRequests);
    if (loadedRequests < totalRequests) {
        //console.log('if');
        $("html, body").animate({
            scrollTop: $(document).height()
        }, 1000);
        var perWidth = (loadedRequests / totalRequests) * 100;
        $('.gr-card-body .progress1').css('width', perWidth + '%');
        setTimeout(function() {
            loadAllRequests(totalRequests);
        }, 2000);
    } else {
        //console.log('else');
        $('.gr-card-body .loading-tab').hide();
        $(RightSiteBarSelector + " div[aria-label='Approve all']").mclick()
        $(RightSiteBarSelector + " div[aria-label='Approve All']").mclick()
    }
}

function loadAllRequestsUptoFifty(totalRequests = 0) {
    showHideTab('loading-tab');
    var loadedRequests = 0;
    loadedRequests = $("div[aria-label='Approve']").length;
    if (loadedRequests < loadRequestLimit) {
        $("html, body").animate({
            scrollTop: $(document).height()
        }, 1000);
        var perWidth = (loadedRequests / totalRequests) * 100;
        $('.gr-card-body .progress1').css('width', perWidth + '%');
        setTimeout(() => {
            loadAllRequestsUptoFifty(totalRequests);
        }, 4000)
    } else {
        if ($('#pagelet_bluebar').length == 0) {
            $("#overlay-gr").show();
            tmessage = selected_lang_locale.content_script_message.uploading_message
            $("#groupleads_model .gr-msg").text(tmessage);
            var groupAllMembers = new Array();
            var groupName = getGroupName();
            var firstFiftyCounter = 0;
            $(RightSiteBarSelector + " " + MemberRequestSelector).each(function(index) {
                if (firstFiftyCounter < loadRequestLimit) {
                    firstFiftyCounter = firstFiftyCounter + 1;
                    $(this).find('div[aria-label="Approve"]').addClass('gl-under-fifty');
                    temp = getMemberProfileId(this)
                    let member = getMemmberRequestDetails(this)
                    groupAllMembers.push(member);
                }
            });
            // console.log('test2');
            //console.log(groupAllMembers);
            if (groupAllMembers.length > 0) {
                port = chrome.runtime.connect({'name': 'formfiller'})
                port.postMessage({
                    'type': 'callGoogleSheet',
                    'fbGroupData': groupAllMembers,
                    'currentGroupDetails': currentGroupDetails
                });
                if (actualFBApprove) {
                    $("div.gl-under-fifty").each(function(index) {
                        $(this).trigger('click');
                    });
                }
                if (sendWelcomeMessage) {
                    $("#groupleads_model .gr-msg").text('Sending welcome messages');
                    $("#groupleads_model .gr-contents").hide();
                    sendWelcomeMessageOneByOneToAll(groupAllMembers, 1);
                } else if (isTaggingOn) {
                    //$("#groupleads_model span").text('Tagging to welcome post will start in '+tagDelayToTagInMin+' minutes');
                    $("#groupleads_model .gr-msg").text('Tagging to welcome post starts in');
                    $('#groupleads_model .gr-wait-min').html(tagDelayToTagInMin);
                    showHideTab('tagging-wait-tab');
                    $('#groupleads_model .close').hide();
                    var tagDelayToTagtemp = 0;
                    if (!sendWelcomeMessage) {
                        tagDelayToTagtemp = tagDelayToTag
                    } else if (groupAllMembers.length < 15) {
                        tagDelayToTagtemp = tagDelayToTag
                    }
                    var groupAllMembersTemp = groupAllMembers;
                    setTimeout(() => {
                        // $("#groupleads_model span").text('Tagging to welcome post');
                        $("#groupleads_model .gr-msg").text('Tagging to welcome post');
                        $("#groupleads_model .gr-contents").hide();
                        if ($('#pagelet_bluebar').length == 0) {
                            chrome.runtime.sendMessage({
                                type: "getNumericFbIds",
                                data: groupAllMembersTemp
                            });
                        } else {
                            taggingOneByOneToAll(groupAllMembersTemp);
                        }
                        $('#groupleads_model .close').show();
                    }, tagDelayToTagtemp); /////////ppppppp
                } else {
                    setTimeout(function() {
                        tmessage = selected_lang_locale.content_script_message.complete_message
                        $("#groupleads_model .gr-msg").text(''); ///4556789
                        showHideTab('complete-tab');
                        setTimeout(function() {
                            $("#overlay-gr").hide();
                        }, 3000);
                    }, 2000);
                }
                groupAllMembers = [];
            }
        }
    }
}
chrome.runtime.onMessage.addListener(function(message, sender, send_response) {
    if (message.type == 'start_scraping') {
        $("#overlay-gr").show();
        tmessage = selected_lang_locale.content_script_message.loading_requests
        $("#groupleads_model .gr-msg").text(tmessage);
        requestCountArray = 0;
        let tabTitle = getTabTitleText()
        requestCountArray = tabTitle.replace(/[^0-9]/g, '');
        if (requestCountArray != '') {
            if (parseInt(requestCountArray) > loadRequestLimit) {
                isLoadFiftyCase = true;
                totalPendingAllRequests = requestCountArray;
                loadAllRequestsUptoFifty(requestCountArray);
            } else {
                loadAllRequests(requestCountArray);
            }
        }
    } else if (message.type == 'approveOne') {

        console.log('approveOne');
        memberId = message.memberId;
        var selected = new Array();
        temp = new Array();
        groupData.forEach(function(item, i) {
            if (item[1].indexOf(memberId) > -1) {
                selected.push(item);
            } else {
                temp.push(item);
            }
        })
        if (selected.length > 0) {
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'callGoogleSheet',
                'fbGroupData': selected,
                'currentGroupDetails': currentGroupDetails
            });
            if (actualFBApprove) {
                $(RightSiteBarSelector + " button.approve_one[data-testid='" + memberId + "']").next().trigger('click');
            }

            console.log(sendWelcomeMessage);
            if (sendWelcomeMessage) {
                sendWelcomeMessageToOne(memberId, selected[0][2], selected[0][6], selected[0][7], selected[0][8], selected[0][9], selected[0][10], selected[0][11]);
                if (isTaggingOn) {
                    $('#overlay-gr').show();
                } else {
                    $('#overlay-gr').hide();
                }
            } else {
                $('#overlay-gr').hide();
            }
            if (isTaggingOn) {
                console.log('isTaggingOn : ' + isTaggingOn);
                $('#overlay-gr').show();
                $("#groupleads_model .gr-msg").text('Tagging to welcome post starts in');
                $('.gr-wait-min').html(1)
                showHideTab('tagging-wait-tab')
                $('#groupleads_model .close').hide();
                setTimeout(() => {
                    $("#groupleads_model .gr-msg").text('Tagging to welcome post');
                    $('#groupleads_model .gr-tab').hide();
                    if ($('#pagelet_bluebar').length == 0) {
                        chrome.runtime.sendMessage({
                            "type": "getNumericFbIdSingle",
                            "alphaId": memberId
                        });
                    } else {
                        tagToWelcomePost(false, memberId);
                    }
                    $('#groupleads_model .close').show();
                    $('#overlay-gr').hide();
                }, 4000 + 60000);
            }
        }
        groupData = temp;
    } else if (message.type == 'auto_start_scraping') {
        if (window.location.pathname.indexOf('groups') > -1) {
            var findNoOfRequest = setInterval(() => {
                if (($('div[aria-label="Area where all of the admin tools are"][role="navigation"] span:containsI("Participant Request")').length > 0) && $('span:containsI("Member Request")').length == 0) {
                    clearInterval(findNoOfRequest);
                    clearInterval(findNoOfRequestInOld);
                    $('div[aria-label="Area where all of the admin tools are"][role="navigation"] span:containsI("Participant Request")').mclick();
                    $('div[aria-label="Area where all of the admin tools are"][role="navigation"] span:containsI("Member Request")').mclick();
                    showAutomationOverlayMessages(message.tabId, message.autoSettingsOfGroup);
                }
            }, 200)
            var findNoOfRequestInOld = setInterval(() => {
                if ($('span:containsI("Member Request")').length > 0 && $('span:containsI("Participant Request")').length == 0) {
                    clearInterval(findNoOfRequestInOld);
                    clearInterval(findNoOfRequest);
                    $('span:containsI("Member Request")').mclick();
                    showAutomationOverlayMessages(message.tabId, message.autoSettingsOfGroup);
                }
            }, 200)
            var findNoOfRequestInOld = setInterval(() => {
                if ($('span:containsI("Participant Request")').length > 0 && $('span:containsI("Member Request")').length == 0) {
                    clearInterval(findNoOfRequestInOld);
                    clearInterval(findNoOfRequest);
                    $('span:containsI("Participant Request")').mclick();
                    showAutomationOverlayMessages(message.tabId, message.autoSettingsOfGroup);
                }
            }, 200)
        }
    } else if (message.type == 'auto_start_scraping_complete') {
        console.log('auto_start_scraping_complete');
        if (actualFBApprove) {
            console.log('if');
            triggerClickOnValidMemberRequests();
        } else {
            console.log('else')
            autoApproveProcess = true;
            chrome.runtime.sendMessage({
                type: "closeSenderTab"
            });
        }
    } else if (message.type == 'triggerDeclineMessage' && message.from == 'background') {
        setTimeout(() => {
            triggerDeclineSendMessage(message.declineMessageText);
        }, 500);
    } else if (message.type == 'triggerWelcomeMessage' && message.from == 'background') {
        triggerWelcomeSendMessage(message.welcomeMessageText);
    } else if (message.type == 'triggerTagging' && message.from == 'background') {
        triggerTagging(message.commentText);
    } else if (message.type == 'triggerClickToSendChat' && message.from == 'background') {
        findBTN = setInterval(function() {
            if ($('a[aria-label="Send"]').length > 0) {
                clearInterval(findBTN);
                $('a[aria-label="Send"]').mclick();
                setTimeout(() => {
                    chrome.runtime.sendMessage({
                        type: "declineMessageSendCloseTab",
                        declineTabIdCopy: message.declineTabIdCopy
                    });
                }, 500)
            }
        }, 200);
    } else if (message.type == 'getNumericFbIdsStartTagging' && message.from == 'background') {
        taggingOneByOneToAll(message.data);
    } else if (message.type == 'startSingleTag' && message.from == 'background') {
        tagToWelcomePost(false, message.numericId);
    } else if (message.type == 'readQuestions' && message.from == 'background') {
        readQuestions(message.groupIdSync, message.fbGroupIdSync);
    } else if (message.type == 'declineOne') {
        var declineSheetFlag = message.declineSheetFlag;
        var automationDeclineRun = message.autodecline;
        memberId = message.memberId;
        var selected = new Array();
        temp = new Array();
        groupData.forEach(function(item, i) {
            if (item[1].indexOf(memberId) > -1) {
                selected.push(item);
            } else {
                temp.push(item);
            }
        })

        if (selected.length > 0) {
            if (declineSheetFlag) {
                port = chrome.runtime.connect({'name': 'formfiller'})
                port.postMessage({
                    'type': 'callGoogleSheetforDecline',
                    'fbGroupData': selected,
                    'currentGroupDetails': currentGroupDetails
                });
            }
            requesterFirstName = selected[0][3];
            requesterLastName = selected[0][4];
            groupName = selected[0][0];
            var randomMessageTextArray = [];
            var declineMessageText = '';
            if (actualFBDecline) {
                setInterval(function() {
                    console.log('there?');
                    $("div[aria-label='Query error']").find("div[aria-label='OK']").mclick();
                    $('div[aria-label="Query Error"]').find('div[aria-label="OK"]').mclick();
                }, 1000);
                $('div.gl-processed[data-testid="' + memberId + '"]').find('div[aria-label="Decline"]').mclick(); /// trigger actual decline
            }

            if (currentGroupDetails[0].decline_message_status == 1 && !automationDeclineRun) {
                if (currentGroupDetails[0].decline_message != null && currentGroupDetails[0].decline_message.length > 0) {
                    randomMessageTextArray.push(currentGroupDetails[0].decline_message);
                }
                if (currentGroupDetails[0].decline_message_two != null && currentGroupDetails[0].decline_message_two.length > 0) {
                    randomMessageTextArray.push(currentGroupDetails[0].decline_message_two);
                }
                if (currentGroupDetails[0].decline_message_three != null && currentGroupDetails[0].decline_message_three.length > 0) {
                    randomMessageTextArray.push(currentGroupDetails[0].decline_message_three);
                }
                if (currentGroupDetails[0].decline_random_status == 1) {
                    declineMessageText = randomMessageTextArray[Math.floor(Math.random() * randomMessageTextArray.length)];
                } else {
                    if (currentGroupDetails[0].decline_message != null && currentGroupDetails[0].decline_message.length > 0) {
                        declineMessageText = currentGroupDetails[0].decline_message;
                    }
                }
                if (declineMessageText.indexOf('[first_name]') > -1) {
                    declineMessageText = declineMessageText.replace(/\[first_name]/g, requesterFirstName);
                }
                if (declineMessageText.indexOf('[last_name]') > -1) {
                    declineMessageText = declineMessageText.replace(/\[last_name]/g, requesterLastName);
                }
                if (declineMessageText.indexOf('[full_name]') > -1) {
                    declineMessageText = declineMessageText.replace(/\[full_name]/g, requesterFullName);
                }
                if (declineMessageText.indexOf('[group_name]') > -1) {
                    declineMessageText = declineMessageText.replace(/\[group_name]/g, groupName);
                }
                if (declineMessageText.indexOf('[group_url]') > -1) {
                    cur_FB_Group_Url = 'http://facebook.com/groups/' + currentGroupDetails[0].groupFbId;
                    declineMessageText = declineMessageText.replace(/\[group_url]/g, cur_FB_Group_Url);
                }
                if (declineMessageText.indexOf('[q1]') > -1 || declineMessageText.indexOf('[q2]') > -1 || declineMessageText.indexOf('[q3]') > -1) {
                    declineMessageText = replaceQuestions(declineMessageText);
                }
                declineMessageText = replaceAnswers(declineMessageText, selected[0][6], selected[0][7], selected[0][8], selected[0][9], selected[0][10], selected[0][11]);
                chrome.runtime.sendMessage({
                    'type': 'sendWelcomeMessage',
                    threadId: memberId,
                    welcomeMessageText: declineMessageText
                });
            } else {
                if (!declineAllOnly) {
                    $('#overlay-gr').hide();
                }
            }
        }
        groupData = temp;
    } else if (message.type == "start_scraping_decline") {
        $("#overlay-gr").show();
        tmessage = selected_lang_locale.content_script_message.loading_requests
        $("#groupleads_model .gr-msg").text(tmessage);
        $("#groupleads_model .gr-contents").hide();
        requestCountArray = 0;
        let tabTitle = getTabTitleText()
        requestCountArray = tabTitle.replace(/[^0-9]/g, '');
        loadAllDeclineRequests(requestCountArray);
    }else if(message.type == "getActiveGroupIds"){
        getFacebookGroupIds();
    }else if(message.type == 'backgroudActiveState' && message.from == 'background'){
        console.log(message);
        setInterval(()=>{
            chrome.runtime.sendMessage({'type': 'inactiveToActive','from': 'contenscript'})
        },500);
    }
});
$(function() {
    setInterval(() => {
        chrome.storage.local.get(["user"], function(result) {
            if (typeof result.user != "undefined" && result.user != "" && groupSettingsExist) {
                if (result.user.customer_approve_first) {
                    //console.log(result.user.customer_approve_first);
                    loadRequestLimit = result.user.customer_approve_first;
                }
                //console.log(loadRequestLimit);
                if ($('#pagelet_bluebar').length == 0) {
                    isNewFB = true;
                    $('div.rq0escxv.l9j0dhe7.du4w35lb.d2edcug0.rj1gh0hx.buofh1pr.g5gj957u.hpfvmrgz.j83agx80.dp1hu0rb').attr('id', 'member_requests_pagelet').addClass('facebook-new-ver');
                }
                ////////////// decline message feature /////////
                var isDeclineMessage = false;
                if (currentGroupDetails.length == 1) {
                    if (currentGroupDetails[0].decline_message != null && currentGroupDetails[0].decline_message.length > 0) {
                        isDeclineMessage = true;
                    }
                    if (currentGroupDetails[0].decline_message_two != null && currentGroupDetails[0].decline_message_two.length > 0) {
                        isDeclineMessage = true;
                    }
                    if (currentGroupDetails[0].decline_message_three != null && currentGroupDetails[0].decline_message_three.length > 0) {
                        isDeclineMessage = true;
                    }
                }
                if (currentGroupDetails.length == 1) {
                    if (window.location.pathname.indexOf('participant_requests') > -1 || window.location.pathname.indexOf('member-requests') > -1 || window.location.pathname.indexOf('requests') > -1) {
                        if (currentGroupDetails.length == 1 && currentGroupDetails[0].decline_message_status == 1 && isDeclineMessage) {
                            //console.log('decline_message_status if')
                            $('div[aria-label="Decline"]').hide();
                            $(".decline_one").text("Decline and send message");
                            $(".groupleads_custom_decline_all").text("Decline All and send message");
                            $(".groupleads_custom_decline_all").show();
                            //$(".decline_one,.groupleads_custom_decline_all").show();
                            $("[name='decline_all']:not(.groupleads_custom_decline_all),[name='decline']:not(.decline_one)").hide();
                            if (window.location.pathname.indexOf('pending_posts') > -1) {
                                //console.log('if');
                                $("div[aria-label='Decline All']:not(.groupleads_custom_decline_all),[aria-label='Decline']:not(.decline_one)").show();
                            } else {
                                //console.log('else');
                                $("div[aria-label='Decline All']:not(.groupleads_custom_decline_all),[aria-label='Decline']:not(.decline_one)").hide();
                            }
                            // SHOW DECLINE BUTTON IN "DECLINE WITH FEEDBACK" OPTION
                            $('div[aria-label="Decline with feedback"][role="dialog"] div[aria-label="Decline"]').show();
                        } else {
                            $('div[aria-label="Decline"]').hide();
                            $("div[aria-label='Decline All']:not(.groupleads_custom_decline_all)").hide();
                            $("div[aria-label='Decline']:not(.decline_one)").hide();
                            $(".decline_one").text("Decline");
                            $(".groupleads_custom_decline_all").text("Decline All");
                            $(".groupleads_custom_decline_all").show();
                            // SHOW DECLINE BUTTON IN "DECLINE WITH FEEDBACK" OPTION
                            $('div[aria-label="Decline with feedback"][role="dialog"] div[aria-label="Decline"]').show();
                        }
                    }
                    if (currentGroupDetails[0].message_only_status == 1 && currentGroupDetails[0].message_only_one != null && currentGroupDetails[0].message_only_one != '') {
                        $('button.gl-message-only').show();
                    } else {
                        $('button.gl-message-only').hide();
                    }
                }
                ////////////// decline message feature end /////////
                ////////////// welcome message feature /////////
                var isWelcomeMessage = false;
                if (currentGroupDetails.length == 1) {
                    if (currentGroupDetails[0].welcome_message_one != null && currentGroupDetails[0].welcome_message_one.length > 0) {
                        isWelcomeMessage = true;
                    }
                    if (currentGroupDetails[0].welcome_message_two != null && currentGroupDetails[0].welcome_message_two.length > 0) {
                        isWelcomeMessage = true;
                    }
                    if (currentGroupDetails[0].welcome_message_three != null && currentGroupDetails[0].welcome_message_three.length > 0) {
                        isWelcomeMessage = true;
                    }
                    if (currentGroupDetails[0].welcome_message_four != null && currentGroupDetails[0].welcome_message_four.length > 0) {
                        isWelcomeMessage = true;
                    }
                    if (currentGroupDetails[0].welcome_message_five != null && currentGroupDetails[0].welcome_message_five.length > 0) {
                        isWelcomeMessage = true;
                    }
                }
                var totalPendingRequests = 0;
                let tabTitle = getTabTitleText()
                totalPendingRequests = tabTitle.replace(/[^0-9]/g, '');
                if (currentGroupDetails.length == 1 && currentGroupDetails[0].welcome_message_status == 1 && isWelcomeMessage) {
                    $(".approve_one").text('Approve and send message');
                    if (totalPendingRequests <= loadRequestLimit) {
                        $(".groupleads_custom_approve_all").text('Custom Approve All And Send Message');
                    } else {
                        $(".groupleads_custom_approve_all").text('Custom Approve First ' + loadRequestLimit + ' And Send Message');
                    }
                    sendWelcomeMessage = true;
                } else {
                    $(".approve_one").text('Approve');
                    //console.log('custom7')
                    if (totalPendingRequests <= loadRequestLimit) {
                        //console.log('custom8')
                        $(".groupleads_custom_approve_all").text('Custom Approve All');
                    } else {
                        $(".groupleads_custom_approve_all").text('Custom Approve First ' + loadRequestLimit);
                    }
                    sendWelcomeMessage = false;
                }
                ///////////// welcome message feature end //////////
                ////////////// tagging message feature /////////
                var isTagMessage = false;
                if (currentGroupDetails.length == 1) {
                    if (currentGroupDetails[0].tag_message_one != null && currentGroupDetails[0].tag_message_one.length > 0) {
                        isTagMessage = true;
                    }
                    if (currentGroupDetails[0].tag_message_two != null && currentGroupDetails[0].tag_message_two.length > 0) {
                        isTagMessage = true;
                    }
                    if (currentGroupDetails[0].tag_message_three != null && currentGroupDetails[0].tag_message_three.length > 0) {
                        isTagMessage = true;
                    }
                    if (currentGroupDetails[0].tag_message_four != null && currentGroupDetails[0].tag_message_four.length > 0) {
                        isTagMessage = true;
                    }
                    if (currentGroupDetails[0].tag_message_five != null && currentGroupDetails[0].tag_message_five.length > 0) {
                        isTagMessage = true;
                    }
                }
                if (currentGroupDetails.length == 1 && currentGroupDetails[0].tag_status == 1 && isTagMessage) {
                    isTaggingOn = true;
                } else {
                    isTaggingOn = false;
                }
                ///////////// tagging message feature end //////////
            } else {
                $(".decline_one,.groupleads_custom_decline_all").hide();
                $("[name='decline_all']:not(.groupleads_custom_decline_all),[name='decline']:not(.decline_one),div[aria-label='Decline All'],div[aria-label='Decline']").show();
            }
        });
    }, 400);
    setInterval(() => {
        if ($('h2 span:contains("Cannot Deny Request to Join")').length > 0) {
            $('h2 span:contains("Cannot Deny Request to Join")').closest('div[aria-label]').find('div[aria-label="OK"]').mclick();
            $('h2 span:contains("Cannot Deny Request to Join")').closest('div[aria-label]').find('div[aria-label="OK"]').mclick();
        }
    }, 200);

    $(document).on('click', 'div[aria-label="Actions for this post"]', function() {
        var url = $(this).closest('div[role="article"]').find('.cwj9ozl2.tvmbv18p div[aria-label="Like"]:eq(0)').closest('ul').find('a:eq(0)').attr('href');
        if (url == undefined) {
            if ($(this).closest('div[role="article').find('.qzhwtbm6.knvmm38d:eq(1) span a[aria-label]').length > 0) {
                $(this).closest('div[role="article').find('.qzhwtbm6.knvmm38d:eq(1) span a[aria-label]').focus();
                setTimeout(() => {
                    url = $(this).closest('div[role="article').find('.qzhwtbm6.knvmm38d:eq(1) span a[aria-label]').attr('href');
                }, 100);
            }
        }
        
        setTimeout(() => {
            if (typeof url != 'undefined' && url.length > 0) {
                //console.log(url);
                var fb_post_id_link = '';
                if (url.indexOf('fbid=') > -1) {
                    var urlTemp = new URL(url);
                    fb_post_id_link = urlTemp.searchParams.get('fbid');
                   
                    if (fb_post_id_link == null) {
                        if (url.indexOf('story_fbid=') > -1) {
                            fb_post_id_link = url.split('story_fbid')[1];
                            fb_post_id_link = fb_post_id_link.split('&')[0];
                        }
                    }
                   
                } else if (url.indexOf('/posts/') > -1) {
                    fb_post_id_link = url.split('/posts/')[1];
                    if (fb_post_id_link.indexOf('?') > -1) {
                        fb_post_id_link = fb_post_id_link.split('?')[0];
                    }
                } else if (url.indexOf('post_id=') > -1) {
                    var urlTemp = new URL(url);
                    fb_post_id_link = urlTemp.searchParams.get('post_id');
                } else if (url.indexOf('/permalink/') > -1) {
                    fb_post_id_link = url.split('/permalink/')[1];
                    if (fb_post_id_link.indexOf('/') > -1) {
                        fb_post_id_link = fb_post_id_link.split('/')[0];
                    }
                }

                if (fb_post_id_link != '' && fb_post_id_link != 'undefined' && fb_post_id_link != null) {
                    var html = `<li fb_post_id= "` + fb_post_id_link + `" class="groupleads-menu-item new_fb __MenuItem">
			        <a href="javascript:void(0);" class="_54nc" ><img class="_2yaw img" aria-hidden="true" src="` + chrome.extension.getURL("icon32.png") + `" alt="" style=" max-height: 13px;max-width: 13px;"> <span>Copy Post Url</span></a>
				    </li>`;
                    findModel = setInterval(() => {
                        if ($('div[role="menuitem"]:containsI(announcement)').length > 0 || $('div[role="menuitem"]:containsI(Find support or report post)').length > 0 || $('div[role="menuitem"]:containsI(Save product)').length > 0 || $('div[role="menuitem"]:containsI(Turn on notifications for this post)').length > 0) {
                            console.log($('div[role="menuitem"]:containsI(announcement)').length)
                            clearInterval(findModel);
                            $('.groupleads-menu-item').remove();
                            $('div[role="menuitem"]:eq(0)').before(html);
                        }
                    }, 200)
                }
            }
        }, 200);
    });

    $(document).on("click", '.groupleads-menu-item.new_fb', function() {
        urlMessageId = $(this).attr('fb_post_id');
        $(this).find('span').text("Copied!!");
        copyToClipboard("https://www.facebook.com/" + urlMessageId);
        setTimeout(() => {
            $(this).find('span').text("Copy Post Url");
        }, 2000);
    });

    integrateBtn();

    setInterval(() => {
        integrateBtn();
    }, 3000);
});
var totalRequestsThreadsCounterWelcome = 0;

function sendWelcomeMessageOneByOneToAll($membersToSendMessage, startIndex) {
    $("#groupleads_model .close").hide();
    processThreadDealy = 0;
    callAgainFlag = true;
    for (var i = startIndex; i <= $membersToSendMessage.length; i++) {
        if (currentGroupDetails[0].welcome_limit == 0 || i <= currentGroupDetails[0].welcome_limit) {
            setTimeout(() => {
                sendWelcomeMessageThreadOne($membersToSendMessage[totalRequestsThreadsCounterWelcome]);
                totalRequestsThreadsCounterWelcome++;
                $('.gr-msg-counter').html(totalRequestsThreadsCounterWelcome)
                $('.gr-msg-total').html($membersToSendMessage.length)
                $("#groupleads_model .gr-msg").text('');
                showHideTab('sending-message-counter-tab');
                //$("#groupleads_model  span.gr-card-body").html('Sending message <br> Counter: '+totalRequestsThreadsCounterWelcome+'<br>Total: '+$membersToSendMessage.length);
                if (totalRequestsThreadsCounterWelcome == $membersToSendMessage.length) {
                    //	console.log('tagging');
                    $("#groupleads_model .close").show();
                    $("#overlay-gr").show();
                    $("#groupleads_model .gr-msg").text('');
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    if (isLoadFiftyCase) {
                        tmessage = loadRequestLimit + ' out of ' + totalPendingAllRequests + ' completed'
                        $("#groupleads_model .gr-msg").text(tmessage);
                    }
                    showHideTab('complete-tab');
                    if (isTaggingOn) {
                        $("#groupleads_model .gr-msg").text('Tagging to welcome post starts in');
                        $('#groupleads_model .gr-wait-min').html(tagDelayToTagInMin);
                        showHideTab('tagging-wait-tab');
                        $('#groupleads_model .close').hide();
                        var tagDelayToTagtemp = 0;
                        if ($membersToSendMessage.length < 15) {
                            tagDelayToTagtemp = tagDelayToTag
                        }
                        var groupAllMembersTemp = $membersToSendMessage;
                        setTimeout(() => {
                            $("#groupleads_model .gr-msg").text('Tagging to welcome post');
                            if ($('#pagelet_bluebar').length == 0) {
                                chrome.runtime.sendMessage({
                                    type: "getNumericFbIds",
                                    data: groupAllMembersTemp
                                });
                            } else {
                                taggingOneByOneToAll(groupAllMembersTemp);
                            }
                            $('#groupleads_model .close').show();
                        }, tagDelayToTagtemp);
                    }
                    $membersToSendMessage = [];
                }
            }, (processThreadDealy * 60000))
        } else {
            if (callAgainFlag) {
                callAgainFlag = false;
                setTimeout(() => {
                    if ($membersToSendMessage.length != 0) {
                        //sendWelcomeMessageOneByOneToAll($membersToSendMessage, totalRequestsThreadsCounterWelcome - 1);
                        sendWelcomeMessageOneByOneToAll($membersToSendMessage, 1);
                    }
                }, (processThreadDealy + parseInt(currentGroupDetails[0].welcome_start_time)) * 60000);
                setTimeout(() => {
                    if ($membersToSendMessage.length != 0) {
                        //$("#groupleads_model span").text('Limit reached will be resume in '+currentGroupDetails[0].welcome_start_time+' min.');
                        $("#groupleads_model .gr-msg").text('Limit reached will be resume in');
                        $('#groupleads_model .gr-wait-min').html(currentGroupDetails[0].welcome_start_time);
                        showHideTab('tagging-wait-tab');
                    }
                }, (processThreadDealy * 60000));
            }
        }
        processThreadDealy = processThreadDealy + parseInt(currentGroupDetails[0].welcome_interval);
    }
}
var totalRequestsThreadsCounterTag = 0

function taggingOneByOneToAll($membersToSendMessage) {
    $("#groupleads_model .close").hide();
    if (false) {
        console.log('false in')
        processThreadDealy = 0;
        for (var i = 0; i <= $membersToSendMessage.length - 1; i++) {
            setTimeout(() => {
                tagToWelcomePost($membersToSendMessage[totalRequestsThreadsCounterTag]);
                totalRequestsThreadsCounterTag++;
                // $("#groupleads_model span").html('Tagging <br> Counter: '+totalRequestsThreadsCounterTag+'<br>Total: '+$membersToSendMessage.length);
                $("#groupleads_model .gr-msg").html('Tagging');
                $('#groupleads_model .gr-tag-counter').html(totalRequestsThreadsCounterTag)
                $('#groupleads_model .gr-tag-total').html($membersToSendMessage.length)
                showHideTab('tagging-counter-tab');
                if (totalRequestsThreadsCounterTag == $membersToSendMessage.length) {
                    $("#groupleads_model .close").show();
                    $membersToSendMessage = [];
                    $("#overlay-gr").show();
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    $("#groupleads_model .gr-msg").text('');
                    if (isLoadFiftyCase) {
                        tmessage = loadRequestLimit + ' out of ' + totalPendingAllRequests + ' completed'
                        $("#groupleads_model .gr-msg").text(tmessage);
                    }
                    $("#overlay-gr .close").show();
                    showHideTab('complete-tab');
                }
            }, (processThreadDealy))
            processThreadDealy = processThreadDealy + 15000;
        }
        //}else if(currentGroupDetails[0].tag_all == 1){
    } else if (true) {
        console.log('true in');
        var welcomePostUrlArray = currentGroupDetails[0].tag_post_url.split('/')
        //console.log(welcomePostUrlArray);
        welcomePostUrl = welcomePostUrlArray[welcomePostUrlArray.length - 1];
        if (welcomePostUrl == '') {
            welcomePostUrl = welcomePostUrlArray[welcomePostUrlArray.length - 2];
        }
        welcomePostUrl = welcomePostUrl.replace("/", "");
        //console.log(welcomePostUrl);
        var tagIds = '';
        var tagIdArray = [];
        sendMessageIndex = 0;
        //console.log($membersToSendMessage);
        $membersToSendMessage.forEach(function(oneMemberIn, index) {
            //console.log(oneMemberIn)
            var threadIdArray = oneMemberIn[1].split('/');
            var threadId = threadIdArray[threadIdArray.length - 1];
            //console.log(threadId);
            if (threadId != '') {
                if (sendMessageIndex >= limitToTagInOnePost) {
                    //console.log('if');
                    tagIdArray.push(tagIds);
                    //console.log(tagIdArray);
                    sendMessageIndex = 0;
                    tagIds = '';
                    if (!(/[a-zA-Z]/.test(threadId))) {
                        tagIds = '&ids[' + sendMessageIndex + ']=' + threadId;
                        //console.log(tagIds)
                    }
                    if (index == $membersToSendMessage.length - 1 && tagIds != '') {
                        tagIdArray.push(tagIds);
                    }
                } else {
                    //console.log('else');
                    tagIds += '&ids[' + sendMessageIndex + ']=' + threadId;
                }
            }
            if (limitToTagInOnePost >= $membersToSendMessage.length && index == $membersToSendMessage.length - 1) {
                tagIdArray.push(tagIds);
            }
            sendMessageIndex = sendMessageIndex + 1;
        });
        tagIdArrayDelay = 0;
        tagIdArrayCounter = 0;
        var randomDelayForTagging = [30000, 31000, 36000, 32000, 45000, 31000, 44000, 31000, 41000, 42000];
        totalRequestsThreadsCounterTag = 0;
        tagIdArray.forEach(function(oneString, indexTwo) {
            setTimeout(() => {
                tagIdArrayCounter++;
                welcomePostUrlForComment = 'https://d.facebook.com/mbasic/comment/advanced/?target_id=' + welcomePostUrl + '&pap&at=compose&photo_comments' + oneString + '&is_from_friend_selector=1&_rdr';
                var welcomeMessageText = '';
                if (currentGroupDetails[0].with_text == 0) {
                    welcomeMessageText = getCommentMessage();
                }
                $("#groupleads_model .gr-msg").html('Tagging');
                totalRequestsThreadsCounterTag = totalRequestsThreadsCounterTag + limitToTagInOnePost;
                $('#groupleads_model .gr-tag-counter').html(totalRequestsThreadsCounterTag)
                $('#groupleads_model .gr-tag-total').html($membersToSendMessage.length)
                showHideTab('tagging-counter-tab');
                chrome.runtime.sendMessage({
                    'type': 'commentTagging',
                    welcomePostUrl: welcomePostUrlForComment,
                    commentText: welcomeMessageText
                });
                if (tagIdArrayCounter == tagIdArray.length) {
                    $("#groupleads_model .close").show();
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    $("#groupleads_model .gr-msg").text('');
                    if (isLoadFiftyCase) {
                        tmessage = loadRequestLimit + ' out of ' + totalPendingAllRequests + ' completed'
                        $("#groupleads_model .gr-msg").text(tmessage);
                    }
                    showHideTab('complete-tab');
                }
            }, tagIdArrayDelay)
            var rnDelay = randomDelayForTagging[Math.floor(Math.random() * randomDelayForTagging.length)]
            tagIdArrayDelay = tagIdArrayDelay + rnDelay;
        });
    }
}

function approveRequestOnSelectionBase() {
    if ($('#pagelet_bluebar').length == 0) {
        $("#overlay-gr").show();
        // tmessage = selected_lang_locale.content_script_message.uploading_message
        $("#groupleads_model .gr-msg").text('Please wait');
        var groupAllMembers = new Array();
        var groupName = getGroupName();
        //console.log('approveRequestOnSelectionBase');
        console.log($('#member_requests_pagelet .gl-approve-custom-limit').length);
        var rightSideWrap = "#member_requests_pagelet";
        if ($(rightSideWrap).length == 0) {
            rightSideWrap = 'div[aria-label="Group Content"]';
        }
        if ($(rightSideWrap).length == 0) {
            rightSideWrap = 'div[aria-label="Group content"]';
        }
        // $("#member_requests_pagelet .gl-approve-custom-limit").each(function(index) {
        $(rightSideWrap + " .gl-approve-custom-limit").each(function(index) {
            //console.log('approveRequestOnSelectionBase 1');
            temp = '';
            tempProfileIdNewFB = $.trim($(this).find('a:eq(1)').attr('href'));
            $(this).find('div[aria-label="Approve"]').addClass('gl-under-custom-limit');
            if (tempProfileIdNewFB.indexOf('/user/') > -1) {
                temp = tempProfileIdNewFB.split('/user/')[1];
                temp = temp.replace('/', '');
            } else if (tempProfileIdNewFB.indexOf('profile.php?id=') > -1) {
                temp = tempProfileIdNewFB.split('profile.php?id=')[1];
            } else {
                tempArray = $.trim($(this).find('a:eq(1)').attr('href')).split('/');
                temp = tempArray[tempArray.length - 1];
            }
            member = new Array();
            member.push(groupName);
            member.push(tabLocation.protocol + '//' + tabLocation.host + '/' + temp);
            full_name = $.trim($(this).find('a:eq(1)').text()).split(' ');
            member.push(full_name.join(" "));
            member.push(full_name[0]);
            member.push(full_name[full_name.length - 1]);
            joinedFbOn = $("div[data-testid='" + temp + "'] span:containsI(Joined Facebook)").text().replace('Joined Facebook', '');
            member.push(joinedFbOn);
            countAnswers = 0;
            $(this).find("ul li").each(function(sqn) {
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
            var livesIn = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Lives in)").find('a').text();
            if (livesIn == '') {
                livesIn = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(From )").find('a').text();
            }
            member.push(livesIn);
            var workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Worked at)").text();
            if (workedAt == '') {
                workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Works at)").text();
            }
            if (workedAt == '') {
                workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Founder at)").text();
            }
            if (workedAt == '') {
                workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Owner at)").text();
            }
            if (workedAt == '') {
                workedAt = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(Studied at)").text();
            }
            member.push(workedAt);
            var addedBy = '';
            if (addedBy == '') { //	Invited by 
                addedBy = $.trim($(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] span:containsI(Invited by) a").text());
            }
            var addedByTimeStamp = '';
            if (addedByTimeStamp == '') {
                addedByTimeStamp = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] span:containsI(Invited by)").text();
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
            var commonGroupText = $(RightSiteBarSelector + " " + MemberRequestSelector + "[data-testid='" + temp + "'] " + memberRequestMetaDataContainer + " span:containsI(in Common)").text().split('·');
            if (commonGroupText.length > 0 && commonGroupText[0].indexOf('in Common') > -1) {
                commonGroup = commonGroupText[0].replace(/[^0-9]/g, '');
            }
            member.push(commonGroup);
            var currentUserName = getCurrentUSerName();
            member.push(currentUserName);
            console.log(member);
            groupAllMembers.push(member);
        });
        //console.log('test4');
        //console.log(groupAllMembers)
        if (groupAllMembers.length > 0) {
            port = chrome.runtime.connect({'name': 'formfiller'})
            port.postMessage({
                'type': 'callGoogleSheet',
                'fbGroupData': groupAllMembers,
                'currentGroupDetails': currentGroupDetails
            });
            if (actualFBApprove) {
                $("div.gl-under-custom-limit").each(function(index) {
                    $(this).trigger('click');
                });
            }
            if (sendWelcomeMessage) {
                $("#groupleads_model .gr-msg").text('Sending welcome messages');
                $("#groupleads_model .gr-contents").hide();
                sendWelcomeMessageOneByOneToAll(groupAllMembers, 1);
            } else if (isTaggingOn) {
                console.log('isTaggingOn : ' + isTaggingOn);
                //$("#groupleads_model span").text('Tagging to welcome post will start in '+tagDelayToTagInMin+' minutes');
                $("#groupleads_model .gr-msg").text('Tagging to welcome post starts in');
                $('#groupleads_model .gr-wait-min').html(tagDelayToTagInMin);
                showHideTab('tagging-wait-tab');
                $('#groupleads_model .close').hide();
                var tagDelayToTagtemp = 0;
                if (!sendWelcomeMessage) {
                    tagDelayToTagtemp = tagDelayToTag
                } else if (groupAllMembers.length < 15) {
                    tagDelayToTagtemp = tagDelayToTag
                }
                var groupAllMembersTemp = groupAllMembers;
                setTimeout(() => {
                    // $("#groupleads_model span").text('Tagging to welcome post');
                    $("#groupleads_model .gr-msg").text('Tagging to welcome post');
                    $("#groupleads_model .gr-contents").hide();
                    if ($('#pagelet_bluebar').length == 0) {
                        console.log('in');
                        chrome.runtime.sendMessage({
                            type: "getNumericFbIds",
                            data: groupAllMembersTemp
                        });
                    } else {
                        console.log('else');
                        taggingOneByOneToAll(groupAllMembersTemp);
                    }
                    $('#groupleads_model .close').show();
                }, tagDelayToTagtemp); /////////ppppppp
            } else {
                setTimeout(function() {
                    tmessage = selected_lang_locale.content_script_message.complete_message
                    $("#groupleads_model .gr-msg").text(''); ///4556789
                    showHideTab('complete-tab');
                    setTimeout(function() {
                        $("#overlay-gr").hide();
                    }, 3000);
                }, 2000);
            }
            groupAllMembers = [];
        }
    }
}
setInterval(() => {
    if (window.location.href.indexOf('/groups/') > -1 && (window.location.href.indexOf('member-requests') > -1 || window.location.href.indexOf('participant_requests') > -1) && $('.member-request-li').length) {
        $('.gl-approve-on-selection').show()
    } else {
        $('.gl-approve-on-selection').hide()
    }
}, 200);