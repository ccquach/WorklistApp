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
	$(".delete-modal-button").each(function() {
		var id = $(this).attr("id");
		var modal = $(this).siblings("div");
		modal.modal("attach events", "#" + id, "show");
	});
	$(".ok.button").on("click", function() {
		$(this).find("form").submit();
	});
});