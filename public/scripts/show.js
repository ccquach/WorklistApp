function setActiveItem() {
	$("div.secondary.menu > a").on("click", function() {
		$("a").removeClass("active");
		$(this).addClass("active");
	});
}