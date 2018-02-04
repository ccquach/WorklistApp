$(document).ready(function() {
	copyToClipboard();	
});

function copyToClipboard() {
	const targets = document.querySelectorAll(".copy-target");
	for(var i = 0; i < targets.length; i++) {
		const target = targets[i];
		target.onclick = function() {
		  document.execCommand("copy");
		}

		target.addEventListener("copy", function(event) {
		  event.preventDefault();
		  if (event.clipboardData) {
		    event.clipboardData.setData("text/plain", target.textContent);
		    // console.log(event.clipboardData.getData("text"));
		    $(this).parent().find("span.hide").css("display", "inline").fadeOut(1800);
		  }
		});
	}
}