
function fadeCascade(current_count) {
	if (current_count == 0) {
		audioRecorder.record();
		stepToStep('timer-levels');
	} else {
		$("#"+current_count).fadeIn("slow", function() {
			$("#"+current_count).fadeOut("slow", function() {
				fadeCascade(current_count-1);
			});
		});
	}
}

function startRecordCountdown() {
	stepToStep('record');
	fadeCascade(4);	
}


$(".record-your-story").click(function() {
	startRecordCountdown()
});
