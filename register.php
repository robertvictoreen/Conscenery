 <?php

 if($_SERVER["REQUEST_METHOD"] == "POST") {
if (isset($_POST["username"])&&isset($_POST["email"])&&isset($_POST["password"])){

	if (!ctype_alnum($_POST["username"])){
		exit("Username must be alphanumeric");
	}

	if (!ctype_alnum($_POST["password"])){
		exit("Password must be alphanumeric");
	}

	if (!filter_var($_POST["email"], FILTER_VALIDATE_EMAIL)) {
 	 exit("Not a valid email address");
	}


	if ((strlen($_POST["username"]) > 30) || (strlen($_POST["email"]) > 30) || (strlen($_POST["password"]) > 30)){
		  exit("Length exceeded");
	  } else if ((strlen($_POST["username"]) < 6) || (strlen($_POST["password"]) < 6)){
		  exit("Username and password must be at least 6 characters.");
	  }


	include("config.php");

	$user_check = mysqli_real_escape_string($db,filter_var($_POST["username"], FILTER_SANITIZE_STRING));
	$email_check = mysqli_real_escape_string($db,filter_var(strtolower($_POST["email"]), FILTER_SANITIZE_EMAIL));

   $ses_sql = mysqli_query($db,"SELECT * FROM USERS WHERE USERNAME = '$user_check' or EMAIL='$email_check';");

   if (!$ses_sql) {
    die(mysqli_error($db));
} else if (mysqli_num_rows($ses_sql) != 0) die("Username/Email already registered");

	$password = mysqli_real_escape_string($db,filter_var($_POST["password"], FILTER_SANITIZE_STRING));

	$hash = password_hash($password, PASSWORD_DEFAULT);

	$timestamp = date('Y-m-d G:i:s');

$sql = "INSERT INTO USERS (USERNAME, EMAIL, PASSWORD, ACTIVE, JOINED) VALUES ('$user_check', '$email_check', '$hash', '$timestamp', '$timestamp');";

if (mysqli_query($db,$sql)) {


	if ($ses_sql = mysqli_query($db,"SELECT ID FROM USERS WHERE USERNAME = '$user_check';")){

	$data = mysqli_fetch_array($ses_sql,MYSQLI_ASSOC);

	$sql = "INSERT INTO NETWORK (USER1, USER2, STATUS) VALUES ('".$data["ID"]."', '9', '0');";
		  if (!mysqli_query($db,$sql)) {
			  die(mysqli_error($db));
		  }
	}

	//exit("Success, Proceed to login above.\nUsername: ".$user_check."\nPassword: <span class=\"spoiler\">".$password."</span>");
	exit("1");
} else die(mysqli_error($db));

}
 }

?>