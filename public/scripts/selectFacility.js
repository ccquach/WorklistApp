$(document).ready(function() {
	$("#facility-modal.ui.modal")
		.modal("attach events", ".facility-modal", "show")
		.modal("setting", "closable", false)
	;
});