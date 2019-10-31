
## Creating and Publishing a New Release

### Manual Method
1. After a chromebook build completes, login to S3 and download the chrome mon zip (`dyknow-devops/artifacts/DyKnow.Monitor.Chromebook/dev-VERSION_NUMBER`).
2. Sign into the chrome developers dashboard (https://chrome.google.com/webstore/developer/dashboard) username is dyknowtechteam password can be found https://github.com/DyKnow/DyKnowMe/wiki/Google-Chrome-Admin-Management-Console-%26-Google-Analytics
3. Select edit
4. Upload the updated package (zip from S3)
5. Select "Publish Changes" at the bottom of the page
6. Update the Chromebook connector_version setting in the database to the newest stable version. (`USE DyKnowMeCore UPDATE Setting SET Value = 'VERSION_NUMBER' WHERE Name = 'dyknow.cloud.v1.connector_version.chromebook' AND Level = 0 AND Foreignid = 0`)


### Private Wonkyd extension
We dont have the private key for this guy. Instead you need to 
1. edit the manifest to remove the key
2. delete the private key form the file

### Getting Started 
1. cd to root and `npm install`
2. if not already installed on the machine `npm install -g grunt-cli`
3. if not installed already `npm install -g karma`
4. if not installed already `npm install -g karma-cli`
5. verify it worked by running `grunt dev`
