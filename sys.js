function refreshMessages() {
    if ($("#stream_page").hasClass("active"))
	$("#messages").load("stream_messages.php");
}

function refreshDirect() {
	if ($("#contacts_page").hasClass("active") && !$(".contacts_sidebar li a").first().hasClass("active"))	$("#direct_messages").load($(".contacts_sidebar .active").attr("href"));
}

function refreshContacts() {
    if ($("#contacts_page").hasClass("active") && $(".contacts_sidebar li a").first().hasClass("active")) {
	$.get("contacts.php", function(data, status){
        $(".contacts_sidebar li").slice(1).remove();
        $(".contacts_sidebar ul").append(data);
    });

	$(".contacts").load("pending_contacts.php");

    }
}

function randomString(length) {
	var chars = '0123456789abcdefghijklmnopqrstuvwxyz';
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

$(document).ready(function(){

    setInterval(function(){ refreshMessages();refreshDirect();refreshContacts();}, 5000);

    $("input[name=demo_login]").click(function(e){
    	$("#login_form").find("input[name=password]").val("Demo");
		$("#login_form").find("input[name=username]").val("Demo");
		$("#login_form").submit();
    });

	$("input[name=demo_register]").click(function(e){
		var randomUsername = randomString(6);
		var randomEmail = randomUsername + "@example.com";
    	$("#register_form").find("input[name=username]").val(randomUsername);
    	$("#register_form").find("input[name=email]").val(randomEmail);
		$("#register_form").find("input[name=password]").val(randomUsername).attr("type", "text");
    });

	$("#contact_form").submit(function(e){
		e.preventDefault();
		if ($(this).find("input[type=text]").val().trim().length) {
		$.post($(this).attr("action"), $(this).serialize(),
    function(result){

		if (result == "1" || result==1) {
		$("#contact_feedback").text("Success");
		refreshContacts();
		} else {
			$("#contact_feedback").html(result).show();
		}
		$("#contact_form")[0].reset();
    });
		} else $("#contact_feedback").text("Empty Submission").show();

	return false;
    });

    $("#login_form").submit(function(e){
		e.preventDefault();
		$(this).find("input[type=submit]").attr("disabled", true);
		$.post($(this).attr("action"), $(this).serialize(),
    function(result){


		if (result == "1" || result==1) {
        $("#profile_page").text($("#login_form").find("input[name=username]").val());
		$(".login, .loggedout").remove();
        $(".header .active").removeClass("active");
        $("#stream_page").addClass("active");
		$("#messages, .home, .post, .loggedin").show();
		refreshContacts();
		refreshMessages();

		} else {
			$("#login_feedback").html(result).show();
		}
		$("#login_form").find("input[type=submit]").attr("disabled", false);
    });
	return false;
    });


	$("#register_form").submit(function(e){
		e.preventDefault();
		$(this).find("input[type=submit]").attr("disabled", true);

		$.post($(this).attr("action"), $(this).serialize(),
    function(result){
		if (result == "1" || result==1) {
			$("#login_form").find("input[name=password]").val($("#register_form").find("input[name=password]").val());
			$("#login_form").find("input[name=username]").val($("#register_form").find("input[name=username]").val());
			$("#login_form").submit();
		} else {

		$("#register_form").find("input[type=submit]").attr("disabled", false);
			$("#register_feedback").html(result).show();
		}
    });
	return false;
    });

	$("#direct_form").submit(function(e) {
		e.preventDefault();

		if ($(this).find("input[type=text]").val().trim().length || $(this).find("input[type=file]")[0].files.length) {
$(this).find("input[type=submit]").attr("disabled", true);
$("#direct_loading").show();

    var formData = new FormData($(this)[0]);



	$.ajax({
        url: $(this).attr("action"),
        type: 'POST',
        data: formData,
        success: function (data) {
			$("#direct_loading").hide();
            if (data == "1" || data==1) {
				$("#direct_form")[0].reset();
				refreshMessages();
				refreshDirect();
			$("#direct_form .post_feedback").hide();
		} else {
			$("#direct_form .post_feedback").html(data).show();
		}
		$("#direct_form").find("input[type=submit]").attr("disabled", false);
        },
        cache: false,
        contentType: false,
        processData: false
    });

		} else {
			$(this).find(".post_feedback").text("Empty Submission").show();
		}
		return false;
	});

	$("#stream_form").submit(function(e) {
		e.preventDefault();

		if ($(this).find("input[type=text]").val().trim().length || $(this).find("input[type=file]")[0].files.length) {
$(this).find("input[type=submit]").attr("disabled", true);
$("#stream_loading").show();
    var formData = new FormData($(this)[0]);

	$.ajax({
        url: $(this).attr("action"),
        type: 'POST',
        data: formData,
        success: function (data) {
			$("#stream_loading").hide();
            if (data == "1" || data==1) {
				$("#stream_form")[0].reset();
				refreshMessages();
				refreshDirect();
			$("#stream_form .post_feedback").hide();
		} else {
			$("#stream_form .post_feedback").html(data).show();
		}
		$("#stream_form").find("input[type=submit]").attr("disabled", false);
        },
        cache: false,
        contentType: false,
        processData: false
    });

		} else {
			$(this).find(".post_feedback").text("Empty Submission").show();
		}
		return false;
	});


	$(".contacts").on("click", ".contact_request", function(e){
		e.preventDefault();
        $.get($(this).attr("href"), function(data, status){
        if (data == "1" || data==1) {
			//reload contacts
			//location.reload();
			refreshContacts();
		} else {
			alert(data);
		}
    });
	return false;
    });

	$("#messages").on("click", ".message_delete, .message_contact", function(e){
		e.preventDefault();
        $.get($(this).attr("href"), function(data, status){
        if (data == "1" || data==1) {
			refreshMessages();
		} else {
			alert(data);
		}
    });
	return false;
    });


	$("#direct_messages").on("click", ".message_delete, .message_contact", function(e){
		e.preventDefault();
        $.get($(this).attr("href"), function(data, status){
        if (data == "1" || data==1) {
			refreshDirect();
		} else {
			alert(data);
		}
    });
	return false;
    });

$("#about_page").click(function(e){
    e.preventDefault();
    $(".header .active").removeClass("active");
    $(this).addClass("active");
    $(".about").show();
    $(".login").hide();
});

$("#login_page, #get_started").click(function(e){
    e.preventDefault();
    $(".header .active").removeClass("active");
    $("#login_page").addClass("active");
    $(".about").hide();
    $(".login").show();
});

$("#contacts_page").click(function(e){
	e.preventDefault();
	$(".header .active").removeClass("active");
	$(this).addClass("active");
    refreshDirect();
    refreshContacts();
    $("#messages, .home, .post").hide();
	$("#direct").show();
});

$("#stream_page").click(function(e){
	e.preventDefault();
	$(".header .active").removeClass("active");
	$(this).addClass("active");
    refreshMessages();
	$("#head_title").text("Stream");
	$(".home p").empty();
    $("#messages, .home, .post").show();
	$("#direct").hide();
});


$("#groups_page").click(function(e){
	e.preventDefault();
	$(".header .active").removeClass("active");
	$(this).addClass("active");
	$("#head_title").text("Groups");
	$(".home p").text("Coming soon");
    $(".home").show();
	$("#messages, #direct, .post").hide();
});

$(".contacts_sidebar").on("click", "a", function(e){
	e.preventDefault();
	if ($(this).attr("href")=="#") {
		$(".network").show();
		$(".direct_post, #direct_messages").hide();
	} else {
		$(".network").hide();
		$(".direct_post, #direct_messages").show();
		$($(this).attr("target")).load($(this).attr("href"));
		$("#direct_form").attr("action","post.php?dest="+$(this).attr("user_id"));
	}

	$("h1.direct_title").text($(this).text());

	$(".contacts_sidebar .active").removeClass("active");
	$(this).addClass("active");

	return false;
});
/*
$("a#direct_refresh").click(function(e){
	e.preventDefault();
	refreshDirect();
	return false;
});

$("a#stream_refresh").click(function(e){
	e.preventDefault();
	refreshMessages();
});
*/
});

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-80233316-1', 'auto');
  ga('send', 'pageview');
