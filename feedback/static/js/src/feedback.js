/* Javascript for FeedbackXBlock. */
// Work-around so we can log in edx-platform, but not fail in Workbench
if (typeof Logger === 'undefined') {
    var Logger = {
        log: function(a, b) { 
	    console.log(JSON.stringify(a)+"/"+JSON.stringify(a));
	}
    };
}

function FeedbackXBlock(runtime, element) {
    function likert_vote() {
	var vote = 0;
	if ($(".feedback_radio:checked", element).length === 0) {
	    vote = -1;
	} else {
	    vote = parseInt($(".feedback_radio:checked", element).attr("data-id").split("_")[1]);
	}
	return vote;
    }

    function feedback() {
	return $(".feedback_freeform_area", element).val();
    }

    function submit_feedback(freeform, vote) {
	var feedback = {};
	if(freeform) {
	    feedback['freeform'] = freeform;
	}
	if(vote != -1) {
	    feedback['vote'] = vote;
	}

	Logger.log("edx.feedbackxblock.submitted", feedback);
	$.ajax({
            type: "POST",
            url: runtime.handlerUrl(element, 'feedback'),
            data: JSON.stringify(feedback),
	    success: function(data) {
		$('.feedback_thank_you', element).text("");
		$('.feedback_thank_you', element).text(data.response);
	    }
        });
    }

    $(".feedback_submit_feedback", element).click(function(eventObject) {
	submit_feedback(feedback(), -1);
    });

    $('.feedback_radio', element).change(function(eventObject) {
	Logger.log("edx.feedbackxblock.likert_changed", {"vote":likert_vote()});
	submit_feedback(false, likert_vote());
    });

    $('.feedback_freeform_area', element).change(function(eventObject) {
	Logger.log("edx.feedbackxblock.freeform_changed", {"freeform":feedback()});
    });

    function getStatus() {
        $.ajax({
            type: 'POST',
            url: runtime.handlerUrl(element, 'get_export_status'),
            data: '{}',
            success: updateStatus,
            dataType: 'json'
        });
    }

    var exportStatus = {};
    function updateStatus(newStatus) {
        var statusChanged = ! _.isEqual(newStatus, exportStatus);
        exportStatus = newStatus;
        if (exportStatus.export_pending) {
            // Keep polling for status updates when an export is running.
            setTimeout(getStatus, 1000);
        }
        else {
            if (statusChanged) {
                if (newStatus.last_export_result.error) {
                    $('.error-message').text("Error: " + newStatus.last_export_result.error);
                    $('.error-message').show();
                } else {
                    $(".download-feedback-results-button").attr('disabled', false);
                    $('.error-message').hide()
                }
            }
        }
    }

    var csv_export_url = runtime.handlerUrl(element, 'csv_export')
	function exportCsv() {
        $.ajax({
            type: "POST",
            url: csv_export_url,
            data: JSON.stringify({}),
            success: updateStatus
        });
    };

    function downloadCsv() {
        window.location = exportStatus.download_url;
    };

    $(".export-feedback-results-button", element).click(function(eventObject) {
		exportCsv();
    });
    $(".download-feedback-results-button", element).click(function(eventObject) {
		downloadCsv();
    });
}
