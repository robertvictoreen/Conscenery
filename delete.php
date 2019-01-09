<?php
   require_once("session.php");

   if ($loggedout == 0) {

   if (isset($_GET["id"])) {


	     $query = "SELECT * FROM MESSAGES WHERE ID='".mysqli_real_escape_string($db,$_GET["id"])."';";

		 if ($result = mysqli_query($db, $query)) {

			 $data = mysqli_fetch_array($result,MYSQLI_ASSOC);

			 if ($data["SRC_ID"] == $user_id) {

				 if ($data["FILE"] != NULL ){
					 unlink("./uploads/".$data["FILE"]);
				 }


				 //message sent by user

				 // sql to delete a record
$sql = "DELETE FROM MESSAGES WHERE ID='".mysqli_real_escape_string($db,$_GET["id"])."';";

if (mysqli_query($db, $sql)) {
   exit("1");
} else {
    die("Error deleting record: " . mysqli_error($db));
}

			 }

		 }

   }
   }
?>