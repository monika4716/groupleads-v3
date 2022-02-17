var credentialEditTempStorageTime = 15; /// in minutes
var currentUnlinkGroupId = '';
var userId = '';
var planConfig = {};
var groupLimit = 4;
var allGroupDataArray = [];
var groupDataFetched = false;
var $lastActiveTab = null;
var activeCampaignApiUrl = null;
var activeCampaignApiToken = null;
var activekeapCompanyId = null;
var activekeapApiToken = null;
var keapAccessToken = null;
var keapRefreshToken = null;
var groupLeadsApiToken = null;
var jwtToken = null;
var selected_lang_locale = null;
/////////delele group//////////
var groupIdToDelete = 0;
var fbGroupIdToDeleteGroup = 0;
//////////end delete group //////
var lang_data = null;
var lastOpenedScreen = "";
var declineRandomMessageHtml = '';
var welcomeRandomMessageHtml = '';
var tagRandomMessageHtml = '';
var validPostUrl = true;
var hash = "";
var showFillCredentialMessage = false;
var showFocusGroupScreen = false;
chrome.cookies.get({
    url: baseUrl,
    name: "jwt_token"
}, function(result) {
    if (result != null) {
        jwtToken = result.value;
    }
});
var activecampaignDefaultHtml = `<span>Select Tags</span>
                <div class="form-group">
                    <div class="input-group">
                        <select style="width: 100%" id="active-cmpaign-tags" multiple  data-role="tagsinput">
                        </select>
                        <div class="input-group">
                          <input style="" type="text" autocomplete="off" id="searchActiveTag" name="searchActiveTag" placeholder="Search tags" class="form-control" />
                          <div class="input-group-append">
                            <button class="btn actg_findbtn" id="searchActiveTagFindBtn" style="line-height:14px;" type="button">Find</button>
                          </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-2" id="dispaytagresults">
                    <ul class ="displayTagUl"></ul>
                </div>`;
var keapDefaultHtml = `<span>Select Tags</span>
                        <div class="form-group">
                            <div class="input-group">
                                <select style="width: 100%" id="keap-tags" multiple  data-role="tagsinput">
                                </select>
                                <div class="input-group">
                                  <input style="" type="text" autocomplete="off" id="searchKeapTag" name="searchKeapTag" placeholder="Search tags" class="form-control" />
                                  <div class="input-group-append">
                                    <button class="btn actg_findbtn" id="searchKeapTagFindBtn" style="line-height:14px;" type="button">Find</button>
                                  </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mb-2" id="dispayKeaptagresults">
                            <ul class ="displayKeapTagUl"></ul>
                        </div>`;
var userLang = 'en';
var oAuth2Redirect = false;
var activeCampaignTags = [];
jQuery.fn.extend({
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
});
$('body').bind('DOMSubtreeModified', function(e) {
    // if (e.target.innerHTML.length > 0) {
    //     var height = $(".tabs").outerHeight(true);
    //     $('body').height(height);
    //     $('html').height(height);
    // }
});
$(document).ready(function() {
    $(document).on("keyup", '#name', function() {
        $(this).val($(this).val().replace(/[^a-z0-9s]/gi, ''));
        $(this).val($(this).val().replace(/\d+/, ''));
        var username = $(this).val();
        if (username.length > 40) {
            username = username.slice(0, 40);
            $(this).val(username);
        }
    });
    $(document).on("keyup", '.bootstrap-tagsinput input', function() {
        console.log('here');
        $(this).val($(this).val().replace(/[^a-z0-9s]/gi, ''));
        $(this).val($(this).val().replace(/\d+/, ''));
    });
    $(document).on("click", '.retry-credentials', function() {
        $('#Error_credentials_modal').modal('hide')
        $('#constant_contact_setup_modal').modal('show')
    })
    $(document).on("click", '.set-autoresponder', function() {
        var groupSettingId = $('#group_set_id').val();
        var selectedAutoresponderId = $('#autoresponderDropDown option:selected').val()
        updateAutoresponderPerGroup(groupSettingId, selectedAutoresponderId);
    })
    $(document).on("click", '.edit-m-n', function() {
        $(this).closest('.outer-message-can').find('.input-row').addClass('show'); //.show();
        $(this).closest('.outer-message-can').find('.display-row').hide();
    });
    $(document).on("click", '.m-temp-save', function() {
        $(this).closest('.outer-message-can').find('.input-row').removeClass('show');
        $(this).closest('.outer-message-can').find('.display-row').show();
        var tText = $(this).closest('.outer-message-can').find('.input-row textarea').val();
        $(this).closest('.outer-message-can').find('.display-m-text').text(tText);
    });
    $(document).on("click", '.automation-stats', function() {
        var groupId = $(this).attr('group-id');
        getAutomationRecords(groupId);
    })
    $(document).on("click", '.request_call_via_zoom_button', function() {
        window.open('https://docs.groupleads.net/article/74-request-zoom-setup-call');
    })
    $(document).on("click", '.view_tutorials_button', function() {
        window.open('https://docs.groupleads.net/');
    })
    $('.open-sidebar').click(function() {
        $('.sidenav').slideDown(500);
        $('.close-sidebar').show();
        $(this).hide()
    });
    $('.tab, .nav-com').click(function() {
        $('.close-sidebar').hide();
        $('.open-sidebar').show();
        $('.sidenav').slideUp(500);
        $('.open-sidebar').show();
    });
    $('.close-sidebar').click(function() {
        $(this).hide()
        $('.sidenav').slideUp(500);
        $('.open-sidebar').show();
    });
    $('.dismiss-add-group-icon').click(function() {
        $('.add-group-event-container').hide();
        $('.add_group').removeAttr('disabled');
        $('.setup_group').show();
    });
    $('.sidenav ul li').click(function() {
        var target = $(this).attr('data-target');
        if (target != '') {
            $('.tab').hide();
            $('#' + target).show();
        }
    });
    $('.left_arrow_icon').click(function() {
        $('.tab').hide();
        if ($(this).hasClass('back-btn') && lastOpenedScreen != '') {
            $(lastOpenedScreen).show();
        } else {
            $('#groups-yes').show();
        }
        $('.nav-link.google_sheet_setup').click();
    });
    $('.autoresponder_tab').click(function() {
        var selectedAutoresponderId = $('#autoresponderDropDown option:selected').val();
        if (selectedAutoresponderId == '') {
            messageToast('error', 'Select an autoresponder to continue.')
            showFillCredentialMessage = true;
        }
    });
    $('#plans').click(function() {
        var url = $('#plans a').attr('href');
        window.open(url);
    });
    $('#web').click(function() {
        var url = $('#web a').attr('href');
        window.open(url);
    });
    $('#rating').click(function() {
        var url = $('#rating a').attr('href');
        window.open(url);
    });
    $('.get_support').click(function() {
        var url = $('.get_support a').attr('href');
        window.open(url);
    })
    $('.affiliate').click(function() {
        var url = $('.affiliate a').attr('href');
        window.open(url);
    })
    $('.back_to_home').click(function() {
        $('.tab').hide();
        $('#groups-yes').show();
    });
    setHelpLinks();
    checkUserActivation();
    dashboard();
    $('#credentials_form #key, #credentials_form #url, #credentials_form #app_path').on('keyup', function() {
        var temp = {};
        if ($('#credentials_form #new_autoresponder').val() == 1) {
            temp.new_autoresponder = 1;
        } else {
            $('#credentials_form .cancel-edit').show();
            temp.new_autoresponder = 0;
        }
        temp.group_id = $('#credentials_form #group-id-credentails').val();
        temp.autoType = $('#credentials_form #autoresponder_type').val();
        temp.app_path = $('#credentials_form #app_path').val();
        temp.key = $('#credentials_form #key').val();
        temp.url = $('#credentials_form #url').val();
        chrome.storage.local.set({
            'credentialtemp': temp,
            'credentialEdit': true,
            'credentialEditTime': moment(moment().toDate(), "hh:mm:ss A").add(credentialEditTempStorageTime, 'minutes').toDate()
        });
    });
    $('#credentials_form .cancel-edit').on('click', function() {
        $('.cancel-edit').hide();
        chrome.storage.local.set({
            'credentialEdit': false
        });
        if ($('#credentials_form #new_autoresponder').val() == 1) {
            $('#credentials_form #app_path').val('');
            $('#credentials_form #key').val('');
            $('#credentials_form #url').val('');
            chrome.storage.local.set({
                'credentialtemp': ''
            });
        } else if ($('#credentials_form #new_autoresponder').val() == 0) {
            fillDbARCredentials();
        }
    });
    $("#autoresponder_status").on('change', function() {
        status = 1;
        if (this.checked) { //insert 1
            status = 0;
        }
        temp = {};
        temp.autoresponder_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        // updateSettingsPerGroup(temp);
        if (this.checked) { //insert 1
            var tArId = $('#autoresponderDropDown option:selected').val()
            if (tArId == '') {
                messageToast('error', 'Please select an Autoresponder');
                $('#autoresponder .set-autoresponder').prop('disabled', true)
            } else {
                $('#autoresponder .set-autoresponder').prop('disabled', false)
            }
        } else {
            $('#autoresponder .set-autoresponder').prop('disabled', false)
        }
    });
    //Enable Welcome Messaging
    $("#welcome_message_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('welcome_message');
        }
        groupWelcomeMessagePopup();
        temp = {};
        temp.welcome_message_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        console.log(temp);
        updateSettingsPerGroup(temp);
    });
    //Enable Decline Messaging
    $("#decline_message_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('decline_message');
        }
        temp = {};
        temp.decline_message_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        updateSettingsPerGroup(temp);
    });
    //Tag New Members In Welcome Post
    $("#tag_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('tag_members');
        }
        temp = {};
        temp.tag_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        updateSettingsPerGroup(temp);
    });
    //Send Message Only Settings
    $("#message_only_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('send_message_modal');
        }
        temp = {};
        temp.message_only_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        updateSettingsPerGroup(temp);
    });
    //Auto decline based on keywords
    $("#auto_decline_message_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('keywords');
        }
        temp = {};
        temp.auto_decline_message_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        updateSettingsPerGroup(temp);
    });
    $("#chatsilo_tag_status").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
            openSettingBox('chatsilo_modal');
        }
        temp = {};
        temp.chatsilo_tag_status = status;
        temp.userId = userId;
        temp.groupId = $('#actual-group-id').val();
        updateSettingsPerGroup(temp);
    });
    /******** global settings *******/
    $("#global-autoresponder-status").on('change', function() {
        if (this.checked) { //insert 1
            updateGlobalAutoresponder(1);
        } else { ///insert 0
            updateGlobalAutoresponder(0);
        }
    });
    $("#customerApproveFirst").on('change', function() {
        var customerApproveFirst = $(this).val();
        if (customerApproveFirst != '') {
            updateCustomerApproveFirst(customerApproveFirst);
        }
    });
    $("#global-googlesheet-enable").on('change', function() {
        if (this.checked) {
            enableGlobalSheet(1);
        } else {
            enableGlobalSheet(0);
        }
    });
    $("#decline_random_status").on('change', function() {
        if (this.checked) {
            $('.add-random-message').show();
        } else {
            $('.decline-random-row-dynamic').remove()
            $('.add-random-message').hide();
        }
    });
    $("#welcome_random_status").on('change', function() {
        if (this.checked) {
            $('.add-random-message-welcome').show();
        } else {
            $('.welcome-random-row-dynamic').remove()
            $('.add-random-message-welcome').hide();
        }
    });
    $("#tag_random_status").on('change', function() {
        if (this.checked) {
            $('#tag_with_text_comment').prop('checked', false);
            $('.add-random-tag-comment').show();
        } else {
            $('#tag_with_text_comment').prop('checked', true);
            $('.tag-random-row-dynamic').remove()
            $('.add-random-tag-comment').hide();
        }
    });
    $("#tag_with_text_comment").on('change', function() {
        if (this.checked) {
            $('#tag_random_status').prop('checked', false);
            $('#tag_random_status').prop('disabled', true);
            $('.tag-random-row-dynamic').remove()
            $('.add-random-tag-comment').hide();
            $('.add-random-tag-comment').hide();
        } else {
            $('#tag_random_status').prop('checked', true);
            $('#tag_random_status').prop('disabled', false);
            $('.add-random-tag-comment').show();
            $('.add-random-tag-comment').show();
        }
    });
    /********* To show login form *******/
    $(".add-random-message").on('click', function() {
        if ($('.decline-random-row').length < 3) {
            $('.decline-random-container').append(declineRandomMessageHtml);
            $('.decline-random-container').find('.input-row').last().addClass('show')
            $('.decline-random-container').find('.display-row').last().hide()
        }
        if ($('.decline-random-row').length == 3) {
            $(".add-random-message").hide();
        }
    });
    $(document).on('click', '.delete-random-textarea', function() {
        $(this).closest('div.decline-random-row').remove();
        if ($('.decline-random-row').length < 3) {
            $(".add-random-message").show();
        }
    });
    ////////////// welcome
    $(".add-random-message-welcome").on('click', function() {
        if ($('.welcome-random-row').length < 5) {
            $('.welcome-random-container').append(welcomeRandomMessageHtml);
            $('.welcome-random-container').find('.input-row').last().addClass('show')
            $('.welcome-random-container').find('.display-row').last().hide()
        }
        if ($('.welcome-random-row').length == 5) {
            $(".add-random-message-welcome").hide();
        }
    });
    $(document).on('click', '.welcome-delete-random-textarea', function() {
        $(this).closest('div.welcome-random-row').remove();
        if ($('.welcome-random-row').length < 5) {
            $(".add-random-message-welcome").show();
        }
    });
    //////////// tagging feature /////
    $(".add-random-tag-comment").on('click', function() {
        if ($('.tag-random-row').length < 5) {
            $('.tag-random-container').append(tagRandomMessageHtml);
            $('.tag-random-container').find('.input-row').last().addClass('show')
            $('.tag-random-container').find('.display-row').last().hide()
        }
        if ($('.tag-random-row').length == 5) {
            $(".add-random-tag-comment").hide();
        }
    });
    $(document).on('click', '.tag-delete-random-textarea', function() {
        $(this).closest('div.tag-random-row').remove();
        if ($('.tag-random-row').length < 5) {
            $(".add-random-tag-comment").show();
        }
    });
    /********* To show edit profile form *******/
    $(".profile_link").on('click', function() {
        $('.close-sidebar').hide();
        $('.sidenav').slideUp(500);
        $('.open-sidebar').show();

        $('.tab').hide();
        $('#Profile').show();
        getPlanDetails();
        return false;
    });
    $("#google_sheet_url").on('keyup', function() {
        chrome.storage.local.get(["user"], function(result) {
            if (result.user.google_sheet_url != $("#google_sheet_url").val()) {
                //  document.getElementById('is_verified_sheet_url').textContent = 'Verify';   
                document.getElementById('verify_sheet_url').style.display = 'block';
                document.getElementById('verified_sheet_url').style.display = 'none';
            } else {
                //  document.getElementById('is_verified_sheet_url').textContent = 'Verified';
                document.getElementById('verify_sheet_url').style.display = 'none';
                document.getElementById('verified_sheet_url').style.display = 'block';
            }
        })
    });
    /***** add group ******/
    $(".final-add-group-btn").on('click', function() {
        if ($(this).hasClass('disable-already-added-group')) {
            return false;
        } else {
            if (allGroupDataArray.length < planConfig.fb_groups || planConfig.fb_groups == null) {
                $('.final-add-group-btn').hide();
                if ($(this).hasClass('yes-group-redirecting-btn')) {
                    if (currentUnlinkGroupId == '') {
                        $('.tab').hide();
                        $('#no-groups').show();
                        lastOpenedScreen = '#no-groups';
                        $('#no-groups .add-group-section, .final-add-group-btn').show();
                    } else {
                        chrome.tabs.query({
                            active: true,
                            currentWindow: true
                        }, function(tabs) {
                            loader(true);
                            chrome.runtime.sendMessage({
                                'type': 'addGroup',
                                groupId: currentUnlinkGroupId,
                                groupName: getGroupName(tabs[0].title)
                            })
                        });
                    }
                } else {
                    chrome.tabs.query({
                        active: true,
                        currentWindow: true
                    }, function(tabs) {
                        loader(true);
                        chrome.runtime.sendMessage({
                            'type': 'addGroup',
                            groupId: currentUnlinkGroupId,
                            groupName: getGroupName(tabs[0].title)
                        })
                    });
                }
            } else if (planConfig.reseller_id == 0) {
                $('.upgrade-link').attr('href', 'https://groupleads.net/plans?hash=' + hash);
                $('.upgrade-button-section').show();
            } else {
                messageToast('error', 'You\'ve reached your plan limit. Please,contact to your reseller to add more FB groups')
            }
        }
    });
    $(document).on('click', '.group-pagination', function() {
        groupLimit += groupLimit;
        showGroupsData();
    });
    /******* delete group *********/
    $(document).on('click', '.delete-group', function() {
        // $(".tooltip.show").remove();
        groupIdToDelete = $(this).attr('group-id');
        fbGroupIdToDeleteGroup = $(this).attr('fb-group-id');
        $('#confirm_delete_group').modal('show');
    });
    $(document).on('click', '.sync-group-questions', function() {
        chrome.runtime.sendMessage({
            'type': 'syncQuestions',
            groupId: $(this).attr('group-id'),
            fbGroupId: $(this).attr('fb_group_id')
        });
    });
    $(document).on('click', '.confirm-group-delete', function() {
        $('#confirm_delete_group').modal('hide');
        // loader(true); 
        if (parseInt(groupIdToDelete) > 0) {
            $('.loader-show').show();
            $.ajax({
                type: "POST",
                url: apiBaseUrl + "delete-group",
                data: {
                    groupId: groupIdToDelete,
                    fbGroupIdToDeleteGroup: fbGroupIdToDeleteGroup
                },
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
                }
            }).done(function(response) {
                loader(false);
                if (response.status == 401) {
                    triggerLogout();
                    return false;
                }
                if (response.status == 200) {
                    messageToast('success', response.msg);
                    getUserFBGroups();
                    getUpdatedGroupConfig(true);
                }
            });
        }
    });
    $(document).on('click', '.welcome_message_popup', function() {
        groupWelcomeMessagePopup();
    })
    $(document).on('click', 'a.setup-pending', function() {
        $(this).closest('.group-setup-pending').find('a.edit-group-settings').click();
    });
    $(document).on('click', 'a.edit-group-settings', function() {
        $("#autoresponderDropDown select option:selected").prop("selected", false);
        $('#decline_message_form')[0].reset();
        var groupId = $(this).attr('group-id');
        $('.all-tags-list').attr('opened-group-id', groupId);
        var groupName = $(this).closest('.group-item').find('h6').text();
        // $('#group-settings').hide();     
        loader(true)
        $.ajax({
            type: "POST",
            url: apiBaseUrl + "group-settings",
            data: {
                groupId: groupId
            },
            dataType: 'json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            }
        }).done(function(response) {
            loader(false)
            $('.tab').hide();
            $('#groupleads-tabs').show();
            $(".auto_approve_settings_tab").attr('group-id', groupId); // for auto-Approve settings
            $("#actual-group-id").val(groupId); // for autoresponder tab
            if (response.status == 401) {
                triggerLogout();
                return false;
            }
            if (response.status == 200) {
                $('#groupNameHeader').text(groupName);
                $('.groupNameHeader').text(groupName.substring(0, 7) + '...')
                $('#google_sheet_url').val(response.data.google_sheet_url);
                $('#group_set_id').val(response.data.id)
                if (response.data.auto_decline_consent == '0') {
                    $('.nav-link.auto_approve_settings_tab').addClass('show-consent')
                } else {
                    $('.nav-link.auto_approve_settings_tab').addClass('hide-consent')
                }
                if (response.data.autoresponder_id == null) {
                    createDropDown(response.allGroupData, 0);
                    $('.credentials-form-link').attr('autoresponder-id', 0)
                } else {
                    createDropDown(response.allGroupData, response.data.autoresponder_id);
                    $('.credentials-form-link').attr('autoresponder-id', response.data.autoresponder_id)
                }
                $("#tag_status").prop("checked", (response.data.tag_status == 1) ? true : false);
                $("#welcome_message_status").prop("checked", (response.data.welcome_message_status == 1) ? true : false);
                $("#decline_message_status").prop("checked", (response.data.decline_message_status == 1) ? true : false);
                $("#autoresponder_status").prop("checked", (!response.data.autoresponder_status == 1) ? true : false);
                $("#auto_decline_message_status").prop("checked", (response.data.enable_auto_decline == 1) ? true : false);
                $('#message_only_status').prop("checked", (response.data.message_only_status == 1) ? true : false);
                $('#message_only_one').val(response.data.message_only_one)
                $("#chatsilo_tag_status").prop("checked", (response.data.chatsilo_tag_status == 1) ? true : false);
                $('.view_data_link').attr('href', response.data.google_sheet_url);
            }
            $('#group-set-id').val(response.data.id);
            $('#actual-group-id').val(response.data.group_id);
            //////chatsilo tag settings///////////////////
            if (response.data.chatsilo_tag_ids != 0) {
                var chatsilo_tag_ids = [response.data.chatsilo_tag_ids];
                if (response.data.chatsilo_tag_ids.indexOf(',') > -1) {
                    chatsilo_tag_ids = response.data.chatsilo_tag_ids.split(',');
                }
                $('.multi-tag-checkbox').prop('checked', false);
                chatsilo_tag_ids.forEach(function(tagId) {
                    if ($('.all-tags-list .one-tag-li').length > 0) {
                        $('.all-tags-list .one-tag-li[tag-id="' + tagId + '"]').find('.multi-tag-checkbox').addClass('tech44444444')
                        $('.all-tags-list .one-tag-li[tag-id="' + tagId + '"]').find('.multi-tag-checkbox').prop('checked', true);
                    }
                })
            } else {
                $('.multi-tag-checkbox').prop('checked', false);
            }
            //********** decline timing settings **********//
            $('#decline_interval').val(response.data.decline_interval);
            $('#decline_limit').val(response.data.decline_limit);
            $('#decline_start').val(response.data.decline_start_time);
            $('#welcome_interval').val(response.data.welcome_interval);
            $('#welcome_limit').val(response.data.welcome_limit);
            $('#welcome_start').val(response.data.welcome_start_time);
            $('.decline-random-row-dynamic').remove();
            $('.welcome-random-row-dynamic').remove();
            if (response.data.decline_message != null && response.data.decline_message.length > 0) {
                $('#declinemessage').val(response.data.decline_message);
                $('.declinemessage').text(response.data.decline_message);
            }
            $('.tag-random-row-dynamic').remove();
            if (parseInt(response.data.decline_random_status) == 1) {
                $('#decline_random_status').prop("checked", true);
                if (response.data.decline_message_two != null && response.data.decline_message_two != '') {
                    $('.decline-random-container').append(declineRandomMessageHtml);
                    $('.decline-random-container textarea').eq(1).val(response.data.decline_message_two);
                    $('.decline-random-container .display-m-text').eq(1).text(response.data.decline_message_two);
                }
                if (response.data.decline_message_three != null && response.data.decline_message_three != '') {
                    $('.decline-random-container').append(declineRandomMessageHtml);
                    $('.decline-random-container textarea').eq(2).val(response.data.decline_message_three);
                    $('.decline-random-container .display-m-text').eq(2).text(response.data.decline_message_three);
                }
            } else {
                $('#decline_random_status').prop("checked", false);
                $('.add-random-message').hide();
            }
            /////////// welcome message section /////////////
            if (response.data.welcome_message_one != null) {
                $('#welcomemessageone').val(response.data.welcome_message_one);
                $('.welcomemessageone').text(response.data.welcome_message_one);
            }
            if (response.data.welcome_message_one == '') {
                $('#welcomemessageone').val(selected_lang_locale.welcome_message_page.welcome_message_template);
            }
            if (parseInt(response.data.welcome_random_status) == 1) {
                $('#welcome_random_status').prop("checked", true);
                if (response.data.welcome_message_two != null && response.data.welcome_message_two != '') {
                    $('.welcome-random-container').append(welcomeRandomMessageHtml);
                    $('.welcome-random-container textarea').eq(1).val(response.data.welcome_message_two);
                    $('.welcome-random-container .display-m-text').eq(1).text(response.data.welcome_message_two);
                }
                if (response.data.welcome_message_three != null && response.data.welcome_message_three != '') {
                    $('.welcome-random-container').append(welcomeRandomMessageHtml);
                    $('.welcome-random-container textarea').eq(2).val(response.data.welcome_message_three);
                    $('.welcome-random-container .display-m-text').eq(2).text(response.data.welcome_message_three);
                }
                if (response.data.welcome_message_four != null && response.data.welcome_message_four != '') {
                    $('.welcome-random-container').append(welcomeRandomMessageHtml);
                    $('.welcome-random-container textarea').eq(3).val(response.data.welcome_message_four);
                    $('.welcome-random-container .display-m-text').eq(3).text(response.data.welcome_message_four);
                }
                if (response.data.welcome_message_five != null && response.data.welcome_message_five != '') {
                    $('.welcome-random-container').append(welcomeRandomMessageHtml);
                    $('.welcome-random-container textarea').eq(4).val(response.data.welcome_message_five);
                    $('.welcome-random-container .display-m-text').eq(4).text(response.data.welcome_message_five);
                    $('#welcome_message_form  .add-random-message-welcome').hide();
                }
            } else {
                $('#welcome_random_status').prop("checked", false);
                $('.add-random-message-welcome').hide();
            }
            /////////taging///////////
            $('#post-url').val(response.data.welcome_post_id);
            $("#tag_in_single_comment").prop("checked", (response.data.tag_all == 1) ? true : false);
            // $("#tag_with_text_comment").prop( "checked", (response.data.with_text ==1) ? true : false);
            if (parseInt(response.data.with_text) == 1) {
                $('#tag_with_text_comment').prop("checked", true);
                $('#tag_random_status').prop("disabled", true);
                $('.add-random-tag-comment').hide();
            } else {
                $('#tag_with_text_comment').prop("checked", false);
                $('#tag_random_status').prop("disabled", false);
                $('.add-random-tag-comment').show();
            }
            if (response.data.tag_message_one != null && response.data.tag_message_one != '') {
                $('#tag_message_one').val(response.data.tag_message_one);
                $('.tag_message_one').text(response.data.tag_message_one);
            }
            if (response.data.tag_message_one == '') {
                $('#tag_message_one').val(selected_lang_locale.tag_page.welcome_comment);
                $('.tag_message_one').text(selected_lang_locale.tag_page.welcome_comment);
            }
            if (parseInt(response.data.tag_random_status) == 1) {
                $('#tag_random_status').prop("checked", true);
                if (response.data.tag_message_two != null && response.data.tag_message_two != '') {
                    $('.tag-random-container').append(tagRandomMessageHtml);
                    $('.tag-random-container textarea').eq(1).val(response.data.tag_message_two);
                    $('.tag-random-container .display-m-text').eq(1).text(response.data.tag_message_two);
                }
                if (response.data.tag_message_three != null && response.data.tag_message_three != '') {
                    $('.tag-random-container').append(tagRandomMessageHtml);
                    $('.tag-random-container textarea').eq(2).val(response.data.tag_message_three);
                    $('.tag-random-container .display-m-text').eq(2).text(response.data.tag_message_three);
                }
                if (response.data.tag_message_four != null && response.data.tag_message_four != '') {
                    $('.tag-random-container').append(tagRandomMessageHtml);
                    $('.tag-random-container textarea').eq(3).val(response.data.tag_message_four);
                    $('.tag-random-container .display-m-text').eq(3).text(response.data.tag_message_four);
                }
                if (response.data.tag_message_five != null && response.data.tag_message_five != '') {
                    $('.tag-random-container').append(tagRandomMessageHtml);
                    $('.tag-random-container textarea').eq(4).val(response.data.tag_message_five);
                    $('.tag-random-container .display-m-text').eq(4).text(response.data.tag_message_five);
                }
            } else {
                $('#tag_random_status').prop("checked", false);
                $('.add-random-tag-comment').hide();
            }
            //////////taging end//////////
            /////decline keywords////////
            if (response.data.auto_decline_keywords != null && response.data.auto_decline_keywords != '') {
                declinekeywords = JSON.parse(response.data.auto_decline_keywords);
                if (declinekeywords != null) {
                    declinekeywords.forEach(function(item) {
                        $('#decline-keywords').tagsinput('add', item);
                    });
                }
            }
            if (parseInt(response.data.with_text) == 1) {
                $('#tag_with_text_comment').prop("checked", true);
                $('#tag_random_status').prop("disabled", true);
                $('.add-random-tag-comment').hide();
            } else {
                $('#tag_with_text_comment').prop("checked", false);
                $('#tag_random_status').prop("disabled", false);
                $('.add-random-tag-comment').show();
            }
            /////decline countries////////
            if (response.data.auto_decline_countries != null && response.data.auto_decline_countries != '') {
                declineCountries = JSON.parse(response.data.auto_decline_countries);
                if (declineCountries != null) {
                    declineCountries.forEach(function(item) {
                        $('#decline-countries').tagsinput('add', item);
                    });
                }
            }
            $('#auto_decline_interval').val(response.data.auto_decline_interval);
            if (response.data.google_sheet_url !== '') {
                verifyGoogleSheet();
            } else {
                document.getElementById('verify_sheet_url').textContent = selected_lang_locale.settings_per_group.google_sheet_url.verify_sheet
            }
        });
    });
    /******* no-confirm-auto-decline ********/
    $(document).on('click', '.no-confirm-auto-decline', function() {
        $('.nav-link.google_sheet_setup').click();
    })
    /******* confirm-auto-decline ********/
    $(document).on('click', '.confirm-auto-decline', function() {
        var groupId = $('#actual-group-id').val();
        $('#confirm_auto_decline').modal('hide');
        $('.auto_approve_settings_tab').removeClass('show-consent')
        $.ajax({
            type: "POST",
            url: apiBaseUrl + "update-auto-decline-consent",
            data: 'groupId=' + groupId,
            dataType: 'json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
                xhr.setRequestHeader('userlanguage', userLang);
            }
        }).done(function(response) {
            if (response.status == 401) {
                triggerLogout();
                return false;
            }
            console.log(response);
        });
    });
    $(document).on('click', 'a.auto_approve_settings_tab', function() {
        $('.confirm-auto-decline').attr('data-group-id', $(this).attr('group-id'));
        $('#interval-error').hide();
        if ($(this).hasClass('show-consent')) {
            $('#confirm_auto_decline').modal('show');
            // $(this).removeClass('show-consent')
        }
        var groupId = $(this).attr('group-id');
        //loader(true)
        $.ajax({
            type: "POST",
            url: apiBaseUrl + "auto-approve-settings",
            data: {
                groupId: groupId
            },
            dataType: 'json',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            }
        }).done(function(response) {
            if (response.status == 401) {
                triggerLogout();
                return false;
            }
            // loader(false); 
            //$('#confirm_auto_decline').modal('hide');
            if (response.status == 200) {
                if (response.data == null) {
                    $('#auto_approve_form')[0].reset();
                    $('#isNew').val(1);
                    $('#auto_approve_status').prop("checked", false);
                    $('#whenjoined').val('all');
                } else {
                    $('#isNew').val(0);
                    $('#auto_approve_status').prop("checked", (response.data.auto_approve == 1) ? true : false);
                    $('#all_answered').prop("checked", (response.data.all_answered == 1) ? true : false);
                    $('#is_email').prop("checked", (response.data.is_email == 1) ? true : false);
                    $('#rule_filter').prop("checked", (response.data.rule_filter == 1) ? true : false);
                    $('#interval').val(response.data.interval_min);
                    $('#whenjoined').val(response.data.when_joined);
                    $('#gender_filter').val(response.data.gender_filter);
                    $('#friends_in_group').val(response.data.friends_in_group);
                    $('#lives_in').val(response.data.lives_in);
                    $('#mutual_friends_with_me').val(response.data.mutual_friends);
                    $('#common_groups').val(response.data.common_groups);
                }
            }
        });
        $('#linkGroupId').val(groupId);
    });
    $(document).on('change', '#languagesSelect', function(e) {
        lang = this.value;
        userLang = lang;
        selectedLanuage = lang_data['' + lang + ''];
        chrome.cookies.set({
            url: baseUrl,
            name: "groupleads_language",
            value: lang,
            expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
        });
        chrome.storage.local.set({
            'selectedLanuage': selectedLanuage
        });
        replaceTextByLang();
        setTimeout(() => {
            showGroupsData();
        }, 200)
    });
    $(document).on('change', '#autoresponderDropDown', function(e) {
        autoresponder_type = $("option:selected", this).attr('autoresponder_type');
        autoresponder_id = this.value;
        $('a.credentials-form-link').attr('autoresponder_type', autoresponder_type);
        $('a.credentials-form-link').attr('autoresponder-id', autoresponder_id);
        if (autoresponder_id !== '') {
            $('#autoresponder .set-autoresponder').prop('disabled', false)
        } else {
            $('#autoresponder .set-autoresponder').prop('disabled', true)
        }
        if (showFillCredentialMessage) {
            messageToast('error', 'Set up your autoresponder credentials.')
        }
    });
    $(document).on('change', '#hotProspectorGroups', function(e) {
        hotProspectorGroupsId = this.value;
        $('#url').val(hotProspectorGroupsId);
    });
    $(document).on('change', '#dripTags', function(e) {
        dripTags = this.value;
        $('#url').val(dripTags);
    });
    /********* To show Autoresponder Credentials form *******/
    $(document).on('click', 'a.credentials-form-link', function() {
        if ($('#autoresponderDropDown').find(":selected").val() != '') {
            $('.screen-per-group').hide();
            // $('#credentials-of-autoresponder').show();
            $('#constant_contact_setup_modal').modal('show');
            $("#credentials_form")[0].reset();
            $('label').removeClass('text-black');
            $("label.error").remove();
            var validator = $("#credentials_form").validate();
            validator.resetForm();
            btnLabel = "Update"; // selected_lang_locale.credential_autoresponder_page.update_button_lable
            $("#credentials_form button[type='submit']").attr('disabled', false).text(btnLabel);
            var groupId = $('#actual-group-id').val();
            var autoresponderId = $('#autoresponderDropDown').find(":selected").attr('autoresponder-id');
            var autoresponderType = $('#autoresponderDropDown').find(":selected").attr('autoresponder_type');
            loader(true)
            $.ajax({
                type: "POST",
                url: apiBaseUrl + "get-autoresponder-credentails",
                data: {
                    userId: userId,
                    autoresponderId: autoresponderId,
                    groupId: groupId
                },
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
                }
            }).done(function(response) {
                //console.log(response);
                loader(false)
                if (response.status == 401) {
                    triggerLogout();
                    return false;
                }
                $('#credentials-form-box').show();
                $('#aweber-tag-name').remove()
                $('#hotProspectorGroups').parent().remove();
                $('#hotProspectorGroups').remove();
                $("#kartra_div").remove();
                $("#mautic_div").remove();
                $('#dripTags').remove();
                $('#active-campaign-group').hide();
                $('#keap-tag-group').hide();
                $('#url').val('');
                $('#app_path').val('');
                $('#api_url').val('');
                $('#credentials_form').attr('autoresponder_type', autoresponderType);
                // console.log(response.autoresponder.notice)
                // return false;
                if (response.autoresponder.notice == null || response.autoresponder.notice == '') {
                    $(".ar-notice").parent().hide();
                } else {
                    $(".ar-notice").html(response.autoresponder.notice).parent().show();
                }
                $(".ar-notice").html(response.autoresponder.notice);
                $("#autoresponder_title").text(response.autoresponder.responder_type);
                $('#ar_field_three label').show();
                $('#active-campaign-group').hide();
                $('#url').show();
                $("#autoresponder-name").text(response.autoresponder.responder_type);
                $("#credentials_form #list-title").text(response.autoresponder.list_title);
                fieldOneValidations = JSON.parse(response.autoresponder.field_one_validation);
                fieldTwoValidations = JSON.parse(response.autoresponder.field_two_validation);
                fieldThreeValidations = JSON.parse(response.autoresponder.field_three_validation);
                if (response.autoresponder.field_one_validation != null) {
                    setTypeAndValidation('#ar_field_one', fieldOneValidations, response.autoresponder.responder_key, 1);
                } else {
                    $('#ar_field_one').hide();
                }
                if (response.autoresponder.field_two_validation != null) {
                    setTypeAndValidation('#ar_field_two', fieldTwoValidations, response.autoresponder.responder_key, 2);
                } else {
                    $('#ar_field_two').hide();
                }
                if (response.autoresponder.field_three_validation != null) {
                    setTypeAndValidation('#ar_field_three', fieldThreeValidations, response.autoresponder.responder_key, 3);
                } else {
                    $('#ar_field_three').hide();
                }
                if (response.autoresponder.responder_key == "hotprospector") {
                    if (response.data == undefined) {
                        $('#ar_field_three label').hide();
                    }
                    $('#url').hide();
                } else if (response.autoresponder.responder_key == "drip") {
                    if (response.data == undefined) {
                        $('#ar_field_three label').hide();
                    }
                    $('#url').hide();
                } else if (response.autoresponder.responder_key == "mautic") {
                    mautic_label = selected_lang_locale.credential_autoresponder_page.mautic_label;
                    var appIdHtml = `<div id="mautic_div" class="form-group col-12 p-0">
                            <label for="APP Id" class="lbl">` + mautic_label + `</label>
                            <input type="text" name="field_four" id="mautic_camp_id" class="form-control">
                        </div>`;
                    $('#ar_field_three').after(appIdHtml);
                    $('#mautic_camp_id').rules('add', {
                        required: true,
                        messages: {
                            required: selected_lang_locale.credential_form.fields.required
                        }
                    });
                }
                if (response.autoresponder.oauth == 1) {
                    // if(response.data.field_two_value != "" || response.data.field_two_value != "" || response.data.field_three_value != ""){
                    if (response.data != undefined) {
                        $(".connect_app").remove();
                        $("#connect_app").remove();
                        $("#credentials_form button[type=submit]").show();
                        $("#credentials_form button[type=submit]").after("<button type='button' class='btn btn-primary btn-block update update_button_lable connect_app' id='connect_app'>Change Account</button>");
                        $("button.update_button_lable").addClass('split_button');
                    } else {
                        $("#connect_app").remove();
                        $("#credentials_form button[type=submit]").after("<button type='button' class='btn btn-primary btn-block update update_button_lable' id='connect_app'>Connect App</button>");
                        $("#credentials_form button[type=submit]").hide();
                    }
                } else {
                    $("button.update_button_lable").removeClass('split_button');
                    $("#credentials_form button[type=submit]").show();
                    $("#connect_app").hide();
                }
                console.log(response.autoresponder.get_all_fields)
                if (response.autoresponder.get_all_fields == 1) {
                    $('.ques_ans_status').show();
                    $('#ar_name').text(response.autoresponder.responder_type);
                } else {
                    $('.ques_ans_status').hide();
                }
                if (response.status == 404) {
                    $('#save-ans').prop("disabled", true);
                }
                if (response.status == 200) {
                    $('#save-ans').prop("disabled", false);
                    $('#save-ans').prop("checked", (response.data.save_answers == 1) ? true : false);
                    if (response.autoresponder.responder_key == "aweber") {
                        var aweberTagNameHtml = `<div id="aweber-tag-name" class="form-group col-12">
                                <label for="list" class="">Tag Name</label>
                                <input type="text" name="field_four" id="field_four" class="form-control" placeholder="Enter Tag Name" aria-invalid="false">
                              </div>`;
                        $('#ar_field_three').after(aweberTagNameHtml);
                    }
                    $('#autoresponder_id').val(response.data.id);
                    $('#app_path').val(response.data.field_three_value);
                    $('#key').val(response.data.field_two_value);
                    $('#url').val(response.data.field_one_value);
                    $('#autoresponder_type').val(autoresponderType);
                    $('#credentials_form').attr('autoresponder_type', autoresponderType);
                    $('#group-id-credentails').val(groupId);
                    $('#new_autoresponder').val(0);
                    var tempDbARCredentials = {};
                    tempDbARCredentials.group_id = groupId;
                    tempDbARCredentials.autoType = autoresponderType;
                    tempDbARCredentials.key = response.data.field_two_value;
                    tempDbARCredentials.url = response.data.field_one_value;
                    tempDbARCredentials.app_path = response.data.field_three_value;
                    chrome.storage.local.set({
                        'tempDbARCredentials': tempDbARCredentials
                    });
                    /*--------------------------------------------keap----------------------------------------*/
                    if (response.autoresponder.responder_key == "keap" && response.data.field_two_value != null && response.data.field_two_value != '') {
                        keapARId = response.data.id;
                        activekeapCompanyId = response.data.field_one_value;
                        activekeapApiToken = response.data.field_two_value;
                        if (activekeapApiToken != "") {
                            getkeapAceessToken(activekeapCompanyId, activekeapApiToken, keapARId);
                        }
                        $(document).on('click', '#searchKeapTagFindBtn', function() {
                            showKeapTags();
                        })
                        $('#keap-tag-group').html(keapDefaultHtml);
                        if ($.isArray(JSON.parse(response.data.tagid))) {
                            multTagObject = JSON.parse(response.data.tagid);
                            var btDelay = 0;
                            $('#keap-tags').tagsinput('add', '');
                            multTagObject.forEach((element) => {
                                $('#keap-tags').tagsinput('add', element.tagname);
                                $('#keap-tags option[value="' + element.tagname + '"]').attr('tagid', element.tagid);
                            })
                        } else if (response.data.tagid > 0) {
                            $('#keap-tags').tagsinput('add', response.data.tag_name);
                            $('#keap-tags option[value="' + response.data.tag_name + '"]').attr('tagid', response.data.tagid);
                        }
                        $('#keap-tag-group').show();
                    }
                    /*---------------------------------------------------end keap------------------------------*/
                    if (response.autoresponder.responder_key == "activecampaign") {
                        activeCampaignApiUrl = response.data.field_three_value;
                        activeCampaignApiToken = response.data.field_two_value;
                        // getActiveCampaignTags(activeCampaignApiUrl,activeCampaignApiToken);
                        $(document).on('click', '#searchActiveTagFindBtn', function() {
                            getActiveCampaignTags(activeCampaignApiUrl, activeCampaignApiToken);
                        })
                        $('#active-campaign-group').html(activecampaignDefaultHtml);
                        if ($.isArray(JSON.parse(response.data.tagid))) {
                            multTagObject = JSON.parse(response.data.tagid);
                            var btDelay = 0;
                            $('#active-cmpaign-tags').tagsinput('add', '');
                            multTagObject.forEach((element) => {
                                $('#active-cmpaign-tags').tagsinput('add', element.tagname);
                                $('#active-cmpaign-tags option[value="' + element.tagname + '"]').attr('tagid', element.tagid);
                            })
                        } else if (response.data.tagid > 0) {
                            $('#active-cmpaign-tags').tagsinput('add', response.data.tag_name);
                            $('#active-cmpaign-tags option[value="' + response.data.tag_name + '"]').attr('tagid', response.data.tagid);
                        }
                        $('#active-campaign-group').show();
                    } else if (response.autoresponder.responder_key == "hotprospector" && response.hotProspectorGroups != undefined && response.hotProspectorGroups.length > 0) {
                        $('#hotProspectorGroups').parent().remove();
                        $('#hotProspectorGroups').remove();
                        var option = '<div class="groupleads-select select_options"><select id="hotProspectorGroups" class="form-control" name="hotProspectorGroups"> '
                        response.hotProspectorGroups.forEach(function(item, index) {
                            if (response.data.field_one_value == item.hodProsGroupId) {
                                option += '<option selected value="' + item.hodProsGroupId + '">' + item.hodProsGroupTitle + '</option>';
                            } else {
                                option += '<option value="' + item.hodProsGroupId + '">' + item.hodProsGroupTitle + '</option>';
                            }
                        });
                        option += '</select></div>';
                        $('#ar_field_three label').show();
                        $('#url').hide();
                        $('#url').after(option);
                        $('#active-campaign-group').hide();
                    } else if (response.autoresponder.responder_key == "drip" && response.dripTags != undefined && response.dripTags.length > 0) {
                        $('#dripTags').remove();
                        var option = '<select id="dripTags" class="form-control" name="dripTags"> '
                        response.dripTags.forEach(function(item, index) {
                            if (response.data.field_one_value == item) {
                                option += '<option selected value="' + item + '">' + item + '</option>';
                            } else {
                                option += '<option value="' + item + '">' + item + '</option>';
                            }
                        });
                        option += '</select>';
                        $('#ar_field_three label').show();
                        $('#url').hide();
                        $('#url').after(option);
                    } else if (response.autoresponder.responder_key == "getgist") {
                        $('#url').show();
                    } else if (response.autoresponder.responder_key == "mautic") {
                        $('#mautic_camp_id').val(response.data.field_four);
                    } else if (response.autoresponder.responder_key == "aweber") {
                        $('#field_four').val(response.data.field_four);
                    } else {
                        $('#tagid').val(0);
                        $('#tagname').val('');
                        $('#active-campaign-group').hide();
                    }
                } else {
                    $("#credentials_form")[0].reset();
                    $('#autoresponder_id').val(autoresponderId);
                    $('#new_autoresponder').val(1);
                    $('#autoresponder_type').val(autoresponderType);
                    $('#group-id-credentails').val(groupId);
                }
                fillTempAutoCredentials();
            });
        } else {
            messageToast('error', "Please select an Autoresponder")
        }
    });
    //     /********* To show Decline Credentials form *******/
    //     $(document).on('click','a.custom-message-link', function() {
    //         $('.screen-per-group').hide();
    //         $('#decline-message-form-box').show();
    //     });
    //        /********* To show Welcome Credentials form *******/
    //     $(document).on('click','a.custom-message-welcome-link', function() {
    //         $('.screen-per-group').hide();
    //         $('#welcome-message-form-box').show();
    //     });
    $("#save-ans").on('change', function() {
        status = 0;
        if (this.checked) { //insert 1
            status = 1;
        }
        temp = {};
        temp.save_ans = status;
        temp.userId = userId;
        temp.autoresponderId = $('#autoresponder_id').val();
        saveAnswersSetting(temp);
    });
    var requests = [];
    $(document).on('keyup', '#searchActiveTag', function() {
        // var search = $(this).val();
        // //console.log(search);
        // if(search != '')
        // {
        //     $('.tag-results').hide();
        //     $('.tag-results').each(function(tag) {
        //         //console.log($(this).attr('tagname'));
        //         if($(this).attr('tagname').toLowerCase().indexOf(search.toLowerCase()) > -1){
        //             //console.log('if');
        //            $('.displayTagUl').show();
        //             $(this).show();
        //         }
        //     })
        // }
        // else
        // {
        $('.displayTagUl').hide();
        $('.tag-results').hide();
        // }
    });
    // var activeCampaignTagIds = []; 
    $(document).on('click', '.tag-results', function() { ///////111111111
        // $('#tagid').val($(this).attr('tagid'));
        // $('#tagname').val($(this).attr('tagname')); 
        /*$('#dispaytagresults').hide();*/
        $('.tag-results').hide();
        $('.displayTagUl').hide();
        var tempOneTagId = $(this).attr('tagid');
        var tempOneTagName = $.trim($(this).attr('tagname'));
        $('#active-cmpaign-tags').tagsinput('add', $(this).attr('tagname'));
        $('#active-cmpaign-tags option[value="' + tempOneTagName + '"]').attr('tagid', tempOneTagId);
        $('#searchActiveTag').val('');
    });
    /*-------keap tag-result click---------------------*/
    $(document).on('keyup', '#searchKeapTag', function() {
        $('.displayKeapTagUl').hide();
        $('.keap-tag-results').hide();
    });
    $(document).on('click', '.keap-tag-results', function() {
        $('.keap-tag-results').hide();
        $('.displayKeapTagUl').hide();
        var tempOneKeapTagId = $(this).attr('tagid');
        var tempOneKeapTagName = $.trim($(this).attr('tagname'));
        $('#keap-tags').tagsinput('add', tempOneKeapTagName);
        $('#keap-tags option[value="' + tempOneKeapTagName + '"]').attr('tagid', tempOneKeapTagId);
        $('#searchKeapTag').val('');
    });
    /*--------end keap tag -result click------------------------------*/
    //     $(document).on('click', 'a.view-google-sheet', function() {
    //        if ($(this).attr('href') == '#') {
    //         return false;
    //        }
    //     });
    //     /********* Logout from extension *******/
    //     $("#logout-link").on('click', function() {
    //         $('#Modal-logout').modal('show');
    //     });
    $(".logout-btn").on('click', function() {
        triggerLogout();
    });
    jQuery.validator.addMethod("multiemails", function(value, element) {
        if (this.optional(element)) // return true on optional element 
            return true;
        var emails = value.split(/[;,]+/); // split element by , and ;
        valid = true;
        for (var i in emails) {
            value = emails[i];
            valid = valid && jQuery.validator.methods.email.call(this, $.trim(value), element);
        }
        return valid;
    }, jQuery.validator.messages.email);
    //     /********* Validate login form *******/
    //     $("#loginform").validate({
    //         rules: {
    //             license_key: {
    //                 required: true
    //             }
    //         },
    //         messages: {
    //             license_key: {
    //                 required: "License key can not be empty"
    //             }
    //         },
    //         submitHandler: function() {
    //             $("#loginform button[type='submit']").attr('disabled',true).text('Processing');
    //             login();
    //             return false;
    //         }
    //     });
    /********* Validate Sign-up form *******/
    $("#credentials_form").validate({
        submitHandler: function(form, event) {
            event.preventDefault();
            if (oAuth2Redirect) {
                oAuth2Redirect = false;
                RedirectOAuth2();
            } else {
                updateAutoresponder();
            }
            return false;
        }
    });
    /********* Validate decline message form *******/
    $("#decline_message_form").validate({
        submitHandler: function(form, event) {
            event.preventDefault();
            updateDeclineMessage();
            return false;
        }
    });
    $("#welcome_message_form").validate({
        rules: {
            welcomemessageone: {
                required: true
            }
        },
        submitHandler: function(form, event) {
            event.preventDefault();
            updateWelcomeMessage();
            return false;
        }
    });
    $("#save-message-only-form").on('click', function() {
        updateMessageOnly();
    });
    $("#save-tag-form").on('click', function() {
        if ($('#post-url').val() != '') {
            validateWelcomePostUrl($('#post-url').val());
        } else {
            messageToast('error', 'Invalid Post url');
        }
        return false;
    });
    /********* Validate auto_approve_form *******/
    $("#auto_approve_form").validate({
        submitHandler: function(form, event) {
            event.preventDefault();
            btnl = "SAVING..."; //selected_lang_locale.auto_approve_page_settings.valid_member_section.update_button_lable_processing
            if ($('#interval').val() == '') {
                $('#interval-error').show();
                return false;
            } else if (parseInt($('#interval').val()) < 5) {
                $('#interval-error').show();
                return false;
            } else {
                $('#interval-error').hide();
                $("#auto_approve_form button[type='submit']").attr('disabled', true).text(btnl);
                saveAutoApproveSettings();
            }
        }
    });
    $("#save-decline-keywords").on('click', function() {
        updateAutoDeclineKeywords();
    });
    $("#save-chatsilo-tags").on('click', function() {
        updateTagsInGroupleads();
    });
});


setInterval(()=>{
    chrome.runtime.sendMessage({"type":"backgroundActive","from":"popup"});
})

function updateTagsInGroupleads() {
    $checkedTags = [];
    $('.all-tags-list .one-tag-li').each(function(index) {
        if ($(this).find('.multi-tag-checkbox').is(':checked')) {
            $checkedTags.push($(this).attr('tag-id'));
        }
    });
    var openedGroupId = $('.all-tags-list').attr('opened-group-id');
    if ($checkedTags.length == 0) {
        $checkedTags = 0;
    }
    $('#save-chatsilo-tags').attr('disabled', true).text('Saving..');
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "save-chatislo-tags-settings",
        data: {
            groupId: openedGroupId,
            tagIds: $checkedTags
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        getUpdatedGroupConfig();
        $('#save-chatsilo-tags').attr('disabled', false).text('Save');
        messageToast('success', response.msg)
    });
}

function setTypeAndValidation(elementId, v, arType, labelIndex) {
    $(elementId + ' input').attr('type', v.type);
    $(elementId + ' input').rules('remove', 'url');
    if (v.required && v.type == "url") {
        $(elementId + ' input').rules('add', {
            required: true,
            url: true,
            messages: {
                required: selected_lang_locale.credential_form.fields.required,
                url: selected_lang_locale.credential_form.fields.url
            }
        });
    } else if (v.required) {
        $(elementId + ' input').rules('add', {
            required: true,
            messages: {
                required: selected_lang_locale.credential_form.fields.required
            }
        });
    } else if (v.type == "url") {
        $(elementId + ' input').rules('add', {
            url: true,
            messages: {
                url: selected_lang_locale.credential_form.fields.url
            }
        });
    }
    if (v.show) {
        $(elementId).show();
    } else {
        $(elementId).hide();
    }
    labelIs = selected_lang_locale.ar_labels[arType][labelIndex];
    // $(elementId+' label').text(v[userLang].label);
    $(elementId + ' label').text(labelIs);
    labelIs = labelIs.replace('*', '');
    $(elementId + ' input').attr('placeholder', "Enter " + labelIs);
    if (!v.required) {
        $(elementId + ' label').addClass('text-black');
    }
    return true;
}

function saveAutoApproveSettings() {
    // $('.loader-show').show();
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "save-auto-approve-settings",
        data: $("#auto_approve_form").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        $('.loader-show').hide();
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        btnl = "UPDATE"; //selected_lang_locale.auto_approve_page_settings.valid_member_section.update_button_lable;
        $("#auto_approve_form button[type='submit']").text(btnl).removeAttr('disabled');
        if (response.status == 200) {
            chrome.runtime.sendMessage({
                'auto_approve_settings_updated': true
            });
            if (response.id != null) {
                $('#isNew').val(0);
            }
            setTimeout(() => {
                // message_animation('alert-success');
                // $('.msg').text(response.msg);
                messageToast('success', response.msg)
            }, 200);
        }
    });
}

function isUrlValid(url) {
    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
}

function updateTagMessage() {
    if (!validPostUrl) {
        return false;
    }
    var groupId = $('#actual-group-id').val();
    $('.loader-show').show();
    var tag_message_string = '';
    $('.tag-random-container textarea').each(function(index) {
        if (index == 0) {
            tag_message_string += '&tag_message_one=' + encodeURIComponent($(this).val());
        } else if (index == 1) {
            tag_message_string += '&tag_message_two=' + encodeURIComponent($(this).val());
        } else if (index == 2) {
            tag_message_string += '&tag_message_three=' + encodeURIComponent($(this).val());
        } else if (index == 3) {
            tag_message_string += '&tag_message_four=' + encodeURIComponent($(this).val());
        } else if (index == 4) {
            tag_message_string += '&tag_message_five=' + encodeURIComponent($(this).val());
        }
    });
    //tag_message_string += '&userId='+userId
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-tag-message",
        data: $('#comment-taging-form').serialize() + '&groupId=' + groupId + tag_message_string,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        $('.loader-show').hide();
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            messageToast('success', response.msg)
        } else {
            messageToast('error', response.msg)
        }
        getUpdatedGroupConfig();
    });
}

function updateMessageOnly() {
    var groupId = $('#actual-group-id').val();
    loader(true)
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-message-only",
        data: $('#message-only-form').serialize() + '&groupId=' + groupId,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        loader(false)
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            messageToast('success', response.msg)
        } else {
            messageToast('error', response.msg)
        }
        getUpdatedGroupConfig();
    });
}

function updateWelcomeMessage() {
    var groupId = $('#actual-group-id').val();
    if ($('#welcome_interval').val() == '') {
        $('#welcome_interval').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#welcome_interval').removeClass('boarder-red-inputs');
    }
    if ($('#welcome_limit').val() == '') {
        $('#welcome_limit').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#welcome_limit').removeClass('boarder-red-inputs');
    }
    if ($('#welcome_start').val() == '') {
        $('#welcome_start').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#welcome_start').removeClass('boarder-red-inputs');
    }
    var decline_message_string = '';
    $('.welcome-random-container textarea').each(function(index) {
        if (index == 0) {
            decline_message_string += '&welcome_message_one=' + encodeURIComponent($(this).val());
        } else if (index == 1) {
            decline_message_string += '&welcome_message_two=' + encodeURIComponent($(this).val());
        } else if (index == 2) {
            decline_message_string += '&welcome_message_three=' + encodeURIComponent($(this).val());
        } else if (index == 3) {
            decline_message_string += '&welcome_message_four=' + encodeURIComponent($(this).val());
        } else if (index == 4) {
            decline_message_string += '&welcome_message_five=' + encodeURIComponent($(this).val());
        }
    })
    console.log(decline_message_string)
    loader(true)
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-welcome-message",
        data: $('#welcome_message_form').serialize() + '&groupId=' + groupId + decline_message_string,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        loader(false)
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            messageToast('success', response.msg)
        } else {
            messageToast('error', response.msg)
        }
        getUpdatedGroupConfig();
    });
}

function updateDeclineMessage() {
    var groupId = $('#actual-group-id').val();
    if ($('#decline_interval').val() == '') {
        $('#decline_interval').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#decline_interval').removeClass('boarder-red-inputs');
    }
    if ($('#decline_limit').val() == '') {
        $('#decline_limit').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#decline_limit').removeClass('boarder-red-inputs');
    }
    if ($('#decline_start').val() == '') {
        $('#decline_start').addClass('boarder-red-inputs');
        return false;
    } else {
        $('#decline_start').removeClass('boarder-red-inputs');
    }
    var decline_message_string = '';
    $('.decline-random-container textarea').each(function(index) {
        if (index == 0) {
            decline_message_string += '&decline_message_one=' + encodeURIComponent($(this).val());
        } else if (index == 1) {
            decline_message_string += '&decline_message_two=' + encodeURIComponent($(this).val());
        } else if (index == 2) {
            decline_message_string += '&decline_message_three=' + encodeURIComponent($(this).val());
        }
    })
    loader(true)
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-decline-message",
        data: $('#decline_message_form').serialize() + '&groupId=' + groupId + decline_message_string,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        loader(false)
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        const el = new SimpleBar(document.getElementById('decline_message_form'), {
            scrollX: 0
        });
        if (response.status == 200) {
            messageToast('success', response.msg)
        } else {
            messageToast('error', response.msg)
        }
        getUpdatedGroupConfig();
    });
}

function saveAnswersSetting($postData) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "save-answers-setting",
        data: $postData,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        // const elss = new SimpleBar(document.getElementById('linked-group-setting-form'),{scrollX:0});
        setTimeout(() => {
            if (response.status == 200) {
                messageToast('success', response.msg);
            } else {
                messageToast('error', response.msg);
            }
        }, 200);
    });
}

function updateSettingsPerGroup($postData) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-settings-per-group",
        data: $postData,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        console.log(response);
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        // const elss = new SimpleBar(document.getElementById('linked-group-setting-form'),{scrollX:0});
        setTimeout(() => {
            if (response.status == 200) {
                getUpdatedGroupConfig();
                chrome.runtime.sendMessage({
                    'auto_approve_settings_updated': true
                });
                // $('.msg').text(response.msg);
                // message_animation('alert-success');
                messageToast('success', response.msg)
            } else {
                // $('.msg').text(response.msg);
                // message_animation('alert-danger');
                messageToast('error', response.msg)
            }
        }, 200);
    });
}

function updateGlobalAutoresponder(status) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "global-autoresponder-status",
        data: {
            global_auto_status: status
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            chrome.storage.local.get(["user"], function(result) {
                newUser = result.user;
                newUser.global_autoresponder_status = status;
                chrome.storage.local.set({
                    'user': newUser
                });
            });
            // message_animation('alert-success');
            // $('.msg').text(response.msg);
            messageToast('success', response.msg)
        }
    });
}

function updateCustomerApproveFirst(customerApproveFirst) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-customer-approve-first",
        data: {
            customer_approve_first: customerApproveFirst
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        console.log(response);
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            chrome.storage.local.get(["user"], function(result) {
                newUser = result.user;
                newUser.customer_approve_first = customerApproveFirst;
                chrome.storage.local.set({
                    'user': newUser
                });
            });
            // message_animation('alert-success');
            // $('.msg').text(response.msg);
            messageToast('success', response.msg)
        }
    });
}

function updateAutoDeclineKeywords(status) {
    var keyword = [];
    $("#decline-keywords option").each(function() {
        keyword.push($(this).val().toLowerCase());
    });
    var countries = [];
    $("#decline-countries option").each(function() {
        countries.push($(this).val().toLowerCase());
    });
    if ($('#auto_decline_interval').val() == '') {
        $('#auto_decline_interval').addClass('boarder-red-inputs')
        return false;
    }
    var autoDeclineInterval = $('#auto_decline_interval').val();
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-decline-keywords",
        data: {
            keywords: keyword,
            countries: countries,
            autoDeclineInterval: autoDeclineInterval,
            groupId: $('#actual-group-id').val()
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            chrome.runtime.sendMessage({
                'auto_approve_settings_updated': true
            });
            messageToast('success', response.msg)
        }
    });
}

function enableGlobalSheet(status) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "enable-one-googlesheet",
        data: {
            enable_status: status
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            chrome.storage.local.get(["user"], function(result) {
                newUser = result.user;
                newUser.enable_googlesheet = status;
                chrome.storage.local.set({
                    'user': newUser
                });
            });
            // message_animation('alert-success');
            // $('.msg').text(response.msg);
            messageToast('success', response.msg)
        }
    });
}
/********* To share with friends *******/
function share() {
    loader(true)
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "share",
        data: $("#viral_form").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
        }
    }).done(function(response) {
        loader(false)
        $('.loader-show').hide();
        // $('#Modal-share').modal('show');
        $('.tab').hide();
        $('#sharing_friends').show();
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 404) {
            // message_animation('alert-danger');
            // $('.msg').text(response.msg);
        } else {
            // message_animation('alert-success');
            // $('.msg').text(response.msg);
            $("#viral_form")[0].reset();
        }
    });
}
var randomDelayCheckArray = [1, 2, 3, 4, 5, 6];
/********* To verify user session *******/
function checkUserActivation() {
    randomDealyHour = randomDelayCheckArray[Math.floor(Math.random() * randomDelayCheckArray.length)];
    randomDealyHour = randomDealyHour * (60 * 60 * 1000);
    setInterval(function() {
        chrome.storage.local.get(["user"], function(result) {
            if (typeof result.user != "undefined" && result.user != "") {
                $.ajax({
                    type: "POST",
                    url: apiBaseUrl + "check-user-activation",
                    data: {
                        userId: result.user.id
                    },
                    dataType: 'json',
                    beforeSend: function(xhr) {
                        xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
                    }
                }).done(function(response) {
                    if (response.status == 404) {
                        chrome.storage.local.set({
                            'user': ''
                        });
                        chrome.runtime.sendMessage({
                            'reloadFbPage': 'yes'
                        });
                    }
                    planConfig = response.planConfig;
                });
            }
        });
    }, randomDealyHour);
}
/********* To verify user session *******/
function getPlanDetails() {
    chrome.storage.local.get(["user"], function(result) {
        loader(true);
        if (typeof result.user != "undefined" && result.user != "") {
            $.ajax({
                type: "POST",
                url: apiBaseUrl + "plan-details",
                data: {},
                dataType: 'json',
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
                }
            }).done(function(response) {
                loader(false)
                if (response.status == 401) {
                    triggerLogout();
                    return false;
                }
                if (response.status == 200) {
                    plandDetails = response.planDetails;
                    $('.plan_name').text(plandDetails.name);
                    $('.plan-price').text(plandDetails.price)
                    if (plandDetails.fb_groups == null) {
                        $('.groups_allowed').text('Unlimited');
                    } else {
                        $('.groups_allowed').text(plandDetails.fb_groups);
                        $('.upgrade_button_label').attr('href', "https://groupleads.net/plans?hash=" + plandDetails.unique_hash);
                        $(".upgrade_btn_wrap").show();
                    }
                    if (parseInt(plandDetails.reseller_id) != 0) {
                        $('.upgrade_btn_wrap').hide();
                    }
                }
            });
        }
    });
}
/********* LOGIN  *******/
function login() {
    $('.loader-show').show();
    var tempGLKey = $.trim($('#license_key').val());
    $.ajax({
        type: "POST",
        //url: apiBaseUrl + "?action=login&v=2",
        url: apiBaseUrl + "login",
        data: $("#loginform").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        $("#loginform button[type='submit']").removeAttr('disabled').text('Login');
        $('.loader-show').hide();
        if (response.status == 401) {
            message_animation('alert-danger');
            $('.msg').text(response.msg);
            return false;
        } else {
            if (response.status == 404) {
                message_animation('alert-danger');
                $('.msg').text(response.msg);
            } else {
                // chrome.identity.getAuthToken({interactive: true});
                planConfig = response.planConfig;
                message_animation('alert-success');
                jwtToken = response.apiToken;
                chrome.cookies.set({
                    url: baseUrl,
                    name: "jwt_token",
                    value: response.apiToken,
                    expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
                });
                chrome.storage.local.set({
                    'user': response.user,
                    'autoresponderList': response.autoResponderList,
                    'planConfig': response.planConfig,
                    'groupConfig': response.groupConfig,
                    'languages': response.languages
                });
                $('.msg').text(response.msg);
                chrome.runtime.sendMessage({
                    'type': 'jwtForBackground',
                    jwtToken: response.apiToken
                })
                chrome.runtime.sendMessage({
                    'reloadFbPage': 'yes'
                });
                dashboard();
            }
        }
    });
}

function updateAutoresponder() {
    $("#credentials_form button[type='submit']").attr('disabled', true).text('Verifying..');
    var data = $("#credentials_form").serialize();
    if ($('form[autoresponder_type="activecampaign"]').length > 0 && $('#new_autoresponder').val() == 0) {
        var multiTagData = [];
        $('#active-cmpaign-tags option').each(function() {
            var tempMulti = {};
            tempMulti.tagname = $(this).val();
            tempMulti.tagid = $(this).attr('tagid');
            multiTagData.push(tempMulti);
        })
        if (multiTagData.length > 0) {
            multiTagData = JSON.stringify(multiTagData);
            data = data + '&multiTagData=' + multiTagData
        } else {
            data = data + '&multiTagData=0'
        }
    }
    /*--------------------------------keap Autoresponder----------------------*/
    if ($('form[autoresponder_type="keap"]').length > 0 && $('#new_autoresponder').val() == 0) {
        var multiKeapTagData = [];
        $('#keap-tags option').each(function() {
            var tempkeapMulti = {};
            tempkeapMulti.tagname = $(this).val();
            tempkeapMulti.tagid = $(this).attr('tagid');
            multiKeapTagData.push(tempkeapMulti);
        })
        if (multiKeapTagData.length > 0) {
            multiKeapTagData = JSON.stringify(multiKeapTagData);
            data = data + '&multiTagData=' + multiKeapTagData
        } else {
            data = data + '&multiTagData=0'
        }
    }
    /*--------------------------------end keap Autoresponder-----------------------*/
    loader(true);
    console.log('loader show');
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-autoresponder",
        data: data,
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        console.log(response);
        loader(false);
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        /*if(response.token != undefined){
            updateAutoresponder_token(response.token,response.row_id);
        }*/
        btnLabel = selected_lang_locale.credential_form.submit_lable;
        $("#credentials_form button[type='submit']").attr('disabled', false).text(btnLabel);
        if (response.status == 404) {
            $('#constant_contact_setup_modal').modal('hide');
            $('#Error_credentials_modal').modal('show');
            // $('.msg').text(response.msg);
            // message_animation('alert-danger');
        } else {
            //$('.msg').text(response.msg);
            var isShowModal = true;
            if (response.action == 'added') {
                $('#autoresponder_id').val(response.autoresponder_id);
            }
            $('#new_autoresponder').val(0);
            // message_animation('alert-success');
            if (response.showactivecampaigntag != undefined && response.showactivecampaigntag == 1) {
                activeCampaignApiUrl = $('#app_path').val();
                activeCampaignApiToken = $('#key').val();
                $('#active-cmpaign-tags').tagsinput('removeAll');
                getActiveCampaignTags(activeCampaignApiUrl, activeCampaignApiToken);
                $('#active-campaign-group').show();
                isShowModal = false;
            }
            if (response.hotProspectorGroups != undefined && response.hotProspectorGroups.length > 0 && response.action == 'added') {
                var option = '<div class="groupleads-select select_options"><select id="hotProspectorGroups" class="form-control" name="hotProspectorGroups"> '
                response.hotProspectorGroups.forEach(function(item, index) {
                    option += '<option value="' + item.hodProsGroupId + '">' + item.hodProsGroupTitle + '</option>';
                });
                option += '</select></div>';
                // $('#other-list-title').show();
                $('#ar_field_three label').show();
                $('#url').hide();
                $('#url').after(option);
                isShowModal = false;
            } else if (response.dripTags != undefined && response.dripTags.length > 0 && response.action == 'added') {
                var option = '<select id="dripTags" class="form-control" name="dripTags"> '
                response.dripTags.forEach(function(item, index) {
                    option += '<option value="' + item + '">' + item + '</option>';
                });
                option += '</select>';
                // $('#other-list-title').show();
                $('#ar_field_three label').show();
                $('#url').hide();
                $('#url').after(option);
                isShowModal = false;
            }
            if (isShowModal) {
                $('#constant_contact_setup_modal').modal('hide');
                $('#verify_credentials_modal').modal('show');
            }
            $("html, body").animate({
                scrollTop: 0
            }, 500);
            getUpdatedGroupConfig();
            chrome.storage.local.set({
                'credentialEdit': false
            });
            $('.cancel-edit').hide();
        }
    });
}

function updateProfile() {
    // $('.loader-show').show(); 
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-profile",
        data: $("#profile_form").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
        }
    }).done(function(response) {
        // $('.loader-show').hide();
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 404) {
            // $('.msg').text(response.msg);
            // message_animation('alert-danger');
            messageToast('error', response.msg)
        } else {
            $('.profile_name').text($('#name').val());
            // $('#Modal-update').modal('show');
            chrome.storage.local.get(["user"], function(result) {
                var temp = result.user;
                temp.name = $("#profile_form #name").val();
                temp.email = $("#profile_form #email").val();
                chrome.storage.local.set({
                    'user': temp
                });
            });
            messageToast('success', response.msg);
        }
    });
}
//******** To show response messages with animation ******
function message_animation(addClass, timer = 2000) {
    $('.msg').addClass("alert " + addClass);
    setTimeout(function() {
        $('.msg').removeClass("alert alert-danger alert-success");
        $('.msg').text('');
    }, timer);
}
// /********* To update the extension popup pages *******/
function dashboard() {
    userSelectedLanguage();
    getLanguageArray();
    loader(true)
    $(".get-support").attr('href', getSupportUrl);
    $(".affiliate-url").attr('href', affiliateUrl);
    chrome.storage.local.get(["user", "planConfig"], function(result) {
        if (typeof result.user != "undefined" && result.user != "") {
            loader(true)
            planConfig = result.planConfig;
            var customerApproveFirst = result.user.customer_approve_first;
            if (customerApproveFirst) {
                $('#customerApproveFirst [value="' + customerApproveFirst + '"]').attr('selected', 'true');
            } else {
                customerApproveFirst = 50;
                $('#customerApproveFirst [value="' + customerApproveFirst + '"]').attr('selected', 'true');
            }
            $('#global-autoresponder-status').prop("checked", (result.user.global_autoresponder_status == 1) ? true : false);
            $('#global-googlesheet-enable').prop("checked", (result.user.enable_googlesheet == 1) ? true : false);
            $("#name").val(result.user.name);
            $(".userId").val(result.user.id);
            $("#profile_form #email").val(result.user.email);
            $("#Profile .profile_name").text(result.user.name);
            $("#Profile .profile_email").text(result.user.email);
            var firstLetter = 'G';
            if (result.user.name != null && result.user.name != '') {
                firstLetter = result.user.name.charAt(0);
            } else {
                firstLetter = result.user.email.charAt(0);
            }
            $('.first_letter_name').text(firstLetter);
            userId = result.user.id;
            if (window.location.href.indexOf('index.html') == -1) {
                document.location.href = '/index.html';
            }
            $('#login_screen').hide();
            chrome.runtime.sendMessage({
                'type': 'getLoginFBId'
            });
            getUserFBGroups();
        } else {
            document.location.href = '/login.html';
        }
    });
}
/******get group data **********/
function getUserFBGroups() {
    loader(true)
    $.ajax({
        type: "get",
        url: apiBaseUrl + "group-data-v7",
        //  data: {userId:userId},
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
        }
    }).done(function(response) {
        loader(true)
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        hash = response.hash;
        groupDataFetched = true;
        createDropDownOfLanguage(response.languages);
        if (response.status == 404) {
            chrome.storage.local.set({
                'fbGroupIds': []
            });
            checkGroupIsLinked(true);
            allGroupDataArray = [];
            $('.group-pagination').hide();
        } else {
            allGroupDataArray = response.data;
            showGroupsData();
        }
        if (typeof response.planConfig != "undefined") {
            planConfig = response.planConfig;
            chrome.storage.local.set({
                'planConfig': response.planConfig
            });
        }
    });
}

function showGroupsData() {
    loader(true)
    var rows = '';
    var fbGroupId = [];
    $(".group-list").html('');
    $('.group-pagination').hide();
    if (allGroupDataArray.length > 0) {
        // $(".global-option-box").css('display','inline-block');
    } else {
        $("#groups-yes").hide();
        $("#no-groups").show();
        // $(".global-option-box").hide();
    }
    console.log(allGroupDataArray);
    allGroupDataArray.forEach(function(item, i) {
        if (i < groupLimit) {
            fbGroupId.push(item.fb_group_id);
            if (item.google_sheet_url != null && item.google_sheet_url != '') {
                rows += '<div class="row group-item pt-3 pb-3 mt-2" data-search="' + item.group_name + '"><div class="col-7 pr-0"><h6>' + item.group_name + '</h6></div><div class="col-5 text-right pl-1 pr-1"><a  class="sync-group-questions group_settings" fb_group_id="' + item.fb_group_id + '" group-id="' + item.id + '" title="Sync Group Questions"><img src="assets/images/sync.jpg"></a><a  class="edit-group-settings group_settings" group-id="' + item.id + '" title="Settings"><img src="assets/images/settings.png"></a><span href="#"  class="automation-stats" group-id="' + item.id + '"  title="Automation Report"><img  data-toggle="modal" data-target="#automation_report_model" src="assets/images/list-grid.png"></span><a class="delete-group" fb-group-id ="' + item.fb_group_id + '"  group-id="' + item.id + '"  title="Delete"><img src="assets/images/delete.png"></a></div></div>';
            } else {
                rows += '<div class="group-setup-pending"><div class="row group-item pt-3 pb-3 mt-2" data-search="' + item.group_name + '"><div class="col-7 pr-0"><h6>' + item.group_name + '</h6></div><div class="col-5 text-right pl-1 pr-1"><a  class="sync-group-questions group_settings" fb_group_id="' + item.fb_group_id + '"  group-id="' + item.id + '"><img src="assets/images/sync.jpg"></a><a  class="edit-group-settings group_settings" group-id="' + item.id + '"><img src="assets/images/settings.png"></a><span  class="automation-stats " group-id="' + item.id + '" ><img  data-toggle="modal" data-target="#automation_report_model" src="assets/images/list-grid.png"></span><a class="delete-group" fb-group-id ="' + item.fb_group_id + '"  group-id="' + item.id + '" ><img src="assets/images/delete.png"></a></div></div>';
                rows += `<div class="col-12 pl-4 mt-2 setup_group">
                           <h5><img src="assets/images/icon-red.png"> ` + selected_lang_locale.no_groups_page.setup_group_span_one + ` <a group-id="` + item.id + `" class="setup-pending" > ` + selected_lang_locale.no_groups_page.setup_group_span_two + `</a> ` + selected_lang_locale.no_groups_page.setup_group_span_three + `</h5>
                        </div>
                        </div>`;
            }
        }
    });
    if (allGroupDataArray.length > 2) {
        $('.group-pagination').show();
    }
    chrome.storage.local.set({
        'fbGroupIds': fbGroupId
    });
    $(".group-list").html(rows);
    if (allGroupDataArray.length > $(".group-list .group-item").length) {
        $('.group-pagination').show();
    } else {
        $('.group-pagination').hide();
    }
    if (allGroupDataArray.length) {
        checkGroupIsLinked(false);
        lastOpenedScreen = '#groups-yes';
        $('.tab').hide();
        $(lastOpenedScreen).show();
    } else {
        checkGroupIsLinked(true);
    }
    loader(false)
}

function createDropDown($autoresponderList, $select) {
    $('#autoresponderDropDown').html('');
    var row = '';
    row = `<option value=''>Select Autoresponder</option>`;
    $autoresponderList.forEach(function(item, i) {
        if (item.id == $select) {
            row += `<option selected="selected" autoresponder_type="` + item.responder_key + `" autoresponder-id="` + item.id + `" value = "` + item.id + `">` + item.responder_type + `</option>`;
        } else {
            row += `<option autoresponder_type="` + item.responder_key + `" autoresponder-id="` + item.id + `" value = "` + item.id + `">` + item.responder_type + `</option>`;
        }
    });
    $('#autoresponderDropDown').html(row);
}

function createDropDownOfLanguage($languages = []) {
    $('#languagesSelect').html('');
    var row = '';
    $languages.forEach(function(item, i) {
        row += `<option  value="` + item.language_key + `">` + item.language_type + `</option>`;
    });
    $('#languagesSelect').html(row);
}

function checkGroupIsLinked(noGroupIsAdded) {
    console.log('checkGroupIsLinked');
    $('#no-groups .hide-when-groups').show();
    //$('.disable-already-added-group').removeClass('disable-already-added-group') 
    chrome.tabs.query({
        'active': true,
        'lastFocusedWindow': true
    }, function(tabs) {
        console.log(tabs);
        var pathname = tabs[0].url.toString();
        var fbGroupUrlArray = pathname.split('/');
        var currentGroupId = '';
        var groupId = '';
        var alphaGroupId = '';
        var currentGrouptitle = '';
       
        if (pathname.indexOf("facebook") > 0) {
            if (pathname.indexOf("/groups") > 0) {
                if (pathname.indexOf("/groups/") > 0) {
                    //console.log(fbGroupUrlArray);
                   // currentGroupId = fbGroupUrlArray[(fbGroupUrlArray.indexOf("groups") + 1)];

                    var groupUrl = tabs[0].url;
                    if(pathname.indexOf('/groups/') > 0){
                        groupUrl = groupUrl.split('/groups/')[1];
                        groupId = groupUrl.split('/')[0];
                    }
                    /*console.log(groupId);*/

                    var newurl = new URL(tabs[0].url);
                    var currenthost = newurl.origin;
                    console.log(currenthost);
                    if(groupId){
                        $.ajax({
                            type: "GET",
                            url: currenthost+"/groups/"+groupId,
                            success: function(data, txtStatus, request) {
                                var groupMetaUrl = $(data).filter("meta[property='al:android:url']").attr('content');
                                console.log(groupMetaUrl);
                                currentGroupId = groupMetaUrl.split('/group/')[1];
                                currentGrouptitle = getGroupName(tabs[0].title);
                                console.log(currentGrouptitle);


                                alphaGroupId = $(data).filter("meta[property='og:url']").attr('content');
                                alphaGroupId = alphaGroupId.split('/groups/')[1];
                                alphaGroupId = alphaGroupId.split('/')[0];

                                console.log('alpha id :'+ alphaGroupId);
                                console.log('numeric id :'+currentGroupId);

                                //console.log(currentGroupId);
                                if (currentGroupId != "" && currentGroupId != "?ref=bookmarks") {
                                    var groupFound = allGroupDataArray.findIndex(function(item) {
                                        //console.log(item.numeric_group_id);
                                        //console.log(currentGroupId);
                                        if (item.numeric_group_id == currentGroupId ||item.numeric_group_id == alphaGroupId) {
                                            //console.log(item);
                                            return item;
                                        }
                                    });
                                 
                                    if (groupFound >= 0) {

                                        if($.trim(allGroupDataArray[groupFound].group_name) != $.trim(currentGrouptitle)){
                                            var foundGroupId = allGroupDataArray[groupFound].id;

                                            $('.group_settings[group-id="'+foundGroupId+'"]').closest('.group-item').find('h6').text(currentGrouptitle);

                                            $.ajax({
                                                type: "POST",
                                                url: apiBaseUrl + "updated-group-name",
                                                data: {currentGrouptitle:currentGrouptitle,id:foundGroupId},
                                                dataType: 'json',
                                                beforeSend: function (xhr) {
                                                    xhr.setRequestHeader('Authorization', "Bearer "+jwtToken);
                                                }
                                            }).done(function(response) {
                                                if (response.status == 404) {
                                                    allGroupDataArray = [];
                                                } else {  
                                                    allGroupDataArray = response.data; 
                                                }
                                            });
                                        }

                                        $('.add-group-btn-with-groups').hide();
                                        $('.add-group-section').hide();
                                        $('.yes-group-redirecting-btn').addClass('disable-already-added-group').show(); 
                                    } else { 
                                        $('.disable-already-added-group').removeClass('disable-already-added-group') 
                                        currentUnlinkGroupId = currentGroupId;
                                        //console.log(currentUnlinkGroupId);
                                        $('#add-group-btn-with-groups').show();

                                        var tempGroupName = getGroupName(tabs[0].title)
                                        $('.on-screen-group-name').html(tempGroupName);
                                        $('.add-group-section').show();
                                     
                                        if (noGroupIsAdded) {
                                            $('.tab').hide();
                                            $('#no-groups-but-focus-group').show();
                                            lastOpenedScreen = '#no-groups-but-focus-group'; 
                                            $('#no-groups-but-focus-group .final-add-group-btn').show();
                                            $('#no-groups-but-focus-group .add-group-btn.add-group-btn-with-groups').show();
                                        }else{
                                            $('#groups-yes .final-add-group-btn, #groups-yes .add-group-btn.add-group-btn-with-groups').show();
                                        }

                                    }
                                }
                            }
                        });
                        splitArry = pathname.split("/groups/");
                        if (noGroupIsAdded && splitArry[1].length == 0) {
                           console.log('in');
                            $('.tab').hide();
                            $('#no-groups').show();
                            lastOpenedScreen = '#no-groups'; 
                        }
                    }
                }
            } else {
              
                if (noGroupIsAdded) {
                    console.log('noGroupIsAdded if');
                    //$('.disable-already-added-group').removeClass('disable-already-added-group')
                       $('.add-group-btn-without-groups').addClass('disable-add-group-btn')
                        $('.add-group-btn-without-groups button').prop('disabled', true)
                        $('#no-groups .final-add-group-btn').hide();
                        $('.tab').hide();
                        $('#no-groups').show();
                        lastOpenedScreen = '#no-groups';
                }else{
                    console.log('noGroupIsAdded else')
                    $('.add-group-section,.add-group.add-group-btn-with-groups').hide();
                    $('.yes-group-redirecting-btn').show(); 
                } 
            }
        } else {
        
            if (!noGroupIsAdded) { 
               // alert(2)
               console.log('noGroupIsAdded ! if')
                 $('.add-group-section,.final-add-group-btn').hide(); // 9 tab needs to integrate
                 $('.yes-group-redirecting-btn').show(); 
            } else {
                console.log('noGroupIsAdded else  1')
                $('.add-group-btn-without-groups').addClass('disable-add-group-btn')
                $('.add-group-btn-without-groups button').prop('disabled', true)
                $('#no-groups .final-add-group-btn').hide();
                $('.tab').hide();
                $('#no-groups').show();
                lastOpenedScreen = '#no-groups';
                
            }
        }


        if (!noGroupIsAdded) {
            $('#no-groups .hide-when-groups').hide();
        }
    });

    loader(false)
}

function getUpdatedGroupConfig(sendMessage = false) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "updated-group-config",
        data: {},
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
        }
    }).done(function(response) {
        console.log(response);
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            chrome.storage.local.set({
                'groupConfig': response.groupConfig
            });
        }
    });
}
// function showAutomationIntervals() {
//     $.ajax({
//         type: "POST",
//         url: apiBaseUrl + "auto-approve-settings-to-show",
//         data: {},
//         dataType: 'json',
//         beforeSend: function (xhr) {
//            xhr.setRequestHeader('Authorization', "Bearer "+jwtToken);
//         }
//     }).done(function(response) {
//         if (response.status == 401) {
//             triggerLogout();
//             return false;
//         }
//         if (response.status == 200) {
//             var rows = '';
//             response.autoSettings.forEach(function (item, i) {
//                 if(item.auto_approve==1){
//                     rows += '<tr>';
//                     rows += '<td>'+item.group_name+'</td>';
//                     rows += '<td>'+getCurrentDateTimeAs(item.next_interval)+'</td>';
//                     rows += '<td>'+getCurrentDateTime2(item.next_interval,item.interval_min)+'</td>';
//                     rows += '</tr>';
//                 }else{
//                     rows += '<tr>';
//                     rows += '<td>'+item.group_name+'</td>';
//                     rows += '<td>'+selected_lang_locale.report_page.table.automation_off+'</td>';
//                     rows += '<td>'+selected_lang_locale.report_page.table.automation_off+'</td>';
//                     rows += '</tr>';
//                 }
//             });
//             $("#automation-table tbody").html(rows);
//             $('#show-automation-groups').show();
//         } else {
//             $('.msg').text(selected_lang_locale.report_page.table.error_message);
//             message_animation('alert-danger');
//             $lastActiveTab.click();
//         }
//         $('.loader-show').hide();
//     });
// }
function getCurrentDateTimeAs(timeStamp) {
    var dateString = moment.unix(timeStamp).format("YYYY-MM-DD HH:mm:ss");
    return localDateFormat(dateString); // dateString;
}

function getCurrentDateTime2(next_interval, interval_min) {
    var dateString = moment.unix(next_interval).add(interval_min, 'minutes').format("YYYY-MM-DD HH:mm:ss");
    return localDateFormat(dateString);
}
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "refresh_groups") {
        loader(false);
        messageToast('success', 'Group is added successfully.');
        // setTimeout(()=>{
        //      window.location.reload();
        // },300)
        getUpdatedGroupConfig();
        getUserFBGroups();
    } else if (request.action == "already_added") {
        //  $('.loader-show').hide();
        // message_animation('alert-danger');
        //  $('.msg').text(request.msg);  
        loader(false)
        messageToast('error', request.msg)
    } else if (request.action == "questionsSyned") {
        messageToast('success', request.msg)
    } else if (request.action == "show_tags_div") {
        if (request.data.length > 0) {
            var options = '';
            request.data.forEach(function(oneTag) {
                if (oneTag.custom_color != null) {
                    style = 'style = "background:' + oneTag.custom_color + ' !important"';
                    options += `<div ` + style + ` color-code= '` + oneTag.custom_color + `' tag-id='` + $.trim(oneTag.id) + `' class="one-tag-li custom-control custom-checkbox chatsilo_support_community mt-2">
                    <input type="checkbox" class="custom-control-input multi-tag-checkbox" id="customCheck` + oneTag.id + `" name="example1">
                    <label class="custom-control-label" for="customCheck` + oneTag.id + `">` + oneTag.name + `</label>
                </div>`;
                } else {
                    options += `<div  color-code= '` + oneTag.custom_color + `"' tag-id='` + $.trim(oneTag.id) + `' class="one-tag-li custom-control custom-checkbox chatsilo_support_community mt-2 bg-` + $.trim(oneTag.class) + `">
                    <input type="checkbox" class="custom-control-input multi-tag-checkbox" id="customCheck` + oneTag.id + `" name="example1">
                    <label class="custom-control-label" for="customCheck` + oneTag.id + `">` + oneTag.name + `</label>
                </div>`;
                }
            });
            $('.all-tags-list').html(options);
        } else {
            $('.show_tags_div').remove();
        }
    }
});

function replaceTextByLang() {
    chrome.storage.local.get(["selectedLanuage"], function(result) {
        ///////////global group setting page ////////////////
        selected_lang_locale = result.selectedLanuage;
        allGroupLeadForms();
        $('#all_global_group_settings .global_autoresponder_label').text(selected_lang_locale.all_settings.global_autoresponder_label);
        $('#all_global_group_settings .setting_title').text(selected_lang_locale.all_settings.setting_title);
        $('#all_global_group_settings .global_googlesheet_enable_label').text(selected_lang_locale.all_settings.global_googlesheet_enable_label);
        $('#all_global_group_settings .global-language-label').text(selected_lang_locale.all_settings.global_language_label);
        $('.group-pagination').text(selected_lang_locale.all_group_listing.load_more);
        /////////////////////footer //////////////////////
        $('.affiliate_url_label').text(selected_lang_locale.footer.affiliate_url_label);
        $('.get_support_label').text(selected_lang_locale.footer.get_support_label);
        $('#footer-top #note_affiliate_p').text(selected_lang_locale.footer.note_affiliate_p);
        /////////////////////all groups listing //////////////////////
        $('.search_groups_field').attr('placeholder', selected_lang_locale.all_group_listing.search_groups_field);
        $('.group_label').text(selected_lang_locale.all_group_listing.group_label);
        /////////////////////No groups page //////////////////////
        $('.groups_sec .add_group_button').text(selected_lang_locale.no_groups_page.add_group_button);
        $('.groups_sec .no_group_p').text(selected_lang_locale.no_groups_page.no_group_p);
        $('.groups_sec .text').text(selected_lang_locale.no_groups_page.text);
        $('.groups_sec .view_tutorials_button').text(selected_lang_locale.no_groups_page.view_tutorials_button);
        $('.groups_sec .request_call_via_zoom_button').text(selected_lang_locale.no_groups_page.request_call_via_zoom_button);
        $('#no-groups .no_group_warning').text(selected_lang_locale.no_groups_page.no_group_warning);
        $('#groups-yes .no-group-text-1').text(selected_lang_locale.no_groups_page.no_group_text_1);
        $('#groups-yes .no-group-text-2').text(selected_lang_locale.no_groups_page.no_group_text_2);
        $('#groups-yes .add_to_gps_btn').text(selected_lang_locale.no_groups_page.add_to_gps_btn);
        /////////////////////sidebar page //////////////////////
        $('.sidenav .Groups_link').text(selected_lang_locale.sidebar.Groups_link);
        $('.sidenav .Settings_link').text(selected_lang_locale.sidebar.Settings_link);
        $('.sidenav .Share_link').text(selected_lang_locale.sidebar.Share_link);
        $('.sidenav .Plans_link').text(selected_lang_locale.sidebar.Plans_link);
        $('.sidenav .Rate_link').text(selected_lang_locale.sidebar.Rate_link);
        $('.sidenav .Help_link').text(selected_lang_locale.sidebar.Help_link);
        $('.sidenav .web_link').text(selected_lang_locale.sidebar.web_link);
        $('.sidenav .Logout').text(selected_lang_locale.sidebar.Logout);
        /////////////////////automation report modal //////////////////////
        $('#automation_report_model .automation_report_heading').text(selected_lang_locale.automation_report_modal.automation_report_heading);
        $('#automation_report_model .last_automation_time_label').text(selected_lang_locale.automation_report_modal.last_automation_time_label);
        $('#automation_report_model .automation_input').attr('placeholder', selected_lang_locale.automation_report_modal.automation_input);
        $('#automation_report_model .next_automation_time_label').text(selected_lang_locale.automation_report_modal.next_automation_time_label);
        //////////////////// settings per group page/////////////
        $('#setting_per_group .google_sheet_setup').text(selected_lang_locale.settings_per_group.google_sheet_setup);
        $('#setting_per_group .make_copy_google_sheet_1').text(selected_lang_locale.settings_per_group.make_copy_google_sheet_1);
        $('#setting_per_group .open-sample-sheet-link').text(selected_lang_locale.settings_per_group.make_format_label);
        $('#setting_per_group .google_sheet_url_label').text(selected_lang_locale.settings_per_group.google_sheet_url.label);
        $('.verify_sheet').text(selected_lang_locale.settings_per_group.google_sheet_url.verify_sheet);
        $('#setting_per_group .google_sheet_copy_1').html(selected_lang_locale.settings_per_group.google_sheet_copy.label_1);
        // $('#setting_per_group .official_sheet_url').html(selected_lang_locale.settings_per_group.google_sheet_copy.make_copy_text);
        $('#setting_per_group .view_google_sheet').html(selected_lang_locale.settings_per_group.google_sheet_copy.view_google_sheet);
        $('#setting_per_group .header_h6').text(selected_lang_locale.settings_per_group.autoresponder_section.header_h6);
        $('#setting_per_group .credentials_form_link_a').text(selected_lang_locale.settings_per_group.autoresponder_section.credentials_form_link_a);
        //console.log(settings_per_group);
        $('#setting_per_group .enable_autoresponder_per_group').text(selected_lang_locale.settings_per_group.enable_autoresponder_per_group);
        $('#setting_per_group .enable_decline_message').text(selected_lang_locale.settings_per_group.enable_decline_message);
        $('#setting_per_group .enable_welcome_message').text(selected_lang_locale.settings_per_group.enable_welcome_message);
        $('#setting_per_group .disable_tagging_per_group').text(selected_lang_locale.settings_per_group.disable_tagging_per_group);
        $('#setting_per_group .message_only_per_group').text(selected_lang_locale.settings_per_group.message_only_per_group);
        $('#setting_per_group .apply_chatsilo_tag_new_members').text(selected_lang_locale.settings_per_group.apply_chatsilo_tag_new_members);
        $('#setting_per_group .auto_decline').text(selected_lang_locale.settings_per_group.auto_decline);
        $('#setting_per_group .update_button').text(selected_lang_locale.settings_per_group.autoapprove_section.update_button);
        $('#setting_per_group .header_a').text(selected_lang_locale.settings_per_group.autoapprove_section.header_a);
        $('#setting_per_group .enable_automatic_approval').text(selected_lang_locale.settings_per_group.autoapprove_section.enable_automatic_approval);
        $('#setting_per_group .auto_approve_members').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_members);
        $('#setting_per_group .auto_approve_new_members_heading').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.auto_approve_new_members_heading);
        $('#setting_per_group .answer_questions').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.answer_questions);
        $('#setting_per_group .email_in_question').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.email_in_question);
        $('#setting_per_group .new_member_agree_to_group_rules').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.new_member_agree_to_group_rules);
        $('#setting_per_group .gender_select').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.gender_select);
        $('#setting_per_group .joined_facebook_at_least_select').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.joined_facebook_at_least_select);
        $('#setting_per_group .location').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.location);
        $('#setting_per_group .has_num_mutual_friends').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.has_num_mutual_friends);
        $('#setting_per_group .has_num_friends_group').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.has_num_friends_group);
        $('#setting_per_group .has_num_common_groups').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.has_num_common_groups);
        $('#setting_per_group .update_btn').text(selected_lang_locale.settings_per_group.autoapprove_section.auto_approve_new_members.update_btn);
        //     ////////////// decline page///////////////////
        $('#decline_message .page_title_h5').text(selected_lang_locale.decline_message_page.page_title_h5);
        //     $('#decline-message-form-box .decline_message_span').text(selected_lang_locale.decline_message_page.note.span);
        $('#decline_message .note_text').text(selected_lang_locale.decline_message_page.note.text);
        //     $('#decline-message-form-box .decline_message_label').text(selected_lang_locale.decline_message_page.decline_message.label);
        $('#decline_message .update_button_lable').text(selected_lang_locale.decline_message_page.update_button_lable);
        //     $('#decline-message-form-box .decline_update_back').text(selected_lang_locale.decline_message_page.back_button_lable);
        $('#decline_message .decline_interval_text').text(selected_lang_locale.decline_message_page.decline_interval_text);
        $('#decline_message .decline_interval_text_sp').text(selected_lang_locale.decline_message_page.decline_interval_text_sp);
        $('#decline_message .decline_limit_text').text(selected_lang_locale.decline_message_page.decline_limit_text);
        $('#decline_message .decline_limit_text_sp').text(selected_lang_locale.decline_message_page.decline_limit_text_sp);
        $('#decline_message .decline_start_text').text(selected_lang_locale.decline_message_page.decline_start_text);
        $('#decline_message .decline_start_text_sp').text(selected_lang_locale.decline_message_page.decline_start_text_sp);
        $('#decline_message .decline_random_message_per_group').text(selected_lang_locale.decline_message_page.decline_random_message_per_group);
        $('#declinemessage').attr('placeholder', selected_lang_locale.decline_message_page.decline_message_template);
        declineRandomMessageHtml = `  <div class="container-fluid decline-random-row decline-random-row-dynamic outer-message-can mb-2 p-0">
                        <div class="row input-row">
                            <div class="col-11 p-0 messages">
                                <textarea name="" id="" class="form-control" rows="10" placeholder="` + selected_lang_locale.decline_message_template + `">` + selected_lang_locale.decline_message_template + `</textarea>
                             
                            </div>
                            <div class="col-1 p-0 text-right ">
                                <i title="Back" class="fa fa-angle-left m-temp-save"></i>
                            </div>
                            <div class="col-12 p-0 autoresponder_settings">
                                        <h6 ><img src="assets/images/icon-red.png"><span class="note_text"> ` + selected_lang_locale.decline_message_page.note.text + `</span></h6>
                            </div>
                        </div>
                        <div class="row display-row">
                            <div class="col-10 p-0 messages">
                                <h5><a class=" display-m-text" >` + selected_lang_locale.decline_message_template + `</a></h5>
                            </div>
                            <div class="col-2 p-0 text-right ">
                                <div class="dropdown dropleft float-right">
                                    <img src="assets/images/list-icon.png" class=" dropdown-toggle list-icon" data-toggle="dropdown">
                                    <div class="dropdown-menu">
                                      <a class="dropdown-item edit-m-n" href="#">Edit</a>
                                      <a class="dropdown-item  delete-random-textarea" href="#">Delete</a>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    </div>`;
        //     //////// welcome page
        $('#welcome_message .page_title_h5').text(selected_lang_locale.welcome_message_page.page_title_h5);
        //$('#welcome-message .welcome_message_span').text(selected_lang_locale.welcome_message_page.note.span);
        //     $('#welcome-message-form-box .note_text').text(selected_lang_locale.welcome_message_page.note.text);
        //     $('#welcome-message-form-box .welcome_message_label').text(selected_lang_locale.welcome_message_page.welcome_message.label);
        $('#welcome_message .welcome_update_button').text(selected_lang_locale.welcome_message_page.update_button_lable);
        //     $('#welcome-message-form-box .decline_update_back').text(selected_lang_locale.welcome_message_page.back_button_lable);
        $('#welcome_message .welcome-interval-text').text(selected_lang_locale.welcome_message_page.welcome_interval_text);
        $('#welcome_message .welcome-interval-text-sp').text(selected_lang_locale.welcome_message_page.welcome_interval_text_sp);
        $('#welcome_message .welcome-limit-text').text(selected_lang_locale.welcome_message_page.welcome_limit_text);
        $('#welcome_message .welcome-limit-text-sp').text(selected_lang_locale.welcome_message_page.welcome_limit_text_sp);
        $('#welcome_message .welcome-start-text').text(selected_lang_locale.welcome_message_page.welcome_start_text);
        $('#welcome_message .welcome-start-text-sp').text(selected_lang_locale.welcome_message_page.welcome_start_text_sp);
        $('#welcome_message .welcome_random_message_per_group').text(selected_lang_locale.welcome_message_page.welcome_random_message_per_group);
        $('#welcomemessageone').attr('placeholder', selected_lang_locale.welcome_message_page.welcome_message_template);
        welcomeRandomMessageHtml = `  <div class="container-fluid welcome-random-row welcome-random-row-dynamic outer-message-can mb-2 p-0">
                        <div class="row input-row">
                            <div class="col-10 p-0 messages">
                                <textarea name=""  class="form-control" rows="10" placeholder="` + selected_lang_locale.welcome_message_template + `">` + selected_lang_locale.welcome_message_template + `</textarea>
                              
                            </div>
                            <div class="col-2 p-0 text-right ">
                                <i title="Back" class="fa fa-angle-left m-temp-save"></i>
                            </div>
                            <div class="col-12 p-0 autoresponder_settings">
                                        <h6 ><img src="assets/images/icon-red.png"><span class="note_text"> ` + selected_lang_locale.decline_message_page.note.text + `</span></h6>
                            </div>

                        </div>
                        <div class="row display-row">
                            <div class="col-10 p-0 messages">
                                <h5><a class="display-m-text" >` + selected_lang_locale.welcome_message_template + `</a></h5>
                            </div>
                            <div class="col-2 p-0 text-right ">
                                <div class="dropdown dropleft float-right">
                                    <img src="assets/images/list-icon.png" class=" dropdown-toggle list-icon" data-toggle="dropdown">
                                    <div class="dropdown-menu">
                                      <a class="dropdown-item edit-m-n" href="#">Edit</a>
                                      <a class="dropdown-item welcome-delete-random-textarea" href="#">Delete</a>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    </div>`;
        $('#tag_message_one').attr('placeholder', selected_lang_locale.tag_page.welcome_comment);
        tagRandomMessageHtml = `  <div class="container-fluid tag-random-row tag-random-row-dynamic outer-message-can mb-2 p-0">
                        <div class="row input-row">
                            <div class="col-11 p-0 messages">
                                <textarea name=""  class="form-control" rows="10" placeholder="` + selected_lang_locale.tag_page.welcome_comment + `">` + selected_lang_locale.tag_page.welcome_comment + `</textarea>
                            </div>
                            <div class="col-1 p-0 text-right ">
                                <i title="Back" class="fa fa-angle-left m-temp-save"></i>
                            </div>
                        </div>
                        <div class="row display-row">
                            <div class="col-10 p-0 messages">
                                <h5><a class="display-m-text" >` + selected_lang_locale.tag_page.welcome_comment + `</a></h5>
                            </div>
                            <div class="col-2 p-0 text-right list_message">
                                <div class="dropdown dropleft float-right">
                                    <img src="assets/images/list-icon.png" class=" dropdown-toggle list-icon" data-toggle="dropdown">
                                    <div class="dropdown-menu">
                                      <a class="dropdown-item edit-m-n" href="#">Edit</a>
                                      <a class="dropdown-item tag-delete-random-textarea" href="#">Delete</a>
                                    </div>
                                 </div>
                            </div>
                        </div>
                    </div>`
        $('.tag_key_label').text(selected_lang_locale.tag_page.tag_key_label);
        $('.tag_key_label_2').text(selected_lang_locale.tag_page.tag_key_label_2);
        $('.tag_in_single_comment_label').text(selected_lang_locale.tag_page.tag_in_single_comment_label);
        $('.tag_random_message_per_group').text(selected_lang_locale.tag_page.tag_random_message_per_group);
        $('#save-tag-form').text(selected_lang_locale.tag_page.save_tag_form);
        ///////send message settings onlt modal///////////
        $('#send_message_modal .message_text').text(selected_lang_locale.send_message_modal.message_text);
        $('#send_message_modal .message_label').text(selected_lang_locale.send_message_modal.message_label);
        $('#send_message_modal .message_save').text(selected_lang_locale.send_message_modal.message_save);
        $('#send_message_modal .message_placeholder').attr('placeholder', selected_lang_locale.send_message_modal.message_placeholder);
        ///////chatsilo  modal///////////
        $('#chatsilo_modal .save_btn').text(selected_lang_locale.chatsilo_modal.save_btn);
        //     //////// auto decline feature//////////
        //     $('.auto_decline_per_group').text(selected_lang_locale.decline_message_page.auto_decline_per_group);
        $('.auto_decline_key_label').text(selected_lang_locale.decline_message_page.auto_decline_key_label);
        $('.auto_decline_key_heading').text(selected_lang_locale.decline_message_page.auto_decline_key_heading);
        $('.bootstrap-tagsinput input').attr('placeholder', selected_lang_locale.decline_message_page.auto_decline_placeholder);
        $('.decline-country-wrapper .bootstrap-tagsinput input').attr('placeholder', selected_lang_locale.decline_message_page.auto_decline_country_placeholder);
        $(' .auto_decline_key_label_2').text(selected_lang_locale.decline_message_page.auto_decline_key_label_2);
        $(' .auto_decline_key_label_h6').text(selected_lang_locale.decline_message_page.auto_decline_key_label_h6);
        $(' .auto_decline_save_btn').text(selected_lang_locale.decline_message_page.auto_decline_save_btn);
        //     ////////////// report page//////////
        //     $('#show-automation-groups #automation-table .automation-table-th1').text(selected_lang_locale.report_page.table.th_1);
        //     $('#show-automation-groups #automation-table .automation-table-th2').text(selected_lang_locale.report_page.table.th_2);
        //     $('#show-automation-groups #automation-table .automation-table-th3').text(selected_lang_locale.report_page.table.th_3);
        //     ///////////// profile page /////////////
        $('#Profile .page_title_h4').text(selected_lang_locale.profile_page.page_title_h4);
        $('#Profile .full_name_label').text(selected_lang_locale.profile_page.full_name_label);
        $('#Profile .email_label').text(selected_lang_locale.profile_page.email_label);
        $('#Profile .button_label').text(selected_lang_locale.profile_page.button_label);
        $('#Modal-update .profile_message_h3').text(selected_lang_locale.profile_page.profile_message_h3);
        ////////////// billing sections//////////////
        $('#Profile .h2_1').text(selected_lang_locale.profile_page.billing_section.h2_1);
        $('#Profile .h2_2').text(selected_lang_locale.profile_page.billing_section.h2_2);
        $('#Profile .allowed_text').text(selected_lang_locale.profile_page.billing_section.allowed_text);
        $('#Profile .p_text').text(selected_lang_locale.profile_page.billing_section.p_text);
        $('#Profile .upgrade_button_label').text(selected_lang_locale.profile_page.billing_section.upgrade_button_label);
        $('#Profile .plan_name').text(selected_lang_locale.profile_page.billing_section.plan_name);
        //     /////////////share page////////////
        $('#sharing_email .page_title_h4').text(selected_lang_locale.share_page.page_title_h4);
        $('#sharing_email .share_a').text(selected_lang_locale.share_page.share_a);
        $('#sharing_email .email_label').text(selected_lang_locale.share_page.email_label);
        $('#sharing_email .email_placeholder').attr('placeholder', selected_lang_locale.share_page.email_placeholder);
        $('#sharing_email .email_h6').text(selected_lang_locale.share_page.email_h6);
        $('#sharing_email .email_address_label').text(selected_lang_locale.share_page.email_address_label);
        $('#sharing_email .share_textarea_message').val(selected_lang_locale.share_page.share_textarea_message);
        $('#sharing_email .share_button_label').text(selected_lang_locale.share_page.share_button_label);
        //     /////////login page//////////
        $('#login_screen .login_page_title_h3').text(selected_lang_locale.login_page.login_page_title_h3);
        $('#login_screen .p1_text').text(selected_lang_locale.login_page.p1_text);
        $('#login_screen .license_key_label').html(selected_lang_locale.login_page.license_key.label);
        $('#login_screen .license_key_text_placeholder').attr('placeholder', selected_lang_locale.login_page.license_key.placeholder);
        $('#login_screen .forgot_key_a').text(selected_lang_locale.login_page.forgot_key_a);
        $('#login_screen .signup_label').text(selected_lang_locale.login_page.signup_label);
        $('#login_screen .get_support1').text(selected_lang_locale.login_page.get_support1);
        $('#login_screen .note_affiliate_p').text(selected_lang_locale.login_page.note_affiliate_p);
        $('#login_screen .tooltip_label').text(selected_lang_locale.login_page.license_key.tooltip_label);
        $('#login_screen .login_button_label').text(selected_lang_locale.login_page.login_button_label);
        /////////////forgot page/////////////////
        $('#help .help_title').text(selected_lang_locale.help_page.help_title);
        $('#help .help_p').text(selected_lang_locale.help_page.help_p);
        $('#help .step_by_step_tutorials_text').text(selected_lang_locale.help_page.step_by_step_tutorials_text);
        $('#help .schedule_zoom_call_text').text(selected_lang_locale.help_page.schedule_zoom_call_text);
        $('#help .become_affiliate_text').text(selected_lang_locale.help_page.become_affiliate_text);
        $('#help .become_GL_reseller_text').text(selected_lang_locale.help_page.become_GL_reseller_text);
        //     /////////////forgot page/////////////////
        $('#forgot_licence_screen .forgot_label').text(selected_lang_locale.forgot_license_page.forgot_label);
        $('#forgot_licence_screen .p2_text').text(selected_lang_locale.forgot_license_page.p2_text);
        $('#forgot_licence_screen .email_label').text(selected_lang_locale.forgot_license_page.email.email_label);
        $('#forgot_licence_screen .forgot_placeholder').attr('placeholder', selected_lang_locale.forgot_license_page.email.forgot_placeholder);
        $('#forgot_licence_screen .forgot_button_label').text(selected_lang_locale.forgot_license_page.forgot_button_label);
        $('#forgot_licence_screen .already_key_text').text(selected_lang_locale.forgot_license_page.already_key.text);
        $('#forgot_licence_screen .note_affiliate_p').text(selected_lang_locale.forgot_license_page.already_key.note_affiliate_p);
        //     /////////////auto apporve page settings ///////////
        //     $('#auto-approve-form-box .page_title_h5').text(selected_lang_locale.auto_approve_page_settings.page_title_h5);
        //     $('#auto-approve-form-box .enable_automation_lable').text(selected_lang_locale.auto_approve_page_settings.enable_automation_lable);
        //     $('#auto-approve-form-box .interval_label').text(selected_lang_locale.auto_approve_page_settings.interval_label);
        //     $('#auto-approve-form-box .section_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.section_label);
        //     $('#auto-approve-form-box .all_answered_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.all_answered_label);
        //     $('#auto-approve-form-box .is_email').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.is_email);
        //     $('#auto-approve-form-box .gender_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.gender_label);
        //     $('#auto-approve-form-box .joined_before_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.joined_before_label);
        //     joined_before_options = selected_lang_locale.auto_approve_page_settings.valid_member_section.joined_before_options;
        //     $('#auto-approve-form-box #whenjoined option').each(function( index ) {
        //         $element = $(this);
        //         joined_before_options.forEach(function (item,i) {
        //         if (index == i) {
        //             $element.text(item);
        //             }
        //         })
        //     });
        //     $('#auto-approve-form-box .already_friends_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.already_friends_label);
        //     $('#auto-approve-form-box .lives_in_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.lives_in_label);
        //     $('#auto-approve-form-box .lives_in_placeholder').attr("placeholder",selected_lang_locale.auto_approve_page_settings.valid_member_section.lives_in_placeholder);
        //     $('#auto-approve-form-box .mutual_friend_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.mutual_friend_label);
        //     $('#auto-approve-form-box .common_groups_label').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.common_groups_label);
        //     $('#auto-approve-form-box .update_button_lable').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.update_button_lable);
        //     $('#auto-approve-form-box .back_button_lable').text(selected_lang_locale.auto_approve_page_settings.valid_member_section.back_button_lable);
        //     ////////// credential page /////////
        //     $('#credentials-of-autoresponder .credential_title_span_2').text(selected_lang_locale.credential_autoresponder_page.credential_title_span_2);
        //     $('#credentials_form .update_button_lable').text(selected_lang_locale.credential_autoresponder_page.update_button_lable);
        //     $('#credentials-of-autoresponder .back_button_lable').text(selected_lang_locale.credential_autoresponder_page.back_button_lable);
        //     $('#credentials-of-autoresponder .cancel-edit').val(selected_lang_locale.credential_autoresponder_page.cancel_edit);
        ////////// credential modal page /////////
        // $('#credentials_form .api_token_label').text(selected_lang_locale.autoresponder_credential_page.api_token_label);
        // $('#credentials_form .api_token_placeholder').attr('placeholder',selected_lang_locale.autoresponder_credential_page.api_token_placeholder);
        // $('#credentials_form .api_key').text(selected_lang_locale.autoresponder_credential_page.api_key);
        //  $('#credentials_form .credential_title_span_2').text(selected_lang_locale.autoresponder_credential_page.credential_title_span_2);
        // $('#credentials_form .api_key_placeholder').attr('placeholder',selected_lang_locale.autoresponder_credential_page.api_key_placeholder);
        //  $('#credentials_form .list_id').text(selected_lang_locale.autoresponder_credential_page.list_id);
        //  $('#credentials_form .list_id_placeholder').attr('placeholder',selected_lang_locale.autoresponder_credential_page.list_id_placeholder);
        //  $('#credentials_form .submit_label').text(selected_lang_locale.autoresponder_credential_page.submit_label);
        $('#credentials_form .update_credential_btn').text(selected_lang_locale.credential_form.submit_lable);
        // showGroupsData();
    });
}

function userSelectedLanguage() {
    chrome.cookies.get({
        url: baseUrl,
        name: "groupleads_language"
    }, function(result) {
        if (result != null) {
            userLang = result.value;
            return userLang;
        } else {
            return userLang;
        }
    });
}

function getLanguageArray() {
    var lang = 'en';
    chrome.cookies.get({
        url: baseUrl,
        name: "groupleads_language"
    }, function(result) {
        if (result != null) {
            lang = result.value;
        }
        findOptions = setInterval(() => {
            if ($('#languagesSelect option').length > 0) {
                clearInterval(findOptions);
                $('#languagesSelect [value="' + lang + '"]').attr('selected', 'true');
            }
        }, 200)
        chrome.cookies.set({
            url: baseUrl,
            name: "groupleads_language",
            value: lang,
            expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
        });
        chrome.storage.local.get(["groupleads_languages"], function(result) {
            lang_data = result.groupleads_languages;
            selectedLanuage = lang_data['' + lang + ''];
            chrome.storage.local.set({
                'selectedLanuage': selectedLanuage
            });
            replaceTextByLang();
        });
    });
}
var allFormObjects = [];

function allGroupLeadForms() {
    allFormObjects.forEach(function(item) {
        item.destroy();
    });
    allFormObjects = [];
    ////////// profile form///////////
    var profileform = $("#profile_form").validate({
        rules: {
            name: "required",
            email: {
                required: true,
                email: true,
                // remote: {
                //     type: 'post',
                //     url: apiBaseUrl + "?action=validateEmail",
                //     data: {
                //         'id': function() {
                //             return $('#profile_form input.userId').val();
                //         }
                //     },
                //     dataType: 'json'
                // }
            }
        },
        messages: {
            name: "Full name can not be empty",
            email: {
                required: "Email can not be empty",
                email: "Please enter valid email",
                remote: "Email already registered"
            }
        },
        submitHandler: function(form, event) {
            event.preventDefault();
            updateProfile();
            return false;
        }
    });
    allFormObjects.push(profileform);
    profileform.settings.messages.name = selected_lang_locale.profile_form.name;
    profileform.settings.messages.email.required = selected_lang_locale.profile_form.email.required;
    profileform.settings.messages.email.email = selected_lang_locale.profile_form.email.email;
    profileform.settings.messages.email.remote = selected_lang_locale.profile_form.email.remote;
    //     ///////// Login form /////////////
    var loginForm = $("#loginform").validate({
        rules: {
            license_key: {
                required: true
            }
        },
        messages: {
            license_key: {
                required: "License key can not be empty"
            }
        },
        submitHandler: function() {
            $("#loginform button[type='submit']").attr('disabled', true).text('Processing');
            login();
            return false;
        }
    });
    //     allFormObjects.push(loginForm);
    //     loginForm.settings.messages.license_key.required = selected_lang_locale.login_form;
    //        /********* Validate forgot password form *******/
    //     var forgotPassword = $("#forgot_password_form").validate({
    //         rules: {
    //             email: {
    //                 required: true,
    //                 email: true
    //             }
    //         },
    //         messages: {
    //             email: {
    //                 required: "Email can not be empty",
    //                 email: "Please enter valid email"
    //             }
    //         },
    //         submitHandler: function() {
    //             forgot_password();
    //             return false;
    //         }
    //     });
    //     allFormObjects.push(forgotPassword);
    //     forgotPassword.settings.messages.email.required = selected_lang_locale.forgot_password.email.required;
    //     forgotPassword.settings.messages.email.email = selected_lang_locale.forgot_password.email.email;
    //    /********* Validate LinkedIn features settings form *******/
    var groupSettingForm = $("#linked-group-setting-form").validate({
        rules: {
            google_sheet_url: {
                required: true,
                url: true
            }
        },
        messages: {
            google_sheet_url: {
                required: "Google sheet URL can not be empty",
                url: "Invalid Url Format"
            }
        },
        errorPlacement: function(error, element) {
            if (element.attr("id") == "google_sheet_url") {
                error.insertAfter($(element).next());
            } else {
                error.insertAfter(element);
            }
        },
        submitHandler: function() {
            updateSettingsGoogleSheetUrl();
            return false;
        }
    });
    //     allFormObjects.push(groupSettingForm);
    //     groupSettingForm.settings.messages.google_sheet_url.required = selected_lang_locale.group_setting_form.google_sheet_url.required;
    //     groupSettingForm.settings.messages.google_sheet_url.url = selected_lang_locale.group_setting_form.google_sheet_url.url;
    /********* Validate share form *******/
    var shareForm = $("#viral_form").validate({
        rules: {
            emails: {
                required: true,
                multiemails: true
            },
            sharemessagetext: {
                required: true
            }
        },
        messages: {
            emails: {
                required: "Field can not be empty",
                multiemails: "Invalid emails format"
            },
            sharemessagetext: {
                required: "Field can not be empty"
            }
        },
        submitHandler: function(form, event) {
            event.preventDefault();
            share();
            return false;
        }
    });
    allFormObjects.push(shareForm);
    shareForm.settings.messages.emails.required = selected_lang_locale.share_form.emails.required;
    shareForm.settings.messages.emails.multiemails = selected_lang_locale.share_form.emails.multiemails;
    shareForm.settings.messages.sharemessagetext.required = selected_lang_locale.share_form.sharemessage.required;
}

function localDateFormat(isDate) {
    let s = new Date(isDate).toLocaleString(navigator.language);
    return s;
}

function fillTempAutoCredentials() {
    chrome.storage.local.get(["credentialtemp", "credentialEdit", "credentialEditTime"], function(result) {
        if (result.credentialEdit && typeof result.credentialtemp != "undefined" && result.credentialtemp != "") {
            credentialtemp = result.credentialtemp;
            credentialEditTime = result.credentialEditTime;
            var fill = false;
            if (moment() < moment(credentialEditTime)) {
                fill = true;
            }
            if (fill && result.credentialEdit && credentialtemp.group_id == $('#credentials_form #group-id-credentails').val() && credentialtemp.autoType == $('#credentials_form #autoresponder_type').val()) {
                $('#credentials_form #key').val(credentialtemp.key);
                $('#credentials_form #app_path').val(credentialtemp.app_path);
                $('#credentials_form #url').val(credentialtemp.url);
                $('.cancel-edit').show();
            }
        }
    });
}

function fillDbARCredentials() {
    chrome.storage.local.get(["tempDbARCredentials"], function(result) {
        if (typeof result.tempDbARCredentials != "undefined" && result.tempDbARCredentials != "") {
            credentialDBtemp = result.tempDbARCredentials;
            if (credentialDBtemp.new_autoresponder = 1 && credentialDBtemp.group_id == $('#credentials_form #group-id-credentails').val() && credentialDBtemp.autoType == $('#credentials_form #autoresponder_type').val()) {
                $('#credentials_form #key').val(credentialDBtemp.key);
                $('#credentials_form #app_path').val(credentialDBtemp.app_path);
                $('#credentials_form #url').val(credentialDBtemp.url);
                $('.cancel-edit').hide();
            }
        }
    })
}

function validateWelcomePostUrl() {
    if (!isUrlValid($('#post-url').val())) {
        // $('#post-url-error').remove();
        // $('#post-url').after('<label id="post-url-error" class="error" for="post-url">Please enter a valid URL.</label>');
        messageToast('error', "Please enter a valid URL.")
        return false;
    } else {
        $("#post-url-error").remove();
    }
    validPostUrl = false;
    if ($('#post-url').val() != '' && isUrlValid($('#post-url').val())) {
        if ($('#post-url').val().indexOf('facebook') > -1) {
            $('#save-tag-form').text('Verifying url').prop('disabled', true);
            mobileViewUrl = new URL($('#post-url').val());
            mobileViewUrl = 'https://m.facebook.com' + mobileViewUrl.pathname;
            $.ajax({
                url: mobileViewUrl,
                type: "GET",
                dataType: "html",
                success: function(data) {
                    validPostUrl = false;
                    if (data.indexOf('m_story_permalink_view') > -1) {
                        validPostUrl = true;
                    }
                    if (!validPostUrl) {
                        messageToast('error', 'Invalid post url')
                    } else {
                        updateTagMessage();
                    }
                    $('#save-tag-form').text('Save').prop('disabled', false);;
                },
                error: function(xhr, status) {
                    validPostUrl = false;
                },
                complete: function(xhr, status) {
                    //$('#showresults').slideDown('slow')
                }
            });
        } else {
            validPostUrl = false;
            // message_animation('alert-danger',10000);
            // $('.msgTag').html('Invalid post url');
            messageToast('error', 'Invalid post url')
        }
    }
}

function setHelpLinks() {
    var appendLearnMore = "<span>Click here to learn more</span>"
    $("#step_by_step_help").attr('href', helpLinks.step_by_step_help)
    $("#schedule_call_help").attr('href', helpLinks.schedule_call_help)
    $("#become_affiliate_help").attr('href', helpLinks.become_affiliate_help)
    $("#become_reseller_help").attr('href', helpLinks.become_reseller_help)
    $(".affiliate_url_label").attr('href', helpLinks.affiliate_url)
    $('.official_sheet_url').attr('href', helpLinks.official_sheet_url)
}

function triggerLogout() {
    // $('#Modal-logout').modal('hide');
    chrome.storage.local.set({
        'user': ''
    });
    $('.tabs').hide();
    // $('#tab1').show();
    // message_animation('alert-success');
    chrome.cookies.set({
        url: baseUrl,
        name: "jwt_token",
        value: '',
        expirationDate: (new Date().getTime() / 1000) + (3600 * 1000 * 87660)
    });
    // $('.msg').text(selected_lang_locale.logout_modal.logout_message);
    chrome.runtime.sendMessage({
        'reloadFbPage': 'yes'
    });
    // $('#tab').hide();
    // $('#tab-content-1').hide();
    document.location.href = '/login.html';
    $('#login_screen').show();
    // $(".before-login-footer").show();
}

function getGroupName(tabTitle) {
    var groupTitleName = '';
    var groupTitleNameNew = '';
    if ($.trim(tabTitle).indexOf('|') > -1) {
        groupTitleName = $.trim(tabTitle).split('|');
        groupTitleName = groupTitleNameNew = $.trim(groupTitleName[0]); //'(1) Basic English and Grammar';
    } else {
        groupTitleName = groupTitleNameNew = $.trim(tabTitle);
    }
    var tmpGroupTitleArray = groupTitleName.split(' ');
    if (tmpGroupTitleArray[0].indexOf('(') > -1 && tmpGroupTitleArray[0].indexOf(')') > -1) { // Basic English and Grammar (11111)
        tmpGroupTitleArray.splice(0, 1);
        newGroupName = tmpGroupTitleArray.join(' ');
        return $.trim(newGroupName);
    } else {
        return groupTitleNameNew;
    }
}
$(document).ready(function() {
    $(document).on('click', '#connect_app', function() {
        oAuth2Redirect = true;
        $("#credentials_form").submit();
    });
});

function RedirectOAuth2() {
    var formdata = $("#credentials_form").serialize();
    var encoded = btoa(formdata);
    var url = apiBaseUrl + "connect-app/" + encoded;
    chrome.runtime.sendMessage({
        'connect_app': true,
        'app_url': url
    });
}

function messageToast(type, message) {
    toastr.options = {
        "closeButton": true
    }
    if (type == 'success') {
        toastr.success(message)
    } else if (type == 'error') {
        toastr.error(message)
    } else if (type == 'info') {
        toastr.info(message)
    } else if (type == 'warning') {
        toastr.warning(message)
    }
}
// .group-list
$(document).on('keyup', '.search_groups_field', function() {
    var searched_text = $(this).val().toLowerCase();
    if(searched_text != ''){
        $(".group-list .group-item").each(function() {
            var groupName = $(this).attr('data-search').toLowerCase();
            if (groupName.indexOf(searched_text) !== -1) {
                $(this).show();
                $('.setup_group').hide();
            } else {
                $(this).hide();
                $('.setup_group').hide();
            }
        })
    }else{
        $('.group-item').show();
        $('.setup_group').show();
    }
    
})

function getAutomationRecords(groupId) {
    loader(true)
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "automation-records",
        data: {
            groupId: groupId
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
        }
    }).done(function(response) {
        console.log(response);
        loader(false);
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        if (response.status == 200) {
            var rows = '';
            var groupName = response.autoSettings[0].group_name;
            $('.records-group-name').text(groupName)
            if (!response.autoSettings[0].auto_approve) {
                console.log('if automation_input');
                // $('.last-automation-time, .last-automation-date, .next-automation-time, .next-automation-date').val(selected_lang_locale.automation_report_modal.automation_input);
                // $('.last-automation-time, .last-automation-date, .next-automation-time, .next-automation-date').val('Automation off');
                $('.last-automation-time, .last-automation-date, .next-automation-time, .next-automation-date').val(selected_lang_locale.automation_report_modal.automation_input);
            } else {
                console.log('else automation_input');
                console.log(response.autoSettings[0]);

                var next_interval = response.autoSettings[0].next_interval;
                var interval_min = response.autoSettings[0].interval_min;
                t1 = getCurrentDateTimeAs(next_interval)
                console.log(t1);
                if (t1.indexOf(',') > -1) {
                    t1 = t1.split(',')
                    $('.last-automation-time').val(t1[1]);
                    $('.last-automation-date').val(t1[0]);
                }
                t2 = getCurrentDateTime2(next_interval, interval_min)
                console.log(t2);
                console.log(new Date());
                if (new Date() > new Date(t2)) {
                    console.log('if get current date time');
                    t2 = getCurrentDateTime2(Date.now() / 1000 | 0, interval_min);
                    console.log(t2);
                }
                console.log('t2: '+t2);
                if (t2.indexOf(',') > -1) {
                    t2 = t2.split(',')
                    $('.next-automation-time').val(t2[1]);
                    $('.next-automation-date').val(t2[0]);
                }
                $('.last-automation-time').val();
            }
        } else {
            console.log('else case in automation record')
            $('.msg').text(selected_lang_locale.report_page.table.error_message);
            message_animation('alert-danger');
            $lastActiveTab.click();
        }
        $('.loader-show').hide();
    });
}

function loader(state) {
    if (state) {
        $(".loader_wrap").show();
    } else {
        $(".loader_wrap").hide();
    }
}

function updateSettingsGoogleSheetUrl() {
    loader(true)
    $('.save-google-sheet-url').prop('disabled', true).text('Saving')
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-gooogle-sheet",
        data: $("#linked-group-setting-form").serialize(),
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        $('.save-google-sheet-url').prop('disabled', false).text('UPDATE')
        loader(false)
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        setTimeout(() => {
            if (response.status == 200) {
                getUpdatedGroupConfig();
                chrome.runtime.sendMessage({
                    'auto_approve_settings_updated': true
                });
                messageToast('success', response.msg)
            } else {
                messageToast('error', response.msg)
            }
        }, 200);
    });
}

function updateAutoresponderPerGroup(groupSettingId, selectedAutoresponderId) {
    loader(true)
    $('.set-autoresponder').prop('disabled', true).text('Saving')
    var eArStatus = 1;
    if ($('#autoresponder_status').is(':checked')) {
        eArStatus = 0;
    }
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "update-autoresponder-per-group",
        data: {
            groupSettingId: groupSettingId,
            selectedAutoresponderId: selectedAutoresponderId,
            groupId: $('#actual-group-id').val(),
            autoresponder_status: eArStatus
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        loader(false)
        $('.set-autoresponder').prop('disabled', false).text('UPDATE')
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        setTimeout(() => {
            if (response.status == 200) {
                getUpdatedGroupConfig();
                chrome.runtime.sendMessage({
                    'auto_approve_settings_updated': true
                });
                messageToast('success', response.msg)
            } else {
                messageToast('error', response.msg)
            }
        }, 200);
    });
}

function abortPrevRequests(calls) {
    calls.forEach(function(r) {
        r.abort();
    });
    requests = [];
}

function getActiveCampaignTags(activeCampaignApiUrl, activeCampaignApiToken) {
    var searchActiveTag = $("#searchActiveTag").val();
    if (searchActiveTag.trim() == "") {
        $('#dispaytagresults').hide();
        $('.displayTagUl').hide();
        return false;
    }
    $.ajax({
        url: activeCampaignApiUrl + '/api/3/tags?search=' + searchActiveTag,
        type: 'GET',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Api-Token', activeCampaignApiToken);
        },
        data: {},
        success: function(response) {
            var tagsLIST = '';
            if (parseInt(response.meta.total) > 0) {
                response.tags.forEach(function(item, index) {
                    tagsLIST += '<li  style="display:block !important" class = "tag-results" tagname="' + item.tag + '" tagid = "' + item.id + '">' + item.tag + '</li>';
                });
                $('#dispaytagresults ul').html(tagsLIST);
                $('#dispaytagresults').show();
                $('.displayTagUl').show();
            } else {
                $('#dispaytagresults ul').html(tagsLIST);
                $('#dispaytagresults').hide();
                $('.displayTagUl').hide();
            }
        },
        error: function() {},
    });
}
// open setting box for autorespondor status 
function openSettingBox(datatarget) {
    let selector = '.autoresponder_settings h5[data-target="#' + datatarget + '"]';
    setTimeout(function() {
        $(selector).click();
    }, 1000)
}
/*------------------------------------function for keap tag show ------------------------------*/
var keapTagsArray = [];
var keapApiUrl = "https://api.infusionsoft.com/crm/rest/v1/tags/";

function getkeapAceessToken(activekeapCompanyId, activekeapApiToken, keapARId) {
    $.ajax({
        type: "POST",
        url: apiBaseUrl + "get-keap-access-token",
        data: {
            id: keapARId,
            keapRefreshToken: activekeapApiToken
        },
        dataType: 'json',
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Authorization', "Bearer " + jwtToken);
            xhr.setRequestHeader('userlanguage', userLang);
        }
    }).done(function(response) {
        if (response.status == 401) {
            triggerLogout();
            return false;
        }
        setTimeout(() => {
            if (response.status == 200) {
                var keapToken = response.token;
                keapAccessToken = keapToken['access_token'];
                keapRefreshToken = keapToken['refresh_token'];
                $('#key').val(keapRefreshToken);
                keapApiUrl = "https://api.infusionsoft.com/crm/rest/v1/tags/";
                getKeapAutoresponderTags();
                //messageToast('success',response.msg)
            } else {
                messageToast('error', response.msg)
            }
        }, 200);
    });
}

function getKeapAutoresponderTags() {
    $.ajax({
        url: keapApiUrl,
        type: 'GET',
        beforeSend: function(xhr) {
            // need aceess token
            xhr.setRequestHeader("Authorization", "Bearer " + keapAccessToken);
        },
        data: {},
        success: function(response) {
            keapTagsArray = $.merge(response.tags, keapTagsArray);
            if (keapTagsArray.length < response.count) {
                keapApiUrl = response.next;
                getKeapAutoresponderTags();
            } else {
                chrome.storage.local.set({
                    'keapTags': keapTagsArray
                });
            }
        },
        error: function() {},
    });
}

function showKeapTags() {
    var searchKeapTag = $("#searchKeapTag").val().toLowerCase();
    if (searchKeapTag.trim() == "") {
        $('#dispayKeaptagresults').hide();
        $('.displayKeapTagUl').hide();
        return false;
    }
    chrome.storage.local.get(["keapTags"], function(result) {
        if (result.keapTags != "undefined" && result.keapTags.length > 0) {
            var KeapTagsLIST = '';
            let tempKeapTags = result.keapTags.filter(function(tag) {
                var tagName = tag.name.toLowerCase();
                return tagName.indexOf(searchKeapTag) >= 0;
            })
            if (tempKeapTags.length > 0) {
                tempKeapTags.forEach(function(item, index) {
                    KeapTagsLIST += '<li  style="display:block !important" class = "keap-tag-results" tagname="' + item.name + '" tagid = "' + item.id + '" title="' + item.name + '">' + item.name + '</li>';
                });
                $('#dispayKeaptagresults ul').html(KeapTagsLIST);
                $('#dispayKeaptagresults').show();
                $('.displayKeapTagUl').show();
            } else {
                $('#dispayKeaptagresults ul').html(KeapTagsLIST);
                $('#dispayKeaptagresults').hide();
                $('.displayKeapTagUl').hide();
            }
        }
    })
}

function groupWelcomeMessagePopup() {
    setTimeout(() => {
        var groupId = $('#actual-group-id').val();
        //console.log(groupId);
        chrome.storage.local.get(["groupConfig"], function(result) {
            var groupConfig = result.groupConfig;
            //console.log(result.groupConfig);
            var groupData = groupConfig.filter(function(details) {
                return details.group_id == groupId;
            })
            if (groupData.length > 0) {
                //console.log(groupData);
                //console.log(groupData[0].welcome_interval)
                $('#welcome_interval').val(groupData[0].welcome_interval);
                $('#welcome_limit').val(groupData[0].welcome_limit);
                $('#welcome_start').val(groupData[0].welcome_start_time);
                $('.welcome-random-row-dynamic').remove();
                /////////// welcome message section /////////////
                if (groupData[0].welcome_message_one != null) {
                    $('#welcomemessageone').val(groupData[0].welcome_message_one);
                    $('.welcomemessageone').text(groupData[0].welcome_message_one);
                }
                if (groupData[0].welcome_message_one == '') {
                    $('#welcomemessageone').val(selected_lang_locale.welcome_message_page.welcome_message_template);
                }
                if (parseInt(groupData[0].welcome_random_status) == 1) {
                    $('#welcome_random_status').prop("checked", true);
                    if (groupData[0].welcome_message_two != null && groupData[0].welcome_message_two != '') {
                        $('.welcome-random-container').append(welcomeRandomMessageHtml);
                        $('.welcome-random-container textarea').eq(1).val(groupData[0].welcome_message_two);
                        $('.welcome-random-container .display-m-text').eq(1).text(groupData[0].welcome_message_two);
                    }
                    if (groupData[0].welcome_message_three != null && groupData[0].welcome_message_three != '') {
                        $('.welcome-random-container').append(welcomeRandomMessageHtml);
                        $('.welcome-random-container textarea').eq(2).val(groupData[0].welcome_message_three);
                        $('.welcome-random-container .display-m-text').eq(2).text(groupData[0].welcome_message_three);
                    }
                    if (groupData[0].welcome_message_four != null && groupData[0].welcome_message_four != '') {
                        $('.welcome-random-container').append(welcomeRandomMessageHtml);
                        $('.welcome-random-container textarea').eq(3).val(groupData[0].welcome_message_four);
                        $('.welcome-random-container .display-m-text').eq(3).text(groupData[0].welcome_message_four);
                    }
                    if (groupData[0].welcome_message_five != null && groupData[0].welcome_message_five != '') {
                        $('.welcome-random-container').append(welcomeRandomMessageHtml);
                        $('.welcome-random-container textarea').eq(4).val(groupData[0].welcome_message_five);
                        $('.welcome-random-container .display-m-text').eq(4).text(groupData[0].welcome_message_five);
                        $('#welcome_message_form  .add-random-message-welcome').hide();
                    }
                } else {
                    $('#welcome_random_status').prop("checked", false);
                    $('.add-random-message-welcome').hide();
                }
            }
        });
    }, 100);
}
async function getCurrentFbGroupId(currenthost, groupId) {
    return new Promise(function(resolve, reject) {

        fetch(currenthost+"/groups/"+groupId,{method: 'GET'}).then(function(response) { return response.text(); }).then(function(data){
            let groupMetaUrl = $(data).filter("meta[property='al:android:url']").attr('content');
            let currentGroupId = groupMetaUrl.split('/group/')[1];
            resolve(currentGroupId);
        });
    });
}
/*------------------------------------end function for keap------------------------------*/