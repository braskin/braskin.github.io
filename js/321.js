$(".record-your-story").click(function() 
	{
	$("#info").css("display","none");
	$("#record").css("display","block");
	$(".countdown > div").css("display","block");
	$("#1").hide();
	$("#2").hide();
	$("#3").hide();

	$("#3").fadeIn("slow");
	$("#3").fadeOut("slow", function() 
		{
			$("#2").fadeIn("slow");
			$("#2").fadeOut("slow", function () 
			{
				$("#1").fadeIn("slow");
				$("#1").fadeOut("slow" , function () 
				{

				}); 
			});
		});
	});