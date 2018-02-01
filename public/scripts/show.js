$(document).ready(function() {
	// collapsible comment box
	$(".ui.accordion").accordion();

	// delete confirmation
	$(".ui.modal").modal("attach events", ".delete-modal", "show");
	$(".ok.button").on("click", function() {
		$(this).find("form").submit();
	});

	// section navigation
	$("#commercial-section").hide();
	$("#medical-section").hide();
	$("#log-section").hide();
	showActiveSection();
});

function showActiveSection() {
	var menu = $(".ui.secondary.pointing.menu a");
	for(var i = 0; i < menu.length; i++) {
		$(menu[i]).on("click", function() {
			for(var j = 0; j < menu.length; j++) {
				$(menu[j]).removeClass("active");
			}
			// highlight active menu item
			$(this).addClass("active");

			// hide sections
			$("#patient-section").hide();
			$("#commercial-section").hide();
			$("#medical-section").hide();
			$("#log-section").hide();
			// show selected section
			switch($(this).text()) {
				case "Patient":
					$("#patient-section").show();
					break;
				case "Commercial":
					$("#commercial-section").show();
					break;
				case "Medi-cal":
					$("#medical-section").show();
					break;
				case "Communication Log":
					$("#log-section").show();
					break;
				default:
					break;
			}
		});
	}
}