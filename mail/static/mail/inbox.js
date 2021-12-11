
document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Send an email when compose-form is submitted
  document.querySelector('#compose-form').onsubmit = send_email;
      
  // By default, load the inbox
  load_mailbox('inbox');

});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#read-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // fetch emails for whichever mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // for each in emails
    emails.forEach(email => {
      // Create a div for the email 
      const ediv = document.createElement('div');

      // add gray bg if email is read
      if (email.read == true) {
        ediv.className = 'row border rounded p-3 bg-read mailrow';
      }
      else {
        ediv.className = 'row border rounded p-3 mailrow';
      }
      ediv.innerHTML = `<div class="col"><b>${email.subject}</b></div> 
                        <div class="col">From: ${email.sender}</div>
                        <div class="col">${email.timestamp}</div>`;
      
      ediv.addEventListener('click', () => read_email(email.id));

      // Add new div to mailbox
      document.querySelector('#emails-view').append(ediv);
    });
});
}

function send_email(event) {

  // prevent default POSTing of form, then send email
  event.preventDefault();
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: document.querySelector('#compose-recipients').value,
      subject: document.querySelector('#compose-subject').value,
      body: document.querySelector('#compose-body').value
    })
  })
    .then(response => response.json())
    .then(result => {
      // show alert if email not sent, otherwise load sent box
      if (result.message == undefined){
        alert(result.error);
      }
      else {
        load_mailbox('sent');
      }
    });
  return false;
}

function read_email(id) {

  // Show the email and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#read-view').style.display = 'block';

  // show the Archive/ Reply buttons if setbutton() has previously hidden them
  document.querySelector('#msgbttn').style.display = "inline";

  // fetch email with this id
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    // Display email
    document.querySelector('#one-email').innerHTML =
      `<h3>subject: ${email.subject}</h3><br>
      <b>from:</b> ${email.sender}<br>
      <b>to:</b> ${email.recipients}<br>
      <b>time: </b>${email.timestamp}<br><br>
      <pre>${email.body}</pre>`

      // set the display and function of archive/inbox button
      setbutton(email);

      // when reply button is clicked, reply() passing in this email
      document.querySelector('#reply').addEventListener('click', () => reply(email));
  });

  // mark this email as read
  fetch(`/emails/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function setbutton(email) {
  // the 'archive' or 'move to inbox' button
  const switchbtn = document.querySelector('#moveto');
  // this user's email address
  const usere = document.querySelector('#user').dataset.user;

  // If this user is the sender (e.g. email is in Sent box) hide the buttons
  if (usere === email.sender){
    document.querySelector("#msgbttn").style.display = 'none';
  }

  if (email.archived == true) {
    // when clicked, un-archive email
    switchbtn.innerHTML = 'Move to Inbox';
    switchbtn.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      })
      // after fetch finished, refresh inbox
      .then(() => location.reload());
    })
  }
  else {
    // when clicked, archive email
    switchbtn.innerHTML = 'Archive';
    switchbtn.addEventListener('click', () => {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      })
      // after fetch finished, refresh inbox
      .then(() => location.reload());
    })
  }
}

function reply(email) {
    // Show compose view and hide other views
    document.querySelector('#emails-view').style.display = 'none';
    document.querySelector('#compose-view').style.display = 'block';
    document.querySelector('#read-view').style.display = 'none';
  
    // prefill composition fields with previous email's content
    document.querySelector('#compose-recipients').value = email.sender;
    document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote: ${email.body}`;

    // if the previous email already starts with 'Re:' don't change the subject
    const prefix = email.subject.slice(0, 3);
    if (prefix == 'Re:'){
      document.querySelector('#compose-subject').value = email.subject;
    }
    // otherwise make the subject 'Re: subject'
    else {
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`;
    }
}