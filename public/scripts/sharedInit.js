$(document).ready(function() {
	// dropdown menu
	$("select.dropdown").dropdown({
		placeholder: "Select one"
	});

	// collapsible comment box
	$(".ui.accordion")
		.accordion()
		.accordion({ "exclusive": false })
	;

	// delete confirmation
	$("#delete-modal.ui.modal").modal("attach events", ".delete-modal", "show");
	$(".ok.button").on("click", function() {
		$(this).find("form").submit();
	});
});