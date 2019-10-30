<!doctype html>
<html>
<head>
<!--
Created by Robert Victoreen
robert.victoreen.co
-->
<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
<script src="/sys.js"></script>
<meta charset="UTF-8">
<title>Conscenery</title>
    <meta name="description" content="">
    <link rel="icon" type="image/x-icon"
 href="//robert.victoreen.co/favicon.png" />
<link href="https://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css">
<link rel="stylesheet" href="/main.css"/>
<style type="text/css">

#direct, .login <?php
   if ($loggedout==0){
	  echo ", .about, .loggedout";
   } else {
	   echo ", .home, .post, #messages, .loggedin";
   }

?>{
	display:none;
}

</style>
</head>

<body>
<div class="container">
<div class="header">
<ul>
  <li class="loggedout"><a id="about_page"<?php if ($loggedout==1){?> class="active"<?php } ?> href="#">About</a></li>
  <li class="loggedout"><a id="login_page" href="#">Conscenery</a></li>
  <li class="loggedin"><a id="stream_page"<?php if ($loggedout==0){?> class="active"<?php } ?> href="#">Stream</a></li>
      <li class="loggedin"><a id="contacts_page" href="#">Contacts</a></li>
    <!--  <li><a id="groups_page" href="#">Groups</a></li>-->
      <li style="float:right" class="loggedout"><a href="https://www.linkedin.com/in/robertvictoreen/" target="_blank">Created by Robert</a></li>
      <li style="float:right" class="loggedin"><a href="logout.php">Logout</a></li>
      <li style="float:right" class="loggedin"><a id="profile_page" href="#"><?php if (isset($login_session)) echo $login_session; ?></a></li>
</ul>
</div>
  <div class="content">
    <div class="about">
    <h1>Welcome to Conscenery!</h1>
    <p>Conscenery is a simple, lightweight messaging and sharing service.<p>
    <p>Users set an expiry date for each and every message to prevent an extensive digital history.</p>
    <input id="get_started" type="button" value="Get Started" />
    <h2>Video Demonstration</h2>
    <p><iframe src="https://drive.google.com/file/d/1tkVcJ23TGjfQLTD2U03F57XfrgldkcDE/preview" width="640" height="480"></iframe></p>
    </div>
    <div class="login">
    <h1>Login</h1>
    <form id="login_form" action="login.php" method="post" enctype="multipart/form-data">
     <p>
      <input type="text" name="username" placeholder="Username"/>
    </p>
    <p>
      <input type="password" name="password" placeholder="Password" />
    </p>
    <p id="login_feedback"></p>
    <p>
      <input type="submit" name="submit" value="Login" />
      <input type="button" name="demo_login" value="Demo Account Login" />
    </p>
    </form>
    <h1>New User?</h1>
    <h3>3 Step Registration</h3>
    <form id="register_form" action="register.php" method="post" enctype="multipart/form-data">
     <p>
      <input type="text" name="username" placeholder="Username"/>
    </p>
    <p>
    <input type="text" name="email" placeholder="Email"/>
    </p>
    <p>
      <input type="password" name="password" placeholder="Password" />
    </p>
    <p id="register_feedback"></p>
    <p>
      <input type="submit" name="submit" value="Register" />
      <input type="button" name="demo_register" value="Generate Demo Account" />
    </p>
    </form>
    </div>
    <div class="home">
    <h1 id="head_title">Stream</h1>
    <p></p>
    </div>

  <div class="messages" id="messages">


  <?php
  if ($loggedout==0){
	  include "stream_messages.php";
  }
  ?>

 </div>

      <div class="post">
      <p><!--<a id="stream_refresh" href="#">Refresh messages</a>--></p>
        <h3>New Message
      to  Stream (All Contacts)</h3>
      <form action="post.php" method="post" enctype="multipart/form-data" id="stream_form">
        <p>
          <input type="text" name="text" placeholder="Text"/>
        </p>
        <!--<p class="tooltip">
          <label for="upload">Media:</label>
          <input type="file" name="upload"/>
           <span class="tooltiptext">Up to 50MB: jpg, png, gif, webm, zip, pdf</span>
        </p>--><p class="tooltip"><label for="time_selection">Time Limit:</label>
      <select name="time_selection">
        <option value="1">30mins</option>
        <option value="2">1 hour</option>
        <option value="3">6 hours</option>
        <option value="4">12 hours</option>
        <option value="5">24 hours</option>
        <option selected="selected" value="6">48 hours</option>
      </select>
      <span class="tooltiptext">All posts have an expiry date, to ensure relevancy.</span></p>
      <p class="post_feedback"></p>
        <p>
        <img id="stream_loading" src="ajax-loader.gif" alt="Loading...">
          <input type="submit" name="submit" value="Post" />
        </p>
      </form>
  </div>

    <!-- end .content --></div>


      <div class="split_content">

  <div id="direct">
<div class="contacts_sidebar">
<ul>
  <li><a class="active" href="#" target=".network">Manage Contacts</a></li>
</ul>
</div>

<div class="direct_content">
<div class="direct_container">
<h1 class="direct_title">Manage Contacts</h1>
<div id="direct_messages"></div>
<div class="direct_post">
<p><!--<a id="direct_refresh" href="#">Refresh messages</a>--></p>
        <h3>New Message</h3>
      <form action="post.php" method="post" enctype="multipart/form-data" id="direct_form">
        <p>
          <input type="text" name="text" placeholder="Text"/>
        </p>
        <!--<p>
          <label for="upload">Media:</label>
          <input type="file" name="upload"/>
        </p>--><p class="tooltip"><label for="time_selection">Time Limit:</label>
      <select name="time_selection">
        <option value="1">30mins</option>
        <option value="2">1 hour</option>
        <option value="3">6 hours</option>
        <option value="4">12 hours</option>
        <option value="5">24 hours</option>
        <option selected="selected" value="6">48 hours</option>
      </select>
      <span class="tooltiptext">All posts have an expiry date to ensure relevancy.</span></p>
      <p class="post_feedback"></p>
        <p>
        <img id="direct_loading" src="ajax-loader.gif" alt="Loading...">
          <input type="submit" name="submit" value="Post" />
        </p>
      </form>
  </div>
 <div class="network">

  <div class="contacts">
  </div>
  <div>
   <h1>Add Contact</h1>
    <form id="contact_form" action="contact.php" method="post" enctype="multipart/form-data">
     <p>
      <input type="text" name="user" placeholder="Username"/>
    </p>
    <p id="contact_feedback"></p>
    <p>
      <input type="submit" name="submit" value="Send request" />
    </p>
    </form>
    </div>
  </div>
  </div>
  </div>
</div>
</div>
</div>
</body>
</html>