# poc_keybase_sign
A proof of concept for signing messages using keybase API

# Install dependencies

You need a recent version of node.js and yarn.
if using debian based distribution you can use your package manager to add PPA and install :

```
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

curl -sL https://deb.nodesource.com/setup_9.x | sudo -E bash -

sudo apt update
sudo apt install nodejs yarn 
```
# Run it

Run `yarn` at repos root and then `npm start`
