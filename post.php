<?php
   require_once("session.php");

   function folderSize ($dir)
{
    $size = 0;
    foreach (glob(rtrim($dir, '/').'/*', GLOB_NOSORT) as $each) {
        $size += is_file($each) ? filesize($each) : folderSize($each);
    }
    return $size;
}

   if($_SERVER["REQUEST_METHOD"] == "POST") {
$uploadOk = 0;
if (isset($_FILES['upload']) && file_exists($_FILES['upload']['tmp_name']) && is_uploaded_file($_FILES['upload']['tmp_name']))  {
    if (folderSize("./uploads/") > 25000000000) die("File uploading disabled temporarily.");
try {
	if ($user_status != "1") {

    // Undefined | Multiple Files | $_FILES Corruption Attack
    // If this request falls under any of them, treat it invalid.
    if (
        !isset($_FILES['upload']['error']) ||
        is_array($_FILES['upload']['error'])
    ) {
        throw new RuntimeException('Invalid parameters.');
    }

    // Check $_FILES['upfile']['error'] value.
    switch ($_FILES['upload']['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new RuntimeException('No file sent.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            throw new RuntimeException('Exceeded filesize limit.');
        default:
            throw new RuntimeException('Unknown errors.');
    }

    // You should also check filesize here.
    if ($_FILES['upload']['size'] > 50000000) {
        throw new RuntimeException('Exceeded filesize limit.');
    }

    // DO NOT TRUST $_FILES['upfile']['mime'] VALUE !!
    // Check MIME Type by yourself.
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    if (false === $ext = array_search(
        $finfo->file($_FILES['upload']['tmp_name']),
        array(
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
			'webm' => 'video/webm',
			'zip' => 'application/zip',
			'pdf' => 'application/pdf'
        ),
        true
    )) {
        throw new RuntimeException('Invalid file format.');
	}

    // You should name it uniquely.
    // DO NOT USE $_FILES['upfile']['name'] WITHOUT ANY VALIDATION !!
    // On this example, obtain safe unique name from its binary data.
	} else {
		$ext = pathinfo($_FILES['upload']['name'], PATHINFO_EXTENSION);
	}
	$target = sprintf('./uploads/%s.%s',
            sha1_file($_FILES['upload']['tmp_name']),
            $ext);

    if (!move_uploaded_file(
        $_FILES['upload']['tmp_name'],$target
    )) {
        throw new RuntimeException('Failed to move uploaded file.');
    }

$uploadOk = 1;

} catch (RuntimeException $e) {
$uploadOk = 0;
    exit( $e->getMessage());

}

}

	  if (!isset($_POST['text'])){
        die("Text required");
    }
      $url = '@(http)?(s)?(://)?(([a-zA-Z])([-\w]+\.)+([^\s\.]+[^\s]*)+[^,.\s])@';
$string = preg_replace($url, '<a href="http$2://$4" target="_blank" title="$0">$0</a>', filter_var($_POST['text'], FILTER_SANITIZE_STRING));

	  $text = mysqli_real_escape_string($db,$string);


	  if (strlen($text) > 500){
		  exit("Length exceeded");
	  }

      if (!isset($_POST['time_selection'])){
        die("Time required");
    }

	  switch ($_POST["time_selection"]) {
      case "1":  $expiry  =  date('Y-m-d G:i:s', strtotime("+30 minutes")); break;
	  case "3": $expiry  =  date('Y-m-d G:i:s', strtotime("+6 hours"));break;
	  case "4": $expiry  =  date('Y-m-d G:i:s', strtotime("+12 hours"));break;
	  case "5":$expiry  =  date('Y-m-d G:i:s', strtotime("+24 hours"));break;
	  case "6":$expiry  =  date('Y-m-d G:i:s', strtotime("+48 hours"));break;
	  default: $expiry  =  date('Y-m-d G:i:s', strtotime("+1 hour"));

	  }

	  $timestamp = date('Y-m-d G:i:s');

	  $filetype = NULL;
	  $dest=NULL;
	  if (isset($_GET["dest"])){
		  $dest = mysqli_real_escape_string($db,$_GET["dest"]);
	  }


      if ($uploadOk ==1) {
		  $filesize = $_FILES['upload']['size'];
		  $filename = basename($target);
	  $original = mysqli_real_escape_string($db,basename( $_FILES["upload"]["name"]));
		  if (strtolower($ext) == "png" || strtolower($ext) == "jpg" || strtolower($ext) == "gif") {
			  $filetype = 1;
		  } else if (strtolower($ext) == "webm") {
			  $filetype = 2;
		  } else {
			  $filetype = 0;
		  }

   //   $sql = "INSERT INTO `conscenery`.`MESSAGES` (`SRC_ID`, `DEST_ID`, `STREAM`, `LIST`, `CONTENT`, `LINKED_URL`, `FILE`,`ORIGINAL`, `FILESIZE`, `FILETYPE`, `POST_TIME`, `EXPIRY_TIME`, `STATUS`) VALUES ('$user_id', NULL, '0', NULL, '$text', '$url', '$filename', '$original', '$filesize', '$filetype', CURRENT_TIMESTAMP, '$tomorrow', '0');";
	  if ($dest) {
		  $sql = "INSERT INTO MESSAGES (SRC_ID, DEST_ID, CONTENT, FILE, ORIGINAL, FILESIZE, FILETYPE, POST_TIME, EXPIRY_TIME) VALUES ('$user_id', '$dest', '$text', '$filename', '$original', '$filesize', '$filetype', '$timestamp', '$expiry');";
	  } else {
	  $sql = "INSERT INTO MESSAGES (SRC_ID, STREAM, CONTENT, FILE, ORIGINAL, FILESIZE, FILETYPE, POST_TIME, EXPIRY_TIME) VALUES ('$user_id', '1', '$text', '$filename', '$original', '$filesize', '$filetype', '$timestamp', '$expiry');";
	  }
	  } else {
		  if ($dest){
			  $sql = "INSERT INTO MESSAGES (SRC_ID, DEST_ID, CONTENT, POST_TIME, EXPIRY_TIME) VALUES ('$user_id', '$dest', '$text', '$timestamp', '$expiry');";
		  } else {
		  $sql = "INSERT INTO MESSAGES (SRC_ID, STREAM, CONTENT, POST_TIME, EXPIRY_TIME) VALUES ('$user_id', '1', '$text', '$timestamp', '$expiry');";
		  }

	  }

     $result = mysqli_query($db,$sql);

if (!$result){
	  die( "Error: " . mysqli_error($db));
}
exit("1");


   }

?>