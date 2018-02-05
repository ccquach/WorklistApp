$(document).ready(function() {
	$(".ui.modal")
		.modal("attach events", ".facility-modal", "show")
		.modal("setting", "closable", false)
	;
});