$(document).ready(function() {
	$(".phone").on("keypress", function() {
		formatPhoneNumber($(this));
	});
});

function formatPhoneNumber(s) {
	var s2 = ("" + s.val()).replace(/\D/g, "");
	var size = s2.length;
	if(size === 0) {
		return s.val(s2);
	} else if(size < 3) {
		return s.val("(" + s2);
	} else if(size < 6) {
		return s.val("(" + s2.substring(0,3) + ") " + s2.substring(3,6));
	} else if(size < 10) {
		return s.val("(" + s2.substring(0,3) + ") " + s2.substring(3,6) + "-" + s2.substring(6,10));
	} else {
		return s.val("(" + s2.substring(0,3) + ") " + s2.substring(3,6) + "-" + s2.substring(6,10) + " x" + s2.substring(10,));
	}
}