const ipcRenderer = require('electron').ipcRenderer;

function sendForm(event) {
  event.preventDefault(); // stop the form from submitting
  let username = document.getElementById("username").value;
  let password = document.getElementById("password").value;
  let content = document.getElementById("content").value;
  let data = {
    username: username,
    password: password,
    content: content
  };

  ipcRenderer.send('form-poc', data);
}


ipcRenderer.on('signed-msg', function (event, data) {
  var s_msg = data.s_msg;
  document.getElementById("content").value = s_msg;
});
