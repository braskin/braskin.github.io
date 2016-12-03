$(".button").click(function() 
	{
	$(".original").css("display","none");
	$(".new > div").css("display","block");
	$("#1").hide();
	$("#2").hide();
	$("#3").hide();
	$("#1").fadeIn("slow");
	$("#1").fadeOut("slow", function() {
			$("#2").fadeIn("slow");
			$("#2").fadeOut("slow", function () {
				$("#3").fadeIn("slow");
				$("#3").fadeOut("slow" , function () {
					audioRecorder.record();
				}); 

				});
			});
});

audioRecorder.record();