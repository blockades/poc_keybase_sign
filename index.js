"use script";
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const url = require('url');
const login = require('keybase-login').login;
const request = require('request');
const kbpgp = require('kbpgp');
const purepack = require('purepack');
const {encode} = require('pgp-utils').armor;
const {encrypt, decrypt} = require('triplesec');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

function hex2bin(hex)
{
  return new Buffer(hex, "hex");
}

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({width: 800, height: 600});

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}
//
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});


ipcMain.on('form-poc', function (event, data) {
  var username = data.username;
  var password = data.password;
  var content = data.content;
  login({username : username, passphrase : password}, function(err, res) {
    const cookies = res.cookies;
    var j = request.jar();
    for (var cookie of cookies) {
      j.setCookie(request.cookie(cookie), 'https://keybase.io');

    }
    request({
      url: 'https://keybase.io/_/api/1.0/user/lookup.json',
      qs: {usernames: username},
      jar: j
    }, function (err, res, body) {
      body = JSON.parse(body);
      key_id = body.them[0].public_keys.primary.kid;

      request({
        url: 'https://keybase.io/_/api/1.0/key/fetch.json',
        qs: {kids: key_id, cookies: cookies, ops: 8},
        jar: j
      }, function (err, res, body) {
        body = JSON.parse(body);
        var priv_key = body.keys[0].bundle;
        buffer = Buffer.from(priv_key, 'base64');
        obj = purepack.unpack(buffer);
        enc_key = obj.body.priv.data;
        key = decrypt({ key: Buffer.from(password, 'utf8'), data : enc_key }, function(err, key) {
          console.log(err);
          key = encode({header: {comment : "none", version : "0" } }, "PRIVATE KEY BLOCK", key);
          kbpgp.KeyManager.import_from_armored_pgp({
            armored: key
          }, function(err, user) {
            if (!err) {
              if (user.is_pgp_locked()) {
                user.unlock_pgp({
                  passphrase: password
                }, function(err) {
                  if (!err) {
                    console.log("Loaded private key with passphrase");
                  }
                  else {
                    console.log('error armored', err);
                    return;
                  }
                });
              } else {
                console.log("Loaded private key w/o passphrase");
                kbpgp.box({
                  msg: content,
                  sign_with: user
                }, function (err, result_string, result_buf) {
                  console.log(err, result_string);
                  event.sender.send('signed-msg', {s_msg: result_string});
                });
              }
            }
            else {
              console.log('error', err);
              return;
            }
          });
        });
      });
    });
  });
});

